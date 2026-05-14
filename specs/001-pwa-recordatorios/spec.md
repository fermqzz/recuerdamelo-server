# Especificación: Recuérdame — App personal de eventos y tareas con notificaciones push

**Rama**: `001-pwa-recordatorios`

**Fecha**: 2026-05-13

**Estado**: Borrador

**Descripción de entrada**: App PWA personal con notificaciones push que gestiona dos
tipos de elementos distintos: **eventos** (compromisos con fecha/hora, opcionalmente
recurrentes) y **tareas** (cosas pendientes sin fecha fija, recordadas periódicamente
hasta que el usuario las complete). Cada tipo ocupa su propia sección en la app.

## Aclaraciones

### Sesión 2026-05-13

- P: ¿Los avisos son solo de hora fija diaria, solo puntuales, o ambos? → R: Los eventos admiten ambos: puntuales (fecha+hora exacta) o recurrentes (diario/semanal/anual).
- P: ¿Cómo se ordena la lista de eventos? → R: Todos juntos, ordenados por próxima ocurrencia.
- P: ¿La app diferencia entre eventos (con fecha/hora) y tareas (sin fecha/hora)? → R: Sí. Son dos entidades distintas en secciones separadas. Los eventos tienen fecha y hora y son compromisos. Las tareas no tienen fecha ni hora; la app las recuerda con la frecuencia que el usuario establezca hasta que las marque como hechas.
- P: ¿Con qué frecuencia se recuerdan las tareas y cómo se configura? → R: Siempre diariamente. El usuario elige cuántas veces al día y a qué horas exactas (p. ej. 09:00, 14:00 y 21:00).
- P: En eventos semanales, ¿cómo se determina el día de la semana? → R: Se infiere de la fecha elegida al crear el evento (el día de esa fecha es el día de repetición semanal).
- P: ¿Cómo se calcula la siguiente ocurrencia de un evento anual? → R: Mismo día y mes cada año a la misma hora.

## Escenarios de usuario y pruebas *(obligatorio)*

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
