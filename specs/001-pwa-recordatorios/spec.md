# Especificación: Recuérdame — App personal de eventos y tareas con notificaciones push

**Rama**: `001-pwa-recordatorios`

**Fecha**: 2026-05-13

**Estado**: Borrador

**Descripción de entrada**: App PWA personal con notificaciones push que gestiona dos
tipos de elementos distintos: **eventos** (compromisos con fecha/hora, opcionalmente
recurrentes) y **tareas** (cosas pendientes sin fecha fija, recordadas periódicamente
hasta que el usuario las complete). Cada tipo ocupa su propia sección en la app.

## Aclaraciones

### Sesión 2026-05-23

- Q: ¿El modal de creación/edición se puede cerrar deslizando hacia abajo desde el drag handle? → A: Sí. El gesto swipe-to-dismiss cierra el modal directamente sin confirmación, incluso si hay datos no guardados.
- Q: ¿El FAB (botón +) debe estar visible en todas las pestañas, incluida Calendario? → A: Sí. El FAB está siempre disponible en la esquina inferior derecha independientemente de la pestaña activa.

- Q: ¿La vista Inicio sigue mostrando la lista de eventos con pestañas de categoría? → A: No. La lista de eventos con pestañas desaparece; Inicio se convierte en un panel de resumen puro.
- Q: ¿Cuántos eventos próximos muestra el resumen de Inicio? → A: Los próximos 5 eventos por fecha de ocurrencia, independientemente del día.
- Q: ¿Qué muestra el bloque de tareas en el resumen? → A: Contador de tareas pendientes + lista de sus títulos.
- Q: ¿Qué muestra cada bloque cuando está vacío? → A: Mensaje propio por bloque: "Sin eventos próximos" y "Sin tareas activas".

- Q: ¿Debe eliminarse la lista "Este mes" bajo el grid del calendario? → A: Sí. La lista inferior de eventos del mes se elimina; la única forma de ver eventos es pulsando un día.
- Q: ¿Qué ocurre al pulsar un día sin eventos? → A: Se abre el popup con mensaje "Sin eventos este día".
- Q: ¿Qué información muestra cada evento en el popup del día? → A: Todos los campos: título, hora, categoría (con color), notas y tipo de recurrencia.
- Q: ¿El usuario puede gestionar eventos desde el popup? → A: Sí — pulsar un evento en el popup abre el modal de edición/borrado existente.
- Q: ¿Cómo cierra el usuario el popup? → A: Tocando fuera del popup (en el fondo desenfocado); sin botón de cierre explícito.

- Q: ¿Qué elementos debe exportar el feed iCal hacia Apple Calendar? → A: Solo eventos (`VEVENT`). Las tareas no tienen fecha/hora fija y se excluyen del feed.
- Q: ¿El feed iCal debe tener protección de acceso? → A: Token secreto en la URL (`/calendar.ics?token=xxxx`). Dado que no hay login, el token evita acceso no autorizado al conocer el dominio.
- Q: ¿Los eventos eliminados desaparecen de Apple Calendar? → A: Sí. Los eventos no tienen estado "completado"; solo se pueden eliminar. Al eliminarse en la app, desaparecen del feed y Apple Calendar los retira en el siguiente refresco.
- Q: ¿Cómo se exportan las recurrencias al feed iCal? → A: Como `RRULE` nativo, para que Apple Calendar gestione las ocurrencias futuras igual que sus propios eventos recurrentes.
- Q: ¿Cómo accede el usuario al feed iCal? → A: Botón "Añadir a Apple Calendar" en la vista Calendario que abre una URL `webcal://` — iOS/macOS lanza Apple Calendar automáticamente y pide confirmación de suscripción (un solo tap, configuración única).

### Sesión 2026-05-13

- P: ¿Los avisos son solo de hora fija diaria, solo puntuales, o ambos? → R: Los eventos admiten ambos: puntuales (fecha+hora exacta) o recurrentes (diario/semanal/anual).
- P: ¿Cómo se ordena la lista de eventos? → R: Todos juntos, ordenados por próxima ocurrencia.
- P: ¿La app diferencia entre eventos (con fecha/hora) y tareas (sin fecha/hora)? → R: Sí. Son dos entidades distintas en secciones separadas. Los eventos tienen fecha y hora y son compromisos. Las tareas no tienen fecha ni hora; la app las recuerda con la frecuencia que el usuario establezca hasta que las marque como hechas.
- P: ¿Con qué frecuencia se recuerdan las tareas y cómo se configura? → R: Siempre diariamente. El usuario elige cuántas veces al día y a qué horas exactas (p. ej. 09:00, 14:00 y 21:00).
- P: En eventos semanales, ¿cómo se determina el día de la semana? → R: Se infiere de la fecha elegida al crear el evento (el día de esa fecha es el día de repetición semanal).
- P: ¿Cómo se calcula la siguiente ocurrencia de un evento anual? → R: Mismo día y mes cada año a la misma hora.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 0 — Panel de resumen en la vista Inicio (Prioridad: P1)

Al abrir la app, el usuario ve la vista Inicio como un panel de resumen con dos bloques:
**Eventos próximos** (los 5 siguientes por fecha) y **Tareas activas** (contador + lista
de títulos pendientes). No hay lista completa ni pestañas de categoría en esta vista.
Si un bloque está vacío, muestra su propio mensaje. Pulsar un evento o tarea abre su
modal de detalle/edición.

**Por qué esta prioridad**: Es la primera pantalla que ve el usuario. Debe dar una
visión útil del estado actual sin requerir navegación adicional.

**Prueba independiente**: Con 7 eventos en distintas fechas y 3 tareas activas,
verificar que Inicio muestra solo los 5 eventos más próximos y las 3 tareas con
sus títulos. Eliminar todos los eventos y verificar que el bloque muestra "Sin
eventos próximos".

**Escenarios de aceptación**:

1. **Dado** que existen eventos futuros, **cuando** el usuario abre la vista Inicio,
   **entonces** ve un bloque "Próximos eventos" con los 5 más cercanos por fecha,
   mostrando título, fecha/hora y color de categoría.
2. **Dado** que existen tareas pendientes, **cuando** el usuario abre la vista Inicio,
   **entonces** ve un bloque "Tareas activas" con el contador total y la lista de títulos.
3. **Dado** que no hay eventos futuros, **cuando** el usuario abre la vista Inicio,
   **entonces** el bloque de eventos muestra "Sin eventos próximos".
4. **Dado** que no hay tareas pendientes, **cuando** el usuario abre la vista Inicio,
   **entonces** el bloque de tareas muestra "Sin tareas activas".
5. **Dado** que el usuario pulsa un evento en el resumen, **cuando** se abre el modal,
   **entonces** puede editarlo o eliminarlo igual que desde cualquier otra vista.
6. **Dado** que el usuario abre la vista Inicio, **cuando** la vista carga, **entonces**
   NO hay pestañas de categoría ni lista completa de eventos en esta vista.

---

### Historia de usuario 1 — Instalar la app y activar notificaciones (Prioridad: P1)

El usuario accede a la app desde el navegador, la añade a la pantalla de inicio como
PWA y concede permiso para recibir notificaciones push. A partir de ese momento el
dispositivo queda suscrito y puede recibir avisos aunque la app no esté abierta.

**Por qué esta prioridad**: Sin suscripción activa no llega ninguna notificación.
Es el requisito previo de toda la funcionalidad.

**Prueba independiente**: Instalar la PWA y conceder permiso en un dispositivo
limpio. Verificar que el servidor registra la suscripción y que el dispositivo
recibe una notificación de prueba enviada manualmente.

**Escenarios de aceptación**:

1. **Dado** que el usuario abre la URL de la app por primera vez, **cuando** acepta
   el permiso de notificaciones y pulsa "Instalar", **entonces** la app aparece en
   la pantalla de inicio y el servidor confirma la suscripción registrada.
2. **Dado** que la app ya está instalada y la suscripción ha expirado, **cuando**
   el usuario vuelve a abrir la app, **entonces** la suscripción se renueva
   automáticamente sin intervención manual.

---

### Historia de usuario 2 — Crear un evento (Prioridad: P1)

El usuario crea un evento indicando título, cuerpo, fecha/hora y tipo de recurrencia.
Los eventos **puntuales** se disparan una sola vez y desaparecen de la lista. Los
eventos **recurrentes** se repiten según la frecuencia elegida (diaria, semanal o
anual) hasta que el usuario los elimina.

**Por qué esta prioridad**: Es la funcionalidad principal de la sección de eventos.

**Prueba independiente**: Crear un evento puntual 2 minutos en el futuro. Verificar
que llega la notificación y que el evento desaparece de la lista. Crear un evento
recurrente diario y verificar que permanece en la lista tras dispararse.

**Escenarios de aceptación**:

1. **Dado** que el usuario está en la sección de eventos, **cuando** rellena título,
   cuerpo, fecha/hora y recurrencia y pulsa "Guardar", **entonces** el evento aparece
   en la lista de eventos.
2. **Dado** que llega la fecha/hora de un evento, **cuando** el servidor lo detecta,
   **entonces** el dispositivo recibe la notificación aunque la app esté cerrada.
3. **Dado** que un evento puntual se dispara, **cuando** se envía la notificación,
   **entonces** el evento se elimina automáticamente de la lista.
4. **Dado** que un evento recurrente se dispara, **cuando** se envía la notificación,
   **entonces** el evento permanece en la lista para su próxima ocurrencia.
5. **Dado** que el usuario introduce una fecha/hora ya pasada en un evento puntual,
   **cuando** intenta guardar, **entonces** la app muestra un aviso de fecha inválida.

---

### Historia de usuario 3 — Ver y eliminar eventos (Prioridad: P1)

El usuario puede consultar la lista de sus eventos activos, ordenados por próxima
ocurrencia, y eliminar cualquiera de ellos.

**Por qué esta prioridad**: Sin vista de lista el usuario no puede gestionar sus
compromisos.

**Prueba independiente**: Con varios eventos de distinto tipo creados en orden
aleatorio, verificar que la lista los muestra ordenados por próxima ocurrencia y
que eliminar uno impide que su notificación llegue.

**Escenarios de aceptación**:

1. **Dado** que existen eventos guardados, **cuando** el usuario abre la sección de
   eventos, **entonces** ve la lista ordenada por próxima ocurrencia con tipo y hora
   visibles en cada entrada.
2. **Dado** que no hay eventos, **cuando** el usuario abre la sección de eventos,
   **entonces** ve un mensaje indicando que no hay eventos aún.
3. **Dado** que existe un evento en la lista, **cuando** el usuario lo elimina,
   **entonces** desaparece y no se envía notificación en la hora programada.

---

### Historia de usuario 3b — Ver eventos de un día concreto en el Calendario (Prioridad: P1)

El usuario pulsa cualquier día en el grid del calendario. La app muestra un popup
centrado en pantalla con el fondo desenfocado, listando todos los eventos de ese día
con sus detalles completos. Si no hay eventos, el popup indica "Sin eventos este día".
Pulsando un evento abre el modal de edición/borrado. Tocar fuera del popup lo cierra.

**Por qué esta prioridad**: Es la única forma de ver eventos en la vista Calendario
tras eliminar la lista inferior. Sin esto, el calendario es decorativo.

**Prueba independiente**: Con eventos en distintos días del mes, pulsar un día con
eventos y verificar que el popup muestra título, hora, categoría, notas y recurrencia.
Pulsar un día sin eventos y verificar mensaje de estado vacío. Pulsar fuera y verificar
que el popup se cierra.

**Escenarios de aceptación**:

1. **Dado** que el usuario está en la vista Calendario, **cuando** pulsa un día con
   eventos, **entonces** aparece un popup centrado con fondo desenfocado mostrando
   todos los eventos de ese día con: título, hora, categoría (con color), notas y
   tipo de recurrencia.
2. **Dado** que el usuario pulsa un día sin eventos, **cuando** se abre el popup,
   **entonces** muestra el mensaje "Sin eventos este día".
3. **Dado** que el popup está abierto, **cuando** el usuario pulsa un evento dentro
   del popup, **entonces** se cierra el popup y se abre el modal de edición/borrado
   de ese evento.
4. **Dado** que el popup está abierto, **cuando** el usuario toca el fondo desenfocado
   fuera del popup, **entonces** el popup se cierra.
5. **Dado** que el usuario abre la vista Calendario, **cuando** la vista carga,
   **entonces** NO aparece ninguna lista de eventos debajo del grid mensual.

---

### Historia de usuario 4 — Crear una tarea (Prioridad: P1)

El usuario crea una tarea indicando título, cuerpo y las horas del día a las que
quiere recibir el recordatorio (puede configurar una o varias horas diarias, p. ej.
09:00 y 21:00). La tarea no tiene fecha de vencimiento: la app enviará notificaciones
push cada día a esas horas de forma indefinida hasta que el usuario la marque como
completada.

**Por qué esta prioridad**: Es la funcionalidad principal de la sección de tareas.

**Prueba independiente**: Crear una tarea con hora de recordatorio 2 minutos en el
futuro. Verificar que llega la notificación. Marcar la tarea como hecha y verificar
que no llegan más notificaciones al día siguiente a esa hora.

**Escenarios de aceptación**:

1. **Dado** que el usuario está en la sección de tareas, **cuando** rellena título,
   cuerpo y una o varias horas de recordatorio diario y pulsa "Guardar", **entonces**
   la tarea aparece en la lista de tareas pendientes.
2. **Dado** que existe una tarea pendiente y llega una de sus horas configuradas,
   **cuando** el servidor lo detecta, **entonces** el dispositivo recibe una
   notificación de la tarea aunque la app esté cerrada.
3. **Dado** que el usuario marca una tarea como completada, **cuando** confirma la
   acción, **entonces** la tarea desaparece de la lista y cesan sus notificaciones.

---

### Historia de usuario 6 — Sincronizar eventos con Apple Calendar (Prioridad: P2)

El usuario pulsa el botón "Añadir a Apple Calendar" en la vista Calendario. La app abre una URL `webcal://` que iOS/macOS intercepta y lanza Apple Calendar, que muestra un diálogo de suscripción. Tras confirmar, todos los eventos de la app aparecen en el calendario de Apple y se actualizan automáticamente sin intervención manual.

**Por qué esta prioridad**: Complementa la funcionalidad principal sin bloquearla. La app es plenamente funcional sin esta integración.

**Prueba independiente**: Pulsar el botón en iOS/macOS, confirmar la suscripción en Apple Calendar. Crear un nuevo evento en la app y esperar el refresco automático de Apple Calendar (máx. 1 hora). Verificar que el evento aparece. Eliminar el evento en la app y verificar que desaparece de Apple Calendar en el siguiente refresco.

**Escenarios de aceptación**:

1. **Dado** que el usuario está en la vista Calendario, **cuando** pulsa "Añadir a Apple Calendar", **entonces** iOS/macOS abre Apple Calendar con un diálogo de suscripción listo para confirmar.
2. **Dado** que la suscripción está activa, **cuando** el usuario crea un nuevo evento en la app, **entonces** ese evento aparece en Apple Calendar en el siguiente refresco del feed.
3. **Dado** que la suscripción está activa, **cuando** el usuario elimina un evento en la app, **entonces** ese evento desaparece de Apple Calendar en el siguiente refresco del feed.
4. **Dado** que un evento recurrente existe en la app, **cuando** Apple Calendar refresca el feed, **entonces** muestra todas las ocurrencias futuras como evento recurrente nativo (no instancias individuales).
5. **Dado** que alguien accede al endpoint `/calendar.ics` sin el token correcto, **cuando** el servidor recibe la petición, **entonces** responde con HTTP 401 y no devuelve datos del calendario.

---

### Historia de usuario 5 — Ver y gestionar tareas (Prioridad: P2)

El usuario puede consultar la lista de tareas pendientes y eliminar cualquiera de
ellas sin necesidad de marcarla como completada.

**Por qué esta prioridad**: Permite corregir errores y cancelar tareas que ya no
son relevantes.

**Prueba independiente**: Con varias tareas creadas, verificar que la lista las
muestra todas. Eliminar una y verificar que cesan sus notificaciones.

**Escenarios de aceptación**:

1. **Dado** que existen tareas pendientes, **cuando** el usuario abre la sección de
   tareas, **entonces** ve la lista con título y frecuencia de recordatorio de cada
   una.
2. **Dado** que no hay tareas, **cuando** el usuario abre la sección de tareas,
   **entonces** ve un mensaje indicando que no hay tareas pendientes.
3. **Dado** que existe una tarea en la lista, **cuando** el usuario la elimina,
   **entonces** desaparece y cesan sus notificaciones.

---

### Casos límite

- ¿Qué pasa si el servidor se reinicia? Los datos en memoria se pierden — el usuario
  deberá recrear eventos y tareas (comportamiento conocido y aceptado).
- ¿Qué pasa si la suscripción push caduca? El servidor la elimina automáticamente y
  la app solicita renovación en la próxima apertura.
- ¿Qué pasa si dos notificaciones (eventos o tareas) coinciden en el mismo minuto?
  Ambas se envían como notificaciones separadas.
- ¿Qué pasa si el usuario deniega el permiso de notificaciones? La app informa de que
  no recibirá avisos y le indica cómo activarlo desde la configuración del navegador.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Modal de creación/edición — gestos y accesibilidad**

- **RF-060**: El modal de creación/edición DEBE poder cerrarse deslizando hacia abajo desde el drag handle (`.modal-handle`) en la parte superior del modal.
- **RF-061**: Al cerrar por swipe, el modal DEBE cerrarse directamente sin diálogo de confirmación, incluso si hay datos introducidos sin guardar.
- **RF-062**: El FAB (botón circular +) DEBE estar siempre visible en la esquina inferior derecha, en todas las pestañas (Inicio, Calendario y Tareas). Se elimina la lógica que lo ocultaba en la pestaña Calendario.

**Vista Inicio — panel de resumen**

- **RF-050**: La vista Inicio DEBE mostrar dos bloques: "Próximos eventos" y "Tareas activas". Las pestañas de categoría y la lista completa de eventos se eliminan de esta vista.
- **RF-051**: El bloque "Próximos eventos" DEBE mostrar los 5 eventos más cercanos por fecha de próxima ocurrencia, con título, fecha/hora y color de categoría.
- **RF-052**: El bloque "Tareas activas" DEBE mostrar el número total de tareas pendientes y la lista de sus títulos.
- **RF-053**: Si no hay eventos futuros, el bloque "Próximos eventos" DEBE mostrar el mensaje "Sin eventos próximos".
- **RF-054**: Si no hay tareas pendientes, el bloque "Tareas activas" DEBE mostrar el mensaje "Sin tareas activas".
- **RF-055**: Pulsar un evento o tarea en el resumen DEBE abrir el modal de edición/borrado existente para ese elemento.

**Infraestructura push**

- **RF-001**: El usuario DEBE poder instalar la app como PWA en su dispositivo.
- **RF-002**: La app DEBE solicitar permiso de notificaciones push en el primer uso.
- **RF-003**: La suscripción push DEBE registrarse en el servidor al conceder permiso.
- **RF-004**: El servidor DEBE eliminar automáticamente las suscripciones expiradas.
- **RF-005**: Las notificaciones DEBEN llegar aunque la app esté cerrada o en segundo plano.

**Eventos**

- **RF-010**: El usuario DEBE poder crear un evento indicando título, cuerpo,
  fecha/hora y tipo de recurrencia (puntual, diario, semanal o anual).
- **RF-011**: El sistema DEBE enviar la notificación del evento a la fecha/hora
  programada (precisión ±1 minuto).
- **RF-012**: Los eventos puntuales DEBEN eliminarse automáticamente tras dispararse.
- **RF-013**: El usuario DEBE poder ver la lista de eventos activos, ordenada por
  próxima ocurrencia.
- **RF-014**: El usuario DEBE poder eliminar cualquier evento de la lista.
- **RF-015**: La app DEBE impedir guardar un evento puntual con fecha/hora ya pasada.

**Vista Calendario — popup de día**

- **RF-040**: La vista Calendario NO DEBE mostrar la lista de eventos del mes debajo del grid; esa lista se elimina.
- **RF-041**: Cada celda del grid DEBE ser interactiva (pulsable) independientemente de si tiene eventos.
- **RF-042**: Al pulsar una celda del grid, DEBE aparecer un popup centrado en pantalla con fondo desenfocado (`backdrop-filter: blur`).
- **RF-043**: El popup DEBE listar todos los eventos del día seleccionado mostrando: título, hora, categoría (nombre + color), notas y tipo de recurrencia.
- **RF-044**: Si el día no tiene eventos, el popup DEBE mostrar el mensaje "Sin eventos este día".
- **RF-045**: Pulsar un evento dentro del popup DEBE cerrar el popup y abrir el modal de edición/borrado existente para ese evento.
- **RF-046**: Pulsar el fondo desenfocado fuera del popup DEBE cerrarlo. No se requiere botón de cierre explícito.

**Sincronización con Apple Calendar (iCal feed)**

- **RF-030**: El servidor DEBE exponer un endpoint `GET /calendar.ics?token=<token>` que devuelva un feed iCalendar (RFC 5545) con todos los eventos activos.
- **RF-031**: El feed DEBE incluir solo eventos (`VEVENT`). Las tareas se excluyen.
- **RF-032**: Los eventos recurrentes DEBEN exportarse con `RRULE` nativo (diario → `RRULE:FREQ=DAILY`, semanal → `RRULE:FREQ=WEEKLY;BYDAY=<día>`, anual → `RRULE:FREQ=YEARLY`).
- **RF-033**: El endpoint DEBE requerir un token secreto en la query string; peticiones sin token o con token incorrecto DEBEN recibir HTTP 401.
- **RF-034**: El token secreto DEBE generarse automáticamente en el primer arranque del servidor y mantenerse estable entre reinicios (variable de entorno `ICAL_TOKEN`).
- **RF-035**: La vista Calendario DEBE mostrar un botón que abra la URL `webcal://<host>/calendar.ics?token=<token>`, desencadenando la suscripción automática en Apple Calendar.
- **RF-036**: Al eliminar un evento en la app, DEBE desaparecer del feed en la siguiente petición al endpoint (el feed siempre refleja el estado actual).

**Tareas**

- **RF-020**: El usuario DEBE poder crear una tarea indicando título, cuerpo y una
  o varias horas diarias de recordatorio (formato HH:MM).
- **RF-021**: El sistema DEBE enviar una notificación de recordatorio de cada tarea
  pendiente cada día a las horas configuradas, de forma indefinida hasta que se
  complete o elimine.
- **RF-022**: El usuario DEBE poder marcar una tarea como completada, lo que DEBE
  detener sus notificaciones y eliminarla de la lista.
- **RF-023**: El usuario DEBE poder ver la lista de tareas pendientes.
- **RF-024**: El usuario DEBE poder eliminar una tarea pendiente sin marcarla como
  completada.

### Entidades clave

- **Evento**: Compromiso con fecha y hora. Atributos: título, cuerpo, fecha
  (YYYY-MM-DD), hora (HH:MM), recurrencia (puntual | diario | semanal | anual).
  Los puntuales se autoeliminan al dispararse. En eventos semanales, el día de
  repetición se deriva del día de la semana de la fecha de creación. Los anuales
  se repiten el mismo día y mes cada año a la misma hora.
- **Tarea**: Elemento pendiente sin fecha de vencimiento. Atributos: título, cuerpo,
  horas de recordatorio diario (una o varias, formato HH:MM). Persiste hasta que el
  usuario la complete o elimine.
- **Suscripción**: Dispositivo registrado para recibir push. Atributos: identificador
  único, datos de suscripción. Contiene los eventos y tareas del usuario.
- **Feed iCal**: Endpoint de solo lectura que representa el estado actual de los eventos en formato iCalendar (RFC 5545). Protegido por token secreto. No persiste estado propio; es una vista calculada sobre los eventos en memoria.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: El usuario puede instalar la app y recibir su primera notificación en
  menos de 3 minutos desde el primer acceso.
- **CE-002**: Las notificaciones de eventos se envían dentro del minuto programado en
  el 100% de los casos cuando el servidor está activo.
- **CE-003**: Las notificaciones de tareas pendientes se envían cada día a las horas
  configuradas (precisión ±1 minuto) mientras el servidor esté activo.
- **CE-004**: Crear un evento o una tarea requiere 5 pasos o menos desde que se abre
  la sección correspondiente.
- **CE-005**: Una suscripción expirada se detecta y elimina en el siguiente ciclo de
  envío, sin intervención manual.
- **CE-006**: La lista de eventos muestra siempre el más próximo en primer lugar.
- **CE-007**: Marcar una tarea como completada detiene sus notificaciones de forma
  inmediata (en el siguiente ciclo de envío).
- **CE-012**: La vista Inicio carga el resumen (eventos + tareas) en ≤ 200 ms.
- **CE-013**: Con más de 5 eventos futuros, el bloque "Próximos eventos" muestra exactamente 5, ordenados por fecha ascendente.
- **CE-010**: Al pulsar cualquier día del grid, el popup aparece en ≤ 150 ms.
- **CE-011**: El popup muestra correctamente los campos de todos los eventos del día sin truncar texto relevante.
- **CE-008**: El botón "Añadir a Apple Calendar" abre el diálogo de suscripción en Apple Calendar en ≤ 2 segundos tras pulsarlo.
- **CE-009**: Un evento creado en la app aparece en Apple Calendar tras el siguiente refresco del feed (máx. 1 hora por defecto en Apple Calendar, configurable por el usuario).

## Suposiciones

- La app es de uso estrictamente personal (un único usuario). No hay login ni gestión
  de cuentas.
- La persistencia en memoria es aceptable: si el servidor se reinicia, los datos se
  pierden. No se requiere base de datos.
- El usuario utiliza un navegador moderno compatible con Service Workers y la API Push
  (Chrome, Edge, Firefox, Safari 16.4+).
- La app sirve cliente y servidor desde el mismo proceso.
- Eventos y tareas son dos secciones visualmente separadas en la interfaz.
- No se requiere edición de eventos ni tareas: borrar y crear de nuevo es suficiente.
- La recurrencia de eventos cubre: puntual, diario, semanal y anual.
- La vista Inicio es un panel de resumen; la lista completa de eventos se gestiona desde la vista Calendario (popup de día) y la de Tareas.
- El modal de creación se cierra por swipe-down sin confirmación; los datos no guardados se descartan silenciosamente.
- El FAB es un elemento global persistente, no ligado a ninguna pestaña concreta.
- El feed iCal es de solo lectura desde Apple Calendar; crear/editar eventos en Apple Calendar no modifica la app.
- El token iCal se configura como variable de entorno `ICAL_TOKEN` en Railway. Si no está definido, el servidor lo genera en memoria (se pierde al reiniciar).
- Apple Calendar refresca las suscripciones automáticamente; el usuario no necesita intervención manual tras la suscripción inicial.
