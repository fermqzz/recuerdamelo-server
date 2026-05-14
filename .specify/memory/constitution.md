<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (traducción completa al castellano + nuevo principio VI)

Modified principles:
  - I. Simplicity First → I. Simplicidad ante todo
  - II. Personal Use Scope → II. Ámbito de uso personal
  - III. Notification Reliability → III. Fiabilidad de las notificaciones
  - IV. Minimal Dependency Surface → IV. Dependencias mínimas
  - V. Environment-Driven Secrets → V. Secretos por variables de entorno

Added sections:
  - VI. Idioma (nuevo principio: todos los archivos en castellano)

Removed sections: None

Templates checked:
  - .specify/templates/plan-template.md ✅ sin cambios necesarios
  - .specify/templates/spec-template.md ✅ sin cambios necesarios
  - .specify/templates/tasks-template.md ✅ sin cambios necesarios

Deferred TODOs: None
-->

# Constitución de Recuérdame

## Principios fundamentales

### I. Simplicidad ante todo

Esta es una app personal de un único usuario. Cada decisión de diseño DEBE favorecer
la solución más sencilla posible. El principio YAGNI se aplica sin excepciones: no
construir para escala hipotética, usuarios futuros ni extensibilidad abstracta. Tres
líneas directas de código valen más que una abstracción prematura.

El almacenamiento en memoria es aceptable y preferible a introducir una base de datos
mientras el número de usuarios sea uno. Si algún día se requiere persistencia, el
cambio DEBE limitarse a la adición mínima imprescindible.

### II. Ámbito de uso personal

El servidor sirve a exactamente un usuario final (el propio desarrollador).
Multi-tenancy, control de acceso por roles, flujos OAuth y gestión de sesiones están
explícitamente fuera del alcance. La identidad de suscripción push mediante VAPID es
el único mecanismo de identidad necesario.

Cualquier propuesta de funcionalidad que implique "dar soporte a varios usuarios"
DEBE rechazarse salvo que el propósito del proyecto cambie y esta constitución se
enmiende primero.

### III. Fiabilidad de las notificaciones

Las notificaciones push son el valor central de esta aplicación. El planificador
minutal DEBE ejecutarse sin interrupción durante toda la vida del proceso. Las
suscripciones expiradas DEBEN eliminarse de inmediato para evitar ruido en los logs.
Los errores de entrega que no sean de suscripción expirada DEBEN registrarse pero
NO DEBEN detener el proceso.

### IV. Dependencias mínimas

El árbol de dependencias DEBE mantenerse pequeño. Añadir un nuevo paquete npm requiere
una justificación clara e inmediata. Las herramientas exclusivas de desarrollo
(linters, test runners) son aceptables pero NO DEBEN aparecer en `dependencies` de
producción. Se prefieren los módulos integrados de Node.js y los tres paquetes
existentes (express, cors, web-push) antes de incorporar nuevos.

### V. Secretos por variables de entorno

Los secretos (claves VAPID, email) DEBEN suministrarse exclusivamente mediante
variables de entorno. NO DEBEN estar codificados en el código fuente ni committeados
al control de versiones. El servidor DEBE fallar rápidamente al arrancar si faltan
variables de entorno requeridas.

### VI. Idioma: castellano

Todos los archivos de documentación, especificaciones, planes, tareas y comentarios
significativos DEBEN estar escritos en castellano. El código fuente (nombres de
variables, funciones, rutas) puede mantener terminología técnica en inglés cuando
sea la convención del ecosistema (p. ej. `subscribe`, `webpush`), pero cualquier
comentario explicativo en el código DEBE escribirse en castellano.

## Stack tecnológico

- **Runtime**: Node.js ≥ 18 (LTS)
- **Framework**: Express 4.x
- **Librería push**: web-push 3.x (VAPID)
- **Hosting**: Railway (persistencia a nivel de proceso; un reinicio borra el estado
  en memoria — aceptable para este caso de uso)
- **Frontend**: Archivos estáticos servidos desde el mismo proceso Express (manifest,
  Service Worker, assets de la PWA)

Sin paso de compilación, sin TypeScript, sin bundler — Node.js CommonJS puro.

## Despliegue y operaciones

- Toda la configuración se realiza mediante variables de entorno en Railway:
  `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_EMAIL`, `PORT`.
- El servicio expone cuatro endpoints: `POST /subscribe`, `POST /notifications`,
  `GET /`, `GET /vapid-public`. Los nuevos endpoints DEBEN tener un propósito claro
  ligado a una historia de usuario; los endpoints de conveniencia no están justificados.
- Logging únicamente a stdout/stderr — no se requiere infraestructura de agregación
  de logs a esta escala.
- El proceso sirve los archivos estáticos de la PWA (`index.html`, `manifest.json`,
  `recuerdamelo-sw.js`, iconos) directamente; no se necesita CDN ni host estático
  separado.

## Gobernanza

Esta constitución rige todas las decisiones de desarrollo del proyecto Recuérdame.
Prevalece sobre acuerdos verbales y decisiones ad-hoc. Cuando una decisión de diseño
entre en conflicto con un principio anterior, el principio prevalece salvo que este
documento se enmiende primero.

**Procedimiento de enmienda**: El desarrollador único modifica este archivo
directamente e incrementa la versión según las reglas de versionado semántico:
- MAYOR — principio eliminado, redefinido o gobernanza reestructurada.
- MENOR — nuevo principio o sección añadido.
- PARCHE — aclaración de redacción, corrección tipográfica, refinamiento no semántico.

**Cumplimiento**: Antes de aprobar cualquier plan de funcionalidad (`/speckit-plan`),
la comprobación "Constitution Check" en `plan.md` DEBE confirmar que la funcionalidad
no viola los Principios I–VI. Las violaciones de complejidad requieren justificación
explícita en la tabla de seguimiento de complejidad de `plan.md`.

**Versión**: 1.1.0 | **Ratificada**: 2026-05-13 | **Última enmienda**: 2026-05-13
