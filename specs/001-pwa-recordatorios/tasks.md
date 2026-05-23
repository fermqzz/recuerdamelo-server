# Tasks: Recuérdamelo — features pendientes

**Input**: Documentos de diseño en `specs/001-pwa-recordatorios/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: No se incluyen tareas de test automatizado (no especificado en el spec). La verificación es manual según los escenarios de aceptación del spec.

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y verificación independiente.

## Formato: `[ID] [P?] [Story] Descripción con ruta de fichero`

- **[P]**: Se puede ejecutar en paralelo (ficheros distintos, sin dependencias incompletas)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US0, US3b, US6, US-UX)
- Los ficheros a modificar son siempre `backend/index.js` o `frontend/index.html`

---

## Phase 1: Setup

Sin trabajo de setup — el proyecto ya está inicializado y corriendo en Railway.

---

## Phase 2: Fundacional (Prerrequisitos bloqueantes)

**Propósito**: Añadir el campo `recurrence` al objeto Evento y ampliar el payload de sincronización al servidor. Bloquea US3b (popup necesita mostrar recurrencia) y US6 (iCal necesita el tipo de recurrencia para generar RRULE).

**⚠️ CRÍTICO**: Las fases US3b y US6 no pueden empezar hasta que esta fase esté completa.

- [x] T001 Añadir selector de recurrencia (puntual/diario/semanal/anual) al bloque `#evento-fields` del modal en `frontend/index.html`
- [x] T002 Guardar campo `recurrence: 'puntual'|'diario'|'semanal'|'anual'` en el objeto Evento dentro de `saveItem()` en `frontend/index.html`
- [x] T003 [P] Ampliar `syncNotifications()` para incluir `events` (array de objetos `{id, title, date, time, notes, recurrence}`) en el body de `POST /notifications` en `frontend/index.html`
- [x] T004 [P] Ampliar `POST /notifications` en `backend/index.js` para aceptar y almacenar `events: Event[]` en la Map de suscripciones junto a `notifications`
- [x] T005 Añadir inicialización de `ICAL_TOKEN` al arranque en `backend/index.js`: usar `process.env.ICAL_TOKEN` o generar con `crypto.randomBytes(16).toString('hex')` y loguear en stdout

**Checkpoint**: Campo `recurrence` persiste en localStorage y el servidor almacena `events` junto a cada suscripción.

---

## Phase 3: US0 — Panel de resumen en vista Inicio (Prioridad: P1) 🎯 MVP

**Objetivo**: Rediseñar la vista Inicio como dashboard con dos bloques: eventos próximos y tareas activas. Eliminar lista completa de eventos y pestañas de categoría de esta vista.

**Test independiente**: Con 7 eventos en fechas distintas y 3 tareas activas, verificar que Inicio muestra solo los 5 más próximos y las 3 tareas con sus títulos. Eliminar todos los eventos y verificar mensaje "Sin eventos próximos".

### Implementación US0

- [x] T006 [US0] Eliminar las pestañas de categoría (función `renderTabs` y su contenedor `#tabs-container`) y la lista completa de eventos de `renderHome()` en `frontend/index.html`
- [x] T007 [US0] Implementar bloque "Próximos eventos" en `renderHome()`: filtrar eventos con `date >= hoy`, ordenar por fecha, tomar los 5 primeros, renderizar tarjeta con título + fecha/hora + color de categoría en `frontend/index.html`
- [x] T008 [US0] Implementar bloque "Tareas activas" en `renderHome()`: contar tareas pendientes (`done: false`), listar sus títulos en `frontend/index.html`
- [x] T009 [US0] Añadir mensajes de estado vacío por bloque: "Sin eventos próximos" y "Sin tareas activas" en `frontend/index.html`
- [x] T010 [US0] Conectar cada tarjeta del resumen (eventos y tareas) al modal de edición existente mediante `onclick="openEditModal('${item.id}')"` en `frontend/index.html`

**Checkpoint**: La vista Inicio muestra el panel de resumen con los 5 eventos más próximos y las tareas activas. Pulsar cualquier elemento abre el modal de edición/borrado.

---

## Phase 4: US3b — Popup de día en vista Calendario (Prioridad: P1)

**Objetivo**: Reemplazar la lista inferior "Este mes" por un popup centrado que aparece al pulsar cualquier día del grid, mostrando todos los eventos de ese día con detalle completo.

**Test independiente**: Con eventos en distintos días, pulsar un día con eventos y verificar que el popup muestra título, hora, categoría (nombre + color), notas y tipo de recurrencia. Pulsar un día sin eventos y verificar mensaje "Sin eventos este día". Pulsar fuera del popup y verificar que se cierra.

### Implementación US3b

- [x] T011 [US3b] Añadir estilos CSS para el popup de día: overlay con `backdrop-filter: blur(8px)`, contenedor centrado con `position: fixed`, estilos para la lista de eventos y el estado vacío en `frontend/index.html`
- [x] T012 [US3b] Eliminar la variable `evList` y su renderizado (lista "Este mes") de `renderCalendar()` en `frontend/index.html`
- [x] T013 [US3b] Añadir `onclick="openDayPopup('${ds}')"` a cada celda del grid generada en `renderCalendar()` en `frontend/index.html`
- [x] T014 [US3b] Implementar función `openDayPopup(dateStr)`: filtrar `state.items` por `type === 'evento'` y `date === dateStr`, renderizar el popup con título de la fecha y lista de eventos (título, hora, nombre y color de categoría, notas, recurrencia) en `frontend/index.html`
- [x] T015 [US3b] Añadir estado vacío dentro del popup: si no hay eventos para el día, mostrar "Sin eventos este día" en `frontend/index.html`
- [x] T016 [US3b] Vincular cada evento del popup a `openEditModal(id)` cerrando el popup primero en `frontend/index.html`
- [x] T017 [US3b] Implementar cierre del popup al pulsar el overlay (`backdrop`): añadir listener de click al overlay que llame a `closeDayPopup()` en `frontend/index.html`

**Checkpoint**: Pulsar cualquier día del grid abre el popup centrado. El popup muestra todos los campos del evento o mensaje vacío. Pulsar fuera lo cierra. Pulsar un evento abre el modal de edición.

---

## Phase 5: US6 — Sincronización con Apple Calendar (Prioridad: P2)

**Objetivo**: Exponer un feed iCal autenticado por token. Añadir botón en la vista Calendario que abre Apple Calendar automáticamente para suscribirse (webcal://).

**Test independiente**: Acceder a `/calendar.ics?token=<ICAL_TOKEN>` en el navegador y verificar que devuelve texto con `BEGIN:VCALENDAR`. Pulsar el botón en la vista Calendario en iOS y verificar que Apple Calendar muestra el diálogo de suscripción.

### Implementación US6

- [x] T018 [US6] Implementar función `generarIcal(events)` en `backend/index.js` que produce string RFC5545 con `BEGIN:VCALENDAR`, un `VEVENT` por evento (con `UID`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`) y `RRULE` según `recurrence` (puntual→sin RRULE, diario→`FREQ=DAILY`, semanal→`FREQ=WEEKLY;BYDAY=<día>`, anual→`FREQ=YEARLY`)
- [x] T019 [US6] Implementar endpoint `GET /calendar.ics` en `backend/index.js`: verificar `?token=` contra `ICAL_TOKEN`, obtener eventos del último deviceId registrado, llamar a `generarIcal()` y devolver `text/calendar; charset=utf-8` con `Cache-Control: no-cache`
- [x] T020 [P] [US6] Implementar endpoint `GET /ical-setup` en `backend/index.js` que devuelve `{ url: 'webcal://<host>/calendar.ics?token=<ICAL_TOKEN>' }` (construir host desde `req.headers.host`)
- [x] T021 [US6] Añadir botón "Añadir a Apple Calendar" en la cabecera de la vista Calendario en `frontend/index.html`: al pulsar, hace `fetch('/ical-setup')` y redirige al `url` devuelto

**Checkpoint**: El endpoint `/calendar.ics` devuelve un feed iCal válido. El botón en Calendario abre Apple Calendar en iOS/macOS con el diálogo de suscripción.

---

## Phase 6: US-UX — Mejoras de interacción (transversales)

**Objetivo**: FAB siempre visible en todas las pestañas. Modal de creación/edición cierra con swipe hacia abajo.

**Test independiente**: Navegar a la pestaña Calendario y verificar que el FAB (+) es visible. Abrir el modal, escribir texto y deslizar hacia abajo; verificar que se cierra sin confirmación y los datos se descartan.

### Implementación US-UX

- [x] T022 [US-UX] Eliminar la condición `v==='calendar'?'none':'flex'` que ocultaba el FAB en `switchView()` en `frontend/index.html`
- [x] T023 [US-UX] Implementar swipe-to-dismiss en el elemento `.modal` en `frontend/index.html`: listeners `touchstart` (registrar `startY`), `touchmove` (aplicar `translateY(deltaY)` si delta > 0, sin transición CSS), `touchend` (si delta > 80px → `closeModal('add-modal')`; si no → snap back con transición)

**Checkpoint**: El FAB aparece en todas las pestañas. Deslizar el modal hacia abajo ≥ 80 px lo cierra sin diálogo.

---

## Phase 7: Polish y verificación final

- [ ] T024 [P] Verificar feed iCal en navegador: acceder a `https://recuerdamelo-server-production.up.railway.app/calendar.ics?token=<ICAL_TOKEN>` y confirmar `BEGIN:VCALENDAR` con eventos correctos
- [ ] T025 [P] Verificar suscripción webcal:// en iOS: pulsar "Añadir a Apple Calendar" y confirmar que Apple Calendar muestra el diálogo de suscripción
- [ ] T026 Verificar que eventos con recurrencia (diario/semanal/anual) aparecen como eventos recurrentes en Apple Calendar tras suscripción
- [ ] T027 Actualizar `specs/001-pwa-recordatorios/quickstart.md` si las instrucciones difieren de la implementación real

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Fundacional (Phase 2)**: Sin dependencias — empezar aquí
- **US0 (Phase 3)**: Solo depende de Phase 2 (necesita `recurrence` en eventos para mostrarla en tarjetas)
- **US3b (Phase 4)**: Depende de Phase 2 (campo `recurrence` necesario para mostrar en popup)
- **US6 (Phase 5)**: Depende de Phase 2 (campo `recurrence` necesario para generar RRULE); T018-T020 también dependen de T004 (servidor almacena `events`)
- **US-UX (Phase 6)**: Sin dependencias — se puede trabajar en paralelo con cualquier otra fase
- **Polish (Phase 7)**: Depende de Phase 5 (US6 debe estar desplegado)

### Paralelismo dentro de Phase 2

```
T001 → T002 → T003  (frontend, secuencial)
T004               (backend, en paralelo con T001-T003)
T005               (backend, en paralelo con T004)
```

### Paralelismo dentro de Phase 5 (US6)

```
T018 → T019  (generarIcal + endpoint /calendar.ics, secuencial)
T020         (endpoint /ical-setup, en paralelo con T018-T019)
T021         (frontend, depende de T020)
```

---

## Estrategia de implementación

### MVP (solo US0 + mejoras UX inmediatas)

1. Completar Phase 2: Fundacional
2. Completar Phase 3: US0 (panel de resumen)
3. Completar Phase 6: US-UX (FAB + swipe)
4. **PARAR Y VALIDAR**: La app tiene nuevo Inicio y gestos mejorados
5. Desplegar y usar

### Entrega incremental completa

1. Phase 2 → Foundation lista
2. Phase 3 (US0) → Inicio rediseñado ✅
3. Phase 4 (US3b) → Popup de día en Calendario ✅
4. Phase 5 (US6) → Apple Calendar sync ✅
5. Phase 6 (US-UX) → FAB + swipe ✅
6. Phase 7 → Verificación final ✅

---

## Notas

- [P] = ficheros distintos o sin dependencias en esa fase, se puede ejecutar en paralelo
- Las fases US-UX (Phase 6) son independientes y pueden intercalarse en cualquier momento
- Hacer commit tras cada fase completada
- Parar en cualquier checkpoint para validar la historia independientemente
