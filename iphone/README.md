# Plan de Desarrollo iPhone

## Objetivo

Construir la app nativa de iPhone de Yavaa con el mismo alcance funcional que la app de Android y con contrato API compartido.

La app de iPhone debe ser:

- estable
- predecible
- segura
- facil de probar
- compatible con el backend existente

## Alcance funcional comun

La app de iPhone debe cubrir las mismas funcionalidades que la app de Android.

### Acceso y cuenta

- registro
- inicio de sesion
- recuperacion de cuenta
- cierre de sesion
- manejo de sesion persistente

### Roles y modo activo

- modo cliente
- modo contratista
- cambio de modo dentro de la app
- proteccion por permisos segun rol activo

### Perfil

- editar perfil personal
- administrar direcciones
- ver estado de cuenta
- editar datos de contratista
- subir foto de perfil
- cargar datos de verificacion requeridos

### Descubrimiento

- buscar por categoria
- filtrar por ubicacion
- ver perfiles publicos
- ver calificaciones
- ver disponibilidad
- ver disponibilidad para emergencias

### Reservas

- crear reserva programada
- crear pedido urgente
- crear pedido para hoy
- adjuntar descripcion
- adjuntar fotos del problema
- cancelar reserva
- pedir reprogramacion
- ver estado de la reserva
- ver historial

### Chat

- chat con contratista asignado
- envio de texto
- envio de imagenes
- mensajes del sistema

### Cierre y reputacion

- confirmar trabajo terminado
- reportar trabajo incompleto
- calificar contratista
- dejar comentario
- reportar ausencia

### Deuda y comprobantes

- ver deuda
- ver limite de deuda
- subir comprobante de pago
- ver estado del comprobante

### Notificaciones

- nuevas reservas
- solicitudes urgentes
- aceptacion de contratista
- mensajes de chat
- cambio de estado de reserva
- aprobacion o rechazo de comprobantes
- alertas de deuda

## Exclusiones

- panel admin completo

La administracion operativa sigue siendo web-only.

## Base tecnica sugerida

- SwiftUI
- Swift Concurrency
- cliente API generado desde OpenAPI si es posible
- Supabase Auth para sesion
- APNs para notificaciones push
- almacenamiento seguro de credenciales en Keychain

## Etapas de desarrollo

### Etapa 1: Fundacion

- crear estructura de la app
- definir navegacion principal
- integrar autenticacion
- conectar el contrato API
- preparar manejo de sesion

### Etapa 2: Perfil y roles

- implementar perfil de cliente
- implementar perfil de contratista
- habilitar cambio de modo
- validar permisos por rol activo

### Etapa 3: Descubrimiento y reservas

- listar categorias
- buscar proveedores
- mostrar perfiles publicos
- crear reservas programadas
- crear solicitudes urgentes
- mostrar estados de reserva

### Etapa 4: Chat y archivos

- chat con texto
- envio de imagenes
- vista de historial
- sincronizacion de mensajes

### Etapa 5: Deuda y validaciones

- mostrar deuda y limite
- subir comprobantes
- mostrar estados de revision
- bloquear acciones segun estado de deuda si aplica

### Etapa 6: Calidad

- tests unitarios
- tests de interfaz
- pruebas de permisos
- pruebas de casos invalidos
- verificaciones contra el contrato API

### Etapa 7: Piloto

- beta cerrada
- correccion de bugs
- ajuste de flujos criticos
- preparacion de release inicial

## Criterios de salida

- mismo alcance funcional que Android
- contratos API estables
- permisos validados en servidor
- flujos criticos probados
- lista para piloto controlado

## Riesgos

- desalineacion con Android
- dependencia de cambios en API
- permisos inconsistentes entre cliente y servidor
- manejo de push incompleto

