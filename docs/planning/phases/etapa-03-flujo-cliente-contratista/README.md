# Etapa 03 - Flujo Cliente y Contratista

## Estado

Cerrada por cortes funcionales.

## Cortes completados

1. Flujo publico de discovery.
2. Booking programado con listado y transiciones basicas.
3. Urgencias con dispatch, aceptacion, ignorado, expiracion y reasignacion administrada.

## Descripcion

Esta etapa implementa el recorrido principal del producto: descubrir un servicio, pedir ayuda, y coordinar la respuesta entre cliente y contractor.

## Objetivo

- Permitir busqueda de proveedores.
- Mostrar perfiles publicos.
- Crear bookings.
- Crear solicitudes urgentes.
- Gestionar aceptacion, rechazo y cancelacion.

## Incluye

- Busqueda por categoria.
- Busqueda por ubicacion.
- Disponibilidad.
- Booking programado.
- Booking de emergencia.
- Estados basicos del pedido.
- Historial de solicitudes.

## Resultado esperado

Un cliente puede encontrar un contractor y cerrar un pedido simple de punta a punta.

## Corte 1

La primera ejecucion de esta etapa cubre el flujo publico:

- busqueda por categoria
- busqueda por ubicacion
- perfiles publicos limitados
- entrada desde la landing page

## Corte 2

La segunda ejecucion de la misma etapa agrega:

- creacion de bookings programados
- listado y detalle de bookings
- aceptacion, rechazo y cancelacion basica
- contrato OpenAPI y tests asociados

## Corte 3

La tercera ejecucion cierra la etapa con el flujo de urgencias:

- creacion de solicitudes urgentes
- dispatch inicial a contractors elegibles
- aceptacion e ignorado por contractor
- expiracion y reasignacion administrada
- extension de urgencias vencidas por 24 horas desde la accion compatible `republish`
- toggle de disponibilidad de urgencias en contractor profile
- rutas API, contrato OpenAPI, tests unitarios, Playwright y migracion aplicada
