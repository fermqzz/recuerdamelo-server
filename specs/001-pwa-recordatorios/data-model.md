# Modelo de datos — Recuérdamelo (features pendientes)

## Entidades del frontend (localStorage: `recuerdamelo_v1`)

Sin cambios en estructura. Se documenta para referencia del generador iCal.

### Evento
```js
{
  id: string,          // uid() — 7 chars aleatorios
  type: 'evento',
  title: string,
  catId: string,       // FK → Categoría.id
  done: boolean,
  createdAt: ISO8601,
  date: string|null,   // 'YYYY-MM-DD'
  time: string|null,   // 'HH:MM' en hora local del usuario
  notes: string,
  recurrence: null     // siempre null en eventos (campo legacy de tareas)
}
```

**Recurrencia de eventos**: No está almacenada como campo en el objeto evento.
El tipo de recurrencia se infiere del campo `tag` en las notificaciones computadas,
o se fija en el modal (selector puntual/diario/semanal/anual). 

⚠️ **Gap identificado**: El campo de recurrencia del evento no se persiste en el objeto.
El frontend calcula las notificaciones pero no guarda el tipo de recurrencia elegido.
Para el feed iCal, necesitamos que el evento incluya el campo `recurrence`.

**Corrección necesaria**: Añadir `recurrence: 'puntual'|'diario'|'semanal'|'anual'`
al objeto Evento al guardarlo en localStorage.

### Tarea
```js
{
  id: string,
  type: 'tarea',
  title: string,
  catId: string,
  done: boolean,
  createdAt: ISO8601,
  recurrence: number,  // 1|2|3|5 — veces al día
  notes: string,
  date: null,
  time: null
}
```

### Categoría
```js
{
  id: string,
  name: string,
  color: string  // hex, ej. '#0055ff'
}
```

## Estado del servidor (en memoria)

### Map `subscriptions`
```js
Map<deviceId: string, {
  subscription: PushSubscription,  // objeto de suscripción Web Push
  notifications: Array<{
    time: string,    // 'HH:MM' UTC
    title: string,
    body: string,
    tag: string
  }>,
  events: Array<{    // ← NUEVO: enviado desde el frontend en POST /notifications
    id: string,
    title: string,
    date: string,    // 'YYYY-MM-DD'
    time: string,    // 'HH:MM' hora local
    notes: string,
    recurrence: 'puntual'|'diario'|'semanal'|'anual'
  }>
}>
```

## Variables de entorno (nuevas)

| Variable     | Descripción                              | Requerida |
|--------------|------------------------------------------|-----------|
| `ICAL_TOKEN` | Token secreto para autenticar el feed iCal | Sí (genera warning si ausente, usa fallback en memoria) |

## Reglas de validación

- `ICAL_TOKEN` vacío o ausente → el servidor genera un token aleatorio en arranque y
  lo loguea en stdout para que el usuario pueda configurarlo. El feed es accesible
  durante la sesión pero se pierde al reiniciar.
- Evento sin `date` → se excluye del feed iCal (no tiene coordenada temporal).
- Evento con `recurrence: 'puntual'` → se incluye como VEVENT sin RRULE.
- Solicitud a `/calendar.ics` sin token o con token incorrecto → HTTP 401.
