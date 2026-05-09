# Etapa 03 - Flujo Cliente y Contratista

## Estado

Cerrada por cortes funcionales.

## Cortes completados

1. Flujo publico de discovery.
2. Booking programado con listado y transiciones basicas.

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

## Pendiente

El flujo de solicitudes urgentes y el resto de estados de booking siguen pendientes para una iteracion posterior.
