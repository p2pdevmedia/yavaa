# Etapa 06.1 - Debt Ledger y Bloqueo por Deuda

## Estado

Aprobada para planificacion.

## Contexto

Etapa 06 agrega control economico, reputacion y validaciones sensibles. El primer incremento debe crear una base durable para deuda de comision antes de implementar revision de comprobantes, ratings o disputas.

El flujo de pagos actual define que Yavaa no procesa el pago principal del servicio en el MVP. El cliente paga al contractor fuera de Yavaa, el contractor confirma el pago recibido, y la comision de plataforma se gestiona como deuda separada.

## Alcance

Este incremento construye:

- registro durable de deudas de comision y ajustes manuales;
- resumen de deuda por usuario;
- limite de deuda por usuario;
- bloqueo server-side por deuda;
- endpoints API para que usuarios vean su estado y admins operen deuda inicial;
- OpenAPI y tests unitarios para reglas, permisos y estados invalidos.

Este incremento no construye:

- revision completa de comprobantes de pago;
- aplicacion automatica de pagos a multiples deudas;
- confirmacion de pago directo del contractor;
- ratings, reviews o reputacion visible;
- disputas de servicio.

## Modelo de Dominio

### CommissionDebt

Representa una obligacion economica pendiente con Yavaa.

Campos esperados:

- `id`
- `userId`
- `sourceType`
- `sourceId`
- `amountCents`
- `currency`
- `status`
- `reason`
- `createdByUserId`
- `createdAt`
- `updatedAt`

Estados iniciales:

- `OPEN`: deuda pendiente.
- `CANCELLED`: deuda anulada por admin.
- `PAID`: deuda saldada. Este estado queda disponible para el siguiente incremento de comprobantes, aunque 6.1 no implemente aprobacion de pagos.

Tipos de origen iniciales:

- `ADMIN_ADJUSTMENT`: deuda o correccion creada manualmente por admin.
- `BOOKING_COMMISSION`: reservado para el incremento donde el contractor confirme pago recibido.

### UserDebtLimit

Define el limite economico permitido para un usuario.

Campos esperados:

- `userId`
- `limitCents`
- `currency`
- `setByUserId`
- `reason`
- `createdAt`
- `updatedAt`

Si un usuario no tiene limite explicito, se usa un limite default de `10000` centavos `ARS` definido en la capa de negocio. El valor es intencionalmente bajo para tests deterministicos y debe poder reemplazarse luego por configuracion admin global.

## Reglas de Negocio

El balance pendiente de un usuario es la suma de `amountCents` de sus `CommissionDebt` con estado `OPEN`.

Un usuario esta bloqueado por deuda cuando:

- su estado de usuario es `ACTIVE`;
- su balance pendiente es mayor que su limite aplicable.

El bloqueo por deuda no cambia `User.status`. Es una restriccion calculada y auditable, separada de suspensiones o bloqueos administrativos existentes.

Acciones bloqueadas en 6.1:

- clientes bloqueados no pueden crear nuevos bookings;
- contractors bloqueados no pueden aceptar nuevos bookings.

Acciones permitidas aunque haya bloqueo:

- iniciar sesion;
- ver dashboard y bookings existentes;
- enviar mensajes en bookings existentes;
- subir archivos o comprobantes;
- cancelar bookings propios cuando la regla existente lo permita;
- pedir soporte/admin.

## Permisos

Las reglas se aplican siempre server-side.

Usuarios activos pueden ver solo su propio resumen de deuda.

Admins activos pueden:

- listar deudas;
- crear deuda o ajuste manual;
- configurar limite de deuda por usuario.

Support no puede crear deuda, ajustar balances ni cambiar limites.

Cada accion admin sensible debe registrar audit log con:

- actor;
- usuario afectado;
- monto;
- moneda;
- motivo obligatorio;
- estado resultante cuando aplique.

## API

### `GET /api/me/debt-summary`

Devuelve el estado de deuda del usuario autenticado.

Respuesta:

- `userId`
- `balanceCents`
- `limitCents`
- `currency`
- `isDebtBlocked`
- `openDebtCount`

### `GET /api/admin/debts`

Lista deudas para operacion admin.

Filtros iniciales:

- `userId`
- `status`

Respuesta por item:

- deuda;
- usuario afectado basico;
- creador admin basico cuando exista.

### `POST /api/admin/debts`

Crea una deuda o ajuste manual.

Payload:

- `userId`
- `amountCents`
- `currency`
- `reason`

Reglas:

- `amountCents` debe ser entero positivo;
- `currency` inicialmente debe ser `ARS`;
- `reason` es obligatorio;
- solo admin activo.

### `PUT /api/admin/users/{userId}/debt-limit`

Configura el limite de deuda para un usuario.

Payload:

- `limitCents`
- `currency`
- `reason`

Reglas:

- `limitCents` debe ser entero mayor o igual a cero;
- `currency` inicialmente debe ser `ARS`;
- `reason` es obligatorio;
- solo admin activo;
- registra audit log.

## Integracion con Bookings

`createScheduledBooking` debe consultar el resumen de deuda del cliente antes de crear el booking. Si esta bloqueado por deuda, debe rechazar con un error especifico (`debt-blocked`) antes de crear mensajes, notificaciones o audit logs de booking.

`actOnBooking` debe consultar el resumen de deuda del contractor antes de aceptar un booking. Si esta bloqueado, debe rechazar con `debt-blocked` y no modificar el booking.

El resto de acciones de booking mantiene las reglas existentes.

## Testing

Los tests deben seguir TDD.

Cobertura minima:

- calcula balance con deudas `OPEN`;
- ignora deudas `PAID` y `CANCELLED`;
- usa limite default cuando no hay limite explicito;
- detecta bloqueo cuando balance supera limite;
- usuario puede ver solo su propio resumen;
- admin activo puede crear deuda manual con audit log;
- admin activo puede configurar limite de deuda con audit log;
- support no puede crear deuda;
- support no puede configurar limite de deuda;
- crear booking falla con `debt-blocked` para cliente bloqueado;
- aceptar booking falla con `debt-blocked` para contractor bloqueado;
- OpenAPI contiene endpoints y schemas nuevos.

## Documentacion y Contratos

Cambios requeridos:

- Prisma schema y migracion;
- helpers de negocio de deuda;
- endpoints API;
- OpenAPI generado;
- tests unitarios;
- actualizacion breve del README de etapa 06 indicando que 06.1 fue iniciada o implementada, segun el avance del plan.

## Criterio de Salida

Etapa 06.1 esta completa cuando:

- la deuda se guarda como estado durable;
- el resumen de deuda es deterministico;
- el bloqueo por deuda se aplica server-side en creacion y aceptacion de bookings;
- admin puede crear deuda manual inicial con audit log;
- OpenAPI refleja los endpoints;
- los tests unitarios relevantes pasan.
