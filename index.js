const express = require('express');
const cors = require('cors');
const webpush = require('web-push');

const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// VAPID config — estas claves van también en las variables de entorno de Railway
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@recuerdamelo.app';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// Suscripciones en memoria (Railway las mantiene mientras el servidor esté vivo)
// Para persistencia real usarías una DB, pero esto es suficiente para uso personal
const subscriptions = new Map(); // id -> { subscription, notifications }

// ── Guardar suscripción ──
app.post('/subscribe', (req, res) => {
  const { id, subscription } = req.body;
  if (!id || !subscription) return res.status(400).json({ error: 'Faltan datos' });

  const existing = subscriptions.get(id) || { subscription, notifications: [] };
  existing.subscription = subscription;
  subscriptions.set(id, existing);

  console.log(`Suscripción guardada: ${id}`);
  res.json({ ok: true });
});

// ── Guardar notificaciones programadas ──
app.post('/notifications', (req, res) => {
  const { id, notifications } = req.body;
  if (!id || !Array.isArray(notifications)) return res.status(400).json({ error: 'Faltan datos' });

  const entry = subscriptions.get(id);
  if (!entry) return res.status(404).json({ error: 'Suscripción no encontrada' });

  entry.notifications = notifications;
  subscriptions.set(id, entry);

  console.log(`Notificaciones actualizadas para ${id}: ${notifications.length}`);
  res.json({ ok: true });
});

// ── Health check ──
app.get('/', (req, res) => res.json({ status: 'ok', subs: subscriptions.size }));

// ── VAPID public key para el cliente ──
app.get('/vapid-public', (req, res) => res.json({ key: VAPID_PUBLIC }));

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
          // Suscripción expirada — limpiar
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
