# Investigación — Recuérdamelo (features pendientes)

## 1. Formato iCalendar (RFC 5545) para el feed de Apple Calendar

**Decisión**: Generar el feed iCal manualmente como string en `backend/index.js` sin dependencias externas. El formato es texto plano con estructura fija.

**Rationale**: La constitución exige dependencias mínimas. iCal es suficientemente simple para generar sin librería: la estructura es un VCALENDAR con VEVENTs. Una librería como `ical-generator` añadiría ~300 KB sin beneficio real para este caso de uso.

**Alternativas consideradas**:
- `ical-generator` (npm) — descartado por aumentar dependencias sin necesidad
- `ics` (npm) — descartado por la misma razón

**Estructura mínima del feed**:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Recuérdamelo//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Recuérdamelo
BEGIN:VEVENT
UID:<id>@recuerdamelo
DTSTART:<YYYYMMDDTHHMMSSZ>
DTEND:<YYYYMMDDTHHMMSSZ>   ← DTSTART + 1h si no se especifica duración
SUMMARY:<título>
DESCRIPTION:<notas>
RRULE:<regla si es recurrente>
END:VEVENT
...
END:VCALENDAR
```

**RRULE por tipo de recurrencia**:
- Puntual: sin RRULE
- Diario: `RRULE:FREQ=DAILY`
- Semanal: `RRULE:FREQ=WEEKLY;BYDAY=<MO|TU|WE|TH|FR|SA|SU>` (día derivado de la fecha del evento)
- Anual: `RRULE:FREQ=YEARLY`

**Fechas**: formato UTC `YYYYMMDDTHHMMSSZ`. Los eventos tienen fecha `YYYY-MM-DD` y hora opcional `HH:MM` en hora local del usuario. Al construir el feed, se parsean como hora local del servidor (Railway). Dado que es uso personal y el servidor corre en UTC, el usuario deberá tenerlo en cuenta o podemos asumir que Railway siempre corre en UTC y los eventos del frontend ya se almacenan en hora local — el feed generará los eventos con la hora tal como está almacenada en UTC (comportamiento actual de syncNotifications). Veredicto: usar la hora exacta del campo `time` del evento como hora UTC en el DTSTART.

**Content-Type**: `text/calendar; charset=utf-8`

**Header de refresco**: `Cache-Control: no-cache, max-age=0` para que Apple Calendar siempre obtenga el estado actual.

---

## 2. Touch events para swipe-to-dismiss del modal

**Decisión**: Implementar con `touchstart` / `touchmove` / `touchend` nativos sobre el elemento `.modal`. Sin librería.

**Rationale**: El gesto solo requiere ~25 líneas de JS. Librerías como Hammer.js son excesivas.

**Implementación**:
```js
// umbral de pixels para confirmar el cierre
const SWIPE_THRESHOLD = 80;

modal.addEventListener('touchstart', e => {
  startY = e.touches[0].clientY;
  modal.style.transition = 'none';
});
modal.addEventListener('touchmove', e => {
  const delta = e.touches[0].clientY - startY;
  if (delta > 0) modal.style.transform = `translateY(${delta}px)`;
});
modal.addEventListener('touchend', e => {
  const delta = e.changedTouches[0].clientY - startY;
  modal.style.transition = 'transform 0.25s';
  if (delta > SWIPE_THRESHOLD) {
    closeModal('add-modal');
  } else {
    modal.style.transform = 'translateY(0)';
  }
});
```

**Alternativas consideradas**:
- Hammer.js — descartado por añadir dependencia innecesaria
- CSS `overscroll-behavior` — no aplica aquí, es para scroll containers

---

## 3. Esquema webcal:// para suscripción automática a Apple Calendar

**Decisión**: Construir el botón con `href="webcal://<host>/calendar.ics?token=<token>"`.

**Rationale**: El esquema `webcal://` es interceptado por iOS y macOS de forma nativa. Al pulsarlo en Safari (o cualquier enlace en una WebView), el sistema operativo abre Apple Calendar directamente con un diálogo de suscripción. El usuario solo necesita pulsar "Suscribirse" — un único paso de configuración.

**Comportamiento en plataformas**:
- **iOS 16+**: Abre Apple Calendar con diálogo de suscripción ✅
- **macOS**: Abre Apple Calendar con diálogo de suscripción ✅
- **Android/Chrome**: No soporta `webcal://` nativamente. El botón no funcionará en Android. Aceptable dado que el objetivo es Apple Calendar.

**Alternativas consideradas**:
- URL https:// con `.ics` extension — requiere que el usuario descargue y abra manualmente el fichero cada vez; no es suscripción continua
- CalDAV server — descartado por complejidad (bidireccional, protocolo XML)

---

## 4. Problema de arquitectura: acceso del servidor a los eventos completos

**Decisión**: Ampliar el payload del endpoint existente `POST /notifications` para incluir también `events: Event[]`. El servidor almacena los eventos junto a la suscripción en la Map en memoria.

**Rationale**: Los eventos completos (con fecha, título, recurrencia) residen en localStorage del frontend y el servidor solo conoce las notificaciones pre-computadas `{time, title, body, tag}`. Para generar el feed iCal, el servidor necesita los datos completos. Ampliar el payload existente es el cambio mínimo (un campo adicional) y no requiere nuevo endpoint ni cambiar el modelo de sincronización.

**Nuevo shape del entry en la Map**:
```js
subscriptions: Map<id, {
  subscription: PushSubscription,
  notifications: Notification[],
  events: Event[]   // ← nuevo campo
}>
```

**Alternativas consideradas**:
- Nuevo endpoint `POST /events` — añade superficie de API sin beneficio; dos llamadas en lugar de una
- Generar iCal en el frontend (Service Worker) — los Service Workers no pueden servir URLs públicas accesibles por Apple Calendar
