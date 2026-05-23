# Plan de implementación: Recuérdamelo — features pendientes

**Rama**: `main` | **Fecha**: 2026-05-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification en `specs/001-pwa-recordatorios/spec.md`

## Resumen

Conjunto de mejoras a la PWA Recuérdamelo agrupadas en cinco áreas: (1) sincronización
unidireccional con Apple Calendar vía feed iCal autenticado, (2) rediseño de la vista
Inicio como panel de resumen, (3) popup de detalle al pulsar un día en el Calendario,
(4) eliminación de la lista inferior del mes en la vista Calendario, y (5) mejoras de
interacción (swipe-to-dismiss en el modal, FAB siempre visible). Todo el trabajo se
concentra en dos ficheros: `backend/index.js` y `frontend/index.html`.

## Contexto técnico

**Lenguaje/Versión**: Node.js ≥ 18 (backend CommonJS) + HTML/CSS/JS puro (frontend)

**Dependencias principales**: Express 4.x, web-push 3.x, cors — sin nuevas dependencias

**Almacenamiento**: En memoria (`Map`) — sin base de datos, aceptable por constitución

**Testing**: Manual (no hay test runner; pruebas descritas en los escenarios de aceptación del spec)

**Plataforma destino**: Railway (servidor) + navegadores modernos con soporte PWA (Safari 16.4+, Chrome, Edge)

**Tipo de proyecto**: Servicio web + PWA frontend, monorepo en un único proceso

**Objetivos de rendimiento**:
- Feed iCal: respuesta < 50 ms (generación en memoria, sin I/O)
- Popup de día: aparece ≤ 150 ms tras pulsar
- Panel de resumen Inicio: carga ≤ 200 ms

**Restricciones**:
- Sin compilación, sin TypeScript, sin bundler — Node.js CommonJS puro
- Sin nuevas dependencias npm de producción
- `ICAL_TOKEN` debe suministrarse como variable de entorno

**Escala/Alcance**: 1 usuario, 1 servidor, < 100 eventos/tareas en memoria

## Constitution Check

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. Simplicidad | ✅ PASA | iCal generado como string sin librería; swipe con ~25 líneas JS; popup con JS puro |
| II. Ámbito personal | ✅ PASA | Todas las features son para el usuario único; el token iCal es el único mecanismo de acceso al feed |
| III. Fiabilidad notificaciones | ✅ PASA | No se modifica el planificador minutal |
| IV. Dependencias mínimas | ✅ PASA | Cero dependencias nuevas |
| V. Secretos por entorno | ✅ PASA | `ICAL_TOKEN` suministrado como variable de entorno Railway |
| VI. Idioma castellano | ✅ PASA | Toda la documentación en castellano; comentarios en código también |

**Veredicto**: Sin violaciones. No se requiere tabla de seguimiento de complejidad.

## Estructura del proyecto

### Documentación (esta feature)

```text
specs/001-pwa-recordatorios/
├── plan.md          ← este archivo
├── research.md      ← Phase 0
├── data-model.md    ← Phase 1
├── quickstart.md    ← Phase 1
├── contracts/
│   └── api.md       ← Phase 1
└── tasks.md         ← Phase 2 (generado por /speckit-tasks)
```

### Código fuente (ficheros modificados)

```text
backend/
└── index.js        ← añadir endpoint GET /calendar.ics y campo events en POST /notifications

frontend/
└── index.html      ← modificar renderHome, renderCalendar, modal (swipe + FAB)
```

## Áreas de cambio detalladas

### A. Backend — feed iCal (`backend/index.js`)

1. **Ampliar `POST /notifications`**: aceptar campo opcional `events: Event[]` en el body
   y almacenarlo en la entrada de la Map junto a `notifications`.

2. **Nuevo endpoint `GET /calendar.ics`**:
   - Verificar `?token=` contra `ICAL_TOKEN` (env var o generado en arranque)
   - Obtener eventos del último deviceId registrado
   - Generar string iCal (RFC 5545) iterando sobre los eventos
   - Mapear recurrencia → RRULE:
     - `puntual` → sin RRULE
     - `diario` → `RRULE:FREQ=DAILY`
     - `semanal` → `RRULE:FREQ=WEEKLY;BYDAY=<día>` (calcular día de `event.date`)
     - `anual` → `RRULE:FREQ=YEARLY`
   - Devolver `text/calendar; charset=utf-8` con `Cache-Control: no-cache`

3. **`ICAL_TOKEN` en arranque**: si `process.env.ICAL_TOKEN` no existe, generar token
   aleatorio con `crypto.randomBytes(16).toString('hex')` y loguear en stdout.

### B. Frontend — campo `recurrence` en eventos (`frontend/index.html`)

**Gap crítico** (detectado en data-model.md): la recurrencia del evento no se persiste
en el objeto guardado en localStorage. El modal la usa para calcular notificaciones pero
no la guarda. Es necesario añadirla para el feed iCal y para mostrarla en el popup.

- En `saveItem()`: cuando `currentType === 'evento'`, añadir `recurrence` al objeto.
  El valor viene del selector de recurrencia del modal (que actualmente solo tiene
  el campo en tareas — hay que añadirlo también para eventos).
- Añadir selector de recurrencia al formulario de evento en el modal HTML.
- Actualizar `syncNotifications()` para incluir `events` en el payload de
  `POST /notifications`.

### C. Frontend — vista Inicio rediseñada (`renderHome`)

- Eliminar las pestañas de categoría y la lista completa de eventos.
- Reemplazar por dos bloques:
  - **Próximos eventos**: los 5 más cercanos por `date`, con título, fecha/hora,
    color de categoría. Cada tarjeta es pulsable → abre modal de edición.
  - **Tareas activas**: contador + lista de títulos de tareas pendientes.
    Cada ítem es pulsable → abre modal de edición.
- Estado vacío: mensaje individual por bloque.

### D. Frontend — vista Calendario rediseñada (`renderCalendar`)

- **Eliminar** la lista "Este mes" debajo del grid (código `evList`).
- **Añadir interactividad** a cada celda del grid: `onclick="openDayPopup('YYYY-MM-DD')"`.
- **Nuevo popup de día**: elemento HTML posicionado absolutamente (o `position: fixed`),
  centrado, con `backdrop-filter: blur(8px)` en el overlay.
  - Muestra la fecha del día seleccionado como cabecera.
  - Lista todos los eventos del día con: título, hora, categoría (nombre + color),
    notas y tipo de recurrencia.
  - Si no hay eventos: "Sin eventos este día".
  - Cada evento pulsable → cierra el popup y abre modal de edición.
  - Pulsar fuera del popup (overlay) → cierra el popup.

### E. Frontend — botón "Añadir a Apple Calendar"

- Añadir en la cabecera de la vista Calendario un botón/enlace que construya la URL
  `webcal://<host>/calendar.ics?token=<token>`.
- El token debe venir del servidor: nuevo endpoint `GET /ical-token` que devuelve el
  token (solo la parte pública de la URL, no el secreto en sí — el token ya es el
  secreto de acceso).
- Alternativa más simple: hacer que el frontend obtenga el token de
  `GET /vapid-public` amplíado, o añadir `GET /ical-setup` que devuelva la URL
  completa `webcal://...` lista para usar. **Decisión**: nuevo endpoint
  `GET /ical-setup` que devuelve `{ url: 'webcal://...' }` — mínima exposición.

### F. Frontend — swipe-to-dismiss en el modal

- Añadir listeners `touchstart` / `touchmove` / `touchend` sobre el elemento `.modal`.
- Umbral: 80 px de desplazamiento hacia abajo → cierra sin confirmación.
- Animación: durante el drag, `transform: translateY(Xpx)` sin transición CSS;
  al soltar, restaurar transición y snap back o close.

### G. Frontend — FAB siempre visible

- Eliminar la línea `document.getElementById('fab').style.display=v==='calendar'?'none':'flex'`
  en `switchView()`.
- El FAB abre el modal de creación en todas las pestañas (comportamiento ya existente).

## Orden de implementación recomendado

1. **G** — FAB (1 línea, riesgo mínimo)
2. **F** — Swipe-to-dismiss (JS puro, sin dependencias)
3. **B** — Campo `recurrence` en eventos (necesario antes de A y D)
4. **A** — Backend iCal (independiente del frontend)
5. **E** — Botón Apple Calendar (depende de A)
6. **C** — Vista Inicio rediseñada
7. **D** — Vista Calendario + popup de día

## Artefactos generados

- `research.md` — decisiones técnicas y alternativas descartadas
- `data-model.md` — entidades, campos nuevos y variables de entorno
- `contracts/api.md` — contratos de los endpoints modificados/nuevos
- `quickstart.md` — instrucciones de configuración del `ICAL_TOKEN` y suscripción
