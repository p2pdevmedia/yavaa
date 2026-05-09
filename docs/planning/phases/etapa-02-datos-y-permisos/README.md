# Etapa 02 - Datos y Permisos

## Estado

Cerrada.

## Descripcion

Esta etapa construye la base de datos funcional y la capa de permisos que protege las acciones importantes del sistema.

## Objetivo

- Definir entidades principales.
- Normalizar relaciones.
- Asegurar autorizacion server-side.
- Preparar aprobaciones y estados sensibles.
- Hacer auditable la informacion critica.

## Incluye

- Perfiles de usuario.
- Perfiles de contractor.
- Categorias.
- Zonas de trabajo.
- Direcciones.
- Estados de aprobacion.
- Reglas de acceso por rol y propiedad.

## Resultado esperado

El sistema puede guardar y proteger la informacion esencial sin confiar en el frontend para decidir permisos.

---

## Primer corte de trabajo

Esta fase arranca con un baseline minimo pero utilizable:

- ampliar el esquema Prisma para perfiles de contractor, direcciones y zonas de trabajo
- modelar el estado de aprobacion del contractor
- dejar helpers de permisos server-side basados en rol y propiedad
- sembrar datos deterministicos para usuario admin y contractor de prueba
- cubrir la base de datos y las reglas de permiso con tests

## Criterio de salida inicial

La fase 02 queda lista cuando:

- las entidades base existen en Prisma y migracion
- los datos sensibles se relacionan con su propietario
- las acciones sensibles pueden evaluarse en servidor
- los tests de permisos y base de datos pasan

## Avance actual

Ya quedaron conectados en esta etapa:

- `GET /api/me`
- `PATCH /api/me/profile`
- `GET /api/me/addresses`
- `POST /api/me/addresses`
- `GET /api/me/contractor-profile`
- `PATCH /api/me/contractor-profile`
- `GET /api/catalog/categories`
- `GET /api/catalog/markets`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/contractors/[contractorProfileId]`

## Cierre

La etapa queda cerrada porque ya existe el baseline de Prisma, la semilla deterministica, la autorizacion server-side y la cobertura de tests necesaria para validar el acceso y el contrato de API.

## Proximo paso

Etapa 03 - Flujo Cliente y Contratista.
