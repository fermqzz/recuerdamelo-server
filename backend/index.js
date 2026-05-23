const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const crypto = require('crypto');

const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

// VAPID config — estas claves van también en las variables de entorno de Railway
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@recuerdamelo.app';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// Token para autenticar el feed iCal — configurar ICAL_TOKEN en Railway
const ICAL_TOKEN = process.env.ICAL_TOKEN || (() => {
  const token = crypto.randomBytes(16).toString('hex');
  console.log(`ICAL_TOKEN no configurado. Token temporal para esta sesión: ${token}`);
  console.log('Configura ICAL_TOKEN como variable de entorno en Railway para que persista.');
  return token;
})();

// Suscripciones en memoria (Railway las mantiene mientras el servidor esté vivo)
const subscriptions = new Map(); // id -> { subscription, notifications, events }

// ── Guardar suscripción ──
app.post('/subscribe', (req, res) => {
  const { id, subscription } = req.body;
  if (!id || !subscription) return res.status(400).json({ error: 'Faltan datos' });

  const existing = subscriptions.get(id) || { subscription, notifications: [], events: [] };
  existing.subscription = subscription;
  subscriptions.set(id, existing);

  console.log(`Suscripción guardada: ${id}`);
  res.json({ ok: true });
});

// ── Guardar notificaciones programadas y eventos completos ──
app.post('/notifications', (req, res) => {
  const { id, notifications, events } = req.body;
  if (!id || !Array.isArray(notifications)) return res.status(400).json({ error: 'Faltan datos' });

  const entry = subscriptions.get(id);
  if (!entry) return res.status(404).json({ error: 'Suscripción no encontrada' });

  entry.notifications = notifications;
  if (Array.isArray(events)) entry.events = events;
  subscriptions.set(id, entry);

  console.log(`Notificaciones actualizadas para ${id}: ${notifications.length} notifs, ${(events||[]).length} eventos`);
  res.json({ ok: true });
});

// ── Health check ──
app.get('/', (req, res) => res.json({ status: 'ok', subs: subscriptions.size }));

// ── VAPID public key para el cliente ──
app.get('/vapid-public', (req, res) => res.json({ key: VAPID_PUBLIC }));

// ── URL de suscripción iCal para Apple Calendar ──
app.get('/ical-setup', (req, res) => {
  const host = req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  // webcal:// es el esquema que iOS/macOS intercepta para abrir Apple Calendar
  const url = `webcal://${host}/calendar.ics?token=${ICAL_TOKEN}`;
  res.json({ url });
});

// ── Feed iCal (RFC 5545) ──
app.get('/calendar.ics', (req, res) => {
  if (req.query.token !== ICAL_TOKEN) {
    return res.status(401).send('No autorizado');
  }

  // Obtener eventos del último deviceId registrado
  let eventos = [];
  for (const entry of subscriptions.values()) {
    if (entry.events && entry.events.length > 0) {
      eventos = entry.events;
    }
  }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.send(generarIcal(eventos));
});

// ── Genera string iCalendar (RFC 5545) a partir del array de eventos ──
function generarIcal(eventos) {
  const DIAS_EN = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  function fechaUtc(dateStr, timeStr) {
    // dateStr: 'YYYY-MM-DD', timeStr: 'HH:MM' (hora local del usuario, tratada como UTC)
    const [y, m, d] = dateStr.split('-');
    const [hh, mm] = (timeStr || '09:00').split(':');
    return `${y}${m}${d}T${hh}${mm}00Z`;
  }

  function rrule(recurrence, dateStr) {
    if (!recurrence || recurrence === 'puntual') return '';
    if (recurrence === 'diario') return 'RRULE:FREQ=DAILY';
    if (recurrence === 'anual') return 'RRULE:FREQ=YEARLY';
    if (recurrence === 'semanal') {
      const diaSemana = new Date(dateStr + 'T12:00:00Z').getUTCDay();
      return `RRULE:FREQ=WEEKLY;BYDAY=${DIAS_EN[diaSemana]}`;
    }
    return '';
  }

  const vevents = eventos
    .filter(e => e.date)
    .map(e => {
      const dtstart = fechaUtc(e.date, e.time);
      // DTEND = DTSTART + 1 hora
      const [y, m, d] = e.date.split('-');
      const [hh, mm] = (e.time || '09:00').split(':');
      const endH = String(parseInt(hh) + 1).padStart(2, '0');
      const dtend = `${y}${m}${d}T${endH}${mm}00Z`;

      return [
        'BEGIN:VEVENT',
        `UID:${e.id}@recuerdamelo`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${e.title}`,
        e.notes ? `DESCRIPTION:${e.notes.replace(/\n/g, '\\n')}` : '',
        rrule(e.recurrence, e.date),
        'END:VEVENT',
      ].filter(Boolean).join('\r\n');
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Recuerdamelo//Recuerdamelo//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Recuerdamelo',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

// ── Enviar notificaciones programadas cada minuto ──
setInterval(async () => {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  for (const [id, entry] of subscriptions.entries()) {
    const toSend = entry.notifications.filter(n => n.time === hhmm);

    for (const notif of toSend) {
      try {
        await webpush.sendNotification(
          entry.subscription,
          JSON.stringify({ title: notif.title, body: notif.body, tag: notif.tag })
        );
        console.log(`Notificación enviada a ${id}: ${notif.title}`);
      } catch (err) {
        if (err.statusCode === 410) {
          subscriptions.delete(id);
          console.log(`Suscripción eliminada (expirada): ${id}`);
        } else {
          console.error(`Error enviando a ${id}:`, err.message);
        }
      }
    }
  }
}, 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
