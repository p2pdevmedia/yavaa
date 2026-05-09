# Etapa 05 - Administracion y Operacion

## Descripcion

Esta etapa le da a administracion las herramientas para moderar, corregir y operar el marketplace de forma segura.

## Objetivo

- Gestionar usuarios.
- Revisar contractors.
- Aprobar o rechazar perfiles.
- Moderar categorias.
- Resolver casos operativos.

## Incluye

- Panel administrativo web.
- Gestion de roles.
- Suspensiones y reactivaciones.
- Revision de contractors.
- Edicion de categorias.
- Gestion de bookings conflictivos.

## Resultado esperado

El equipo operativo puede mantener el sistema sin tocar la base de datos manualmente ni romper permisos.

## Subetapas

### Etapa 05.1 - Usuarios y estados operativos

Objetivo:

- listar usuarios para operacion
- ver roles, estado y datos basicos
- suspender usuarios
- reactivar usuarios
- bloquear usuarios cuando corresponda

Incluye:

- APIs admin para listar usuarios y cambiar estado
- validacion server-side de rol admin activo
- audit log para cada cambio de estado
- OpenAPI actualizado
- tests de acceso admin, denegacion y auditabilidad

Criterio de salida:

- un admin puede operar estados de usuario sin tocar la base de datos
- usuarios suspendidos o bloqueados quedan impedidos en acciones sensibles existentes

### Etapa 05.2 - Contractors y revision operativa

Objetivo:

- listar contractors por estado de aprobacion
- revisar perfiles pendientes
- aprobar o rechazar perfiles
- ver datos necesarios para la decision operativa

Incluye:

- listado admin de contractor profiles
- filtros por `DRAFT`, `PENDING_REVIEW`, `APPROVED` y `REJECTED`
- endurecimiento del flujo existente de aprobacion/rechazo
- audit log consistente para cada decision
- tests de permisos, estados invalidos y OpenAPI

Criterio de salida:

- administracion puede revisar contractors desde APIs deterministicamente
- solo contractors aprobados y activos aparecen en discovery publico

### Etapa 05.3 - Categorias y catalogo moderado

Objetivo:

- mantener categorias sin cambios manuales en base de datos
- activar, pausar o dejar categorias en revision
- proteger categorias iniciales contra ediciones riesgosas

Incluye:

- consolidacion del endpoint admin de categorias
- validaciones para slugs, nombres, estados y categorias iniciales
- audit log de altas y cambios
- tests de permisos, payload invalido y estados

Criterio de salida:

- el catalogo puede moderarse desde APIs admin
- discovery publico solo usa categorias activas

### Etapa 05.4 - Bookings conflictivos y correcciones admin

Objetivo:

- resolver casos operativos sin manipular registros manualmente
- permitir cancelaciones o correcciones controladas por admin
- mantener trazabilidad de cada intervencion

Incluye:

- endpoint admin para acciones correctivas sobre bookings
- reglas explicitas de estados permitidos
- mensajes de sistema cuando una accion admin modifica el booking
- notificaciones a las partes cuando corresponda
- audit log con motivo obligatorio
- tests de permisos, invalid-state y efecto observable

Criterio de salida:

- un admin puede intervenir bookings conflictivos con reglas claras
- clientes y contractors ven la consecuencia dentro del workspace

### Etapa 05.5 - Panel administrativo web minimo

Objetivo:

- exponer las herramientas operativas principales en la web
- evitar depender de requests manuales
- mantener una UI simple, auditable y testeable

Incluye:

- vista admin protegida
- secciones de usuarios, contractors, categorias y bookings
- acciones con confirmacion para cambios sensibles
- estados de carga, error y resultado
- Playwright para flujos criticos admin

Criterio de salida:

- administracion puede operar el MVP desde la interfaz web
- los flujos criticos admin tienen cobertura e2e

## Orden recomendado

1. Etapa 05.1 - Usuarios y estados operativos.
2. Etapa 05.2 - Contractors y revision operativa.
3. Etapa 05.3 - Categorias y catalogo moderado.
4. Etapa 05.4 - Bookings conflictivos y correcciones admin.
5. Etapa 05.5 - Panel administrativo web minimo.

## Estado

- Etapa iniciada.
- Etapa 05.1 implementada a nivel API, permisos, audit log, OpenAPI y tests unitarios.
- Etapa 05.2 implementada a nivel API, filtros por estado, permisos, audit log, OpenAPI y tests unitarios.
- Etapa 05.3 implementada a nivel API, filtros por estado, validacion de slugs, proteccion de categorias iniciales, audit log, OpenAPI y tests unitarios.
- Etapa 05.4 implementada a nivel API, correccion admin de bookings por cancelacion con motivo obligatorio, mensajes/notificaciones del flujo durable, audit log especifico, OpenAPI y tests unitarios.
- Etapa 05.5 implementada con panel administrativo web minimo para usuarios, contractors, categorias y bookings, conectado a las APIs admin con confirmaciones para acciones sensibles.
- Etapa 05 completa en su alcance MVP inicial.
