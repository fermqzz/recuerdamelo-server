# Guía de puesta en marcha — features pendientes

## Variables de entorno a configurar en Railway

Añadir a las variables existentes (`VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_EMAIL`):

| Variable     | Cómo obtenerla                                      |
|--------------|-----------------------------------------------------|
| `ICAL_TOKEN` | Cualquier string aleatorio largo. Ejemplo: ejecutar `openssl rand -hex 32` en terminal y copiar el resultado. |

Si `ICAL_TOKEN` no está definido, el servidor genera uno temporal en arranque y lo imprime en los logs de Railway. **No persiste entre reinicios** — configurarlo como variable de entorno permanente.

## Añadir el calendario a Apple Calendar (una sola vez)

1. Abrir la app en el iPhone/Mac
2. Ir a la pestaña **Calendario**
3. Pulsar el botón **"Añadir a Apple Calendar"**
4. iOS/macOS abre Apple Calendar con el diálogo de suscripción
5. Pulsar **"Suscribirse"** — listo

A partir de ahí, Apple Calendar refresca el feed automáticamente (cada hora por defecto).

## Verificación del feed

Acceder directamente en el navegador a:
```
https://recuerdamelo-server-production.up.railway.app/calendar.ics?token=<ICAL_TOKEN>
```

Debe devolver texto con `BEGIN:VCALENDAR` si hay eventos guardados.
Un `401` indica token incorrecto. Un `404` indica que no hay suscripción registrada aún.
