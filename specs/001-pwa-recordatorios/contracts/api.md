# Contratos de API — Recuérdamelo

## Endpoints existentes (sin cambios)

### POST /subscribe
Registra o renueva la suscripción push de un dispositivo.

**Body**: `{ id: string, subscription: PushSubscription }`
**Response**: `{ ok: true }` | HTTP 400

### GET /vapid-public
Devuelve la clave pública VAPID para el cliente.

**Response**: `{ key: string }`

### GET /
Health check.

**Response**: `{ status: 'ok', subs: number }`

---

## Endpoints modificados

### POST /notifications
Sincroniza notificaciones computadas **y eventos completos** del dispositivo.

**Body (antes)**:
```json
{
  "id": "abc123",
  "notifications": [{ "time": "HH:MM", "title": "...", "body": "...", "tag": "..." }]
}
```

**Body (ahora)**:
```json
{
  "id": "abc123",
  "notifications": [{ "time": "HH:MM", "title": "...", "body": "...", "tag": "..." }],
  "events": [
    {
      "id": "xyz",
      "title": "Médico",
      "date": "2026-06-15",
      "time": "10:30",
      "notes": "Traer análisis",
      "recurrence": "puntual"
    }
  ]
}
```

**Cambio en servidor**: almacenar `events` junto a la entrada de la suscripción.

**Response**: `{ ok: true }` | HTTP 400 | HTTP 404

---

## Endpoints nuevos

### GET /calendar.ics?token=\<token\>
Devuelve el feed iCalendar (RFC 5545) con todos los eventos del dispositivo.

**Auth**: Query param `token` debe coincidir con `ICAL_TOKEN` del servidor.

**Response (éxito)**:
- Status: `200 OK`
- Content-Type: `text/calendar; charset=utf-8`
- Cache-Control: `no-cache, max-age=0`
- Body: feed iCal con todos los eventos activos

**Response (error)**:
- `401 Unauthorized` si token ausente o incorrecto
- `404 Not Found` si no existe ninguna suscripción registrada

**Ejemplo de body**:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Recuérdamelo//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Recuérdamelo
BEGIN:VEVENT
UID:xyz@recuerdamelo
DTSTART:20260615T083000Z
DTEND:20260615T093000Z
SUMMARY:Médico
DESCRIPTION:Traer análisis
END:VEVENT
END:VCALENDAR
```

**Nota**: El endpoint obtiene los eventos del primer (y único) deviceId registrado
en la Map. Si hay múltiples deviceIds (p. ej. reinstalación), usa el más reciente.
