# Etapa 04 - Comunicacion y Archivos

## Descripcion

Esta etapa agrega la coordinacion operativa entre las partes sin depender de canales externos.

## Objetivo

- Habilitar chat interno.
- Adjuntar imagenes y archivos.
- Vincular mensajes a bookings.
- Guardar evidencias y comprobantes.
- Preparar notificaciones basicas.

## Incluye

- Chat cliente-contractor.
- Mensajes de sistema.
- Subida de fotos del problema.
- Subida de comprobantes.
- Persistencia de archivos.

## Resultado esperado

La comunicacion queda dentro de Yavaa y cada intercambio importante tiene trazabilidad.

## Corte inicial

Primer slice de esta etapa:

- chat interno ligado a bookings
- mensajes de sistema para eventos de booking
- persistencia de metadatos de archivos y comprobantes
- permisos server-side para lectura y escritura de la conversacion
- dashboard conectado al workspace de bookings y chat
- subida real de adjuntos a Vercel Blob
- notificaciones basicas dentro del dashboard
- cobertura e2e para chat y adjuntos en el flujo de booking

## Estado

- Etapa cerrada con el slice operativo inicial.
