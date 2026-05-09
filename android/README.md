# Plan de Desarrollo Android

## Estado actual

La carpeta `android/` ya contiene el primer scaffold nativo de Yavaa:

- Kotlin
- Gradle Kotlin DSL
- Jetpack Compose Material 3
- Supabase Auth
- cliente HTTP Ktor para el backend Yavaa
- prueba inicial contra `/api/me`

El paquete Android base es `lat.yavaa.android`.

## Puesta en marcha local

Requisitos:

- Android Studio actual
- JDK 17
- Android SDK con API 36
- Gradle compatible con Android Gradle Plugin 9.2.0

Crear la configuracion local:

```bash
cp android/local.properties.example android/local.properties
```

Editar `android/local.properties`:

```properties
yavaa.supabaseUrl=https://your-project.supabase.co
yavaa.supabasePublishableKey=sb_publishable_your_key
yavaa.backendBaseUrl=http://10.0.2.2:3000
```

Notas:

- `10.0.2.2` apunta al host local desde el emulador Android.
- En un dispositivo fisico, usar una URL accesible desde el telefono.
- Nunca poner `SUPABASE_SERVICE_ROLE_KEY` ni ningun secreto backend en Android.

Comandos desde `android/` con Gradle instalado o desde el panel de Gradle de Android Studio:

```bash
gradle testDebugUnitTest
gradle assembleDebug
```

Si Android Studio abre el proyecto, usar `android/` como raiz del proyecto Android.

## Contrato API

Android debe consumir el mismo contrato que web e iOS. La fuente actual es:

```txt
public/openapi.json
```

El primer scaffold implementa manualmente el cliente minimo para:

```txt
GET /api/me
Authorization: Bearer <supabase-access-token>
```

Cuando el contrato movil se estabilice, el siguiente paso es agregar generacion automatica del cliente Android desde OpenAPI.

## Discovery publico

Android abre en discovery publico para que una persona pueda explorar categorias, mercados, proveedores y perfiles publicos sin iniciar sesion.

Endpoints publicos usados por esta experiencia:

- `GET /api/catalog/categories`
- `GET /api/catalog/markets`
- `GET /api/providers?category=&market=`
- `GET /api/providers/{contractorProfileId}`

La app no muestra calificaciones, precios, distancia, resenas ni fotos de trabajos hasta que esos campos existan en el contrato publico.

El inicio de sesion con Supabase sigue disponible desde la seccion de cuenta para futuros flujos protegidos.

## Objetivo

Construir la app nativa de Android de Yavaa con el mismo alcance funcional que la app de iPhone y con contrato API compartido.

La app de Android debe ser:

- estable
- predecible
- segura
- facil de probar
- compatible con el backend existente

## Alcance funcional comun

La app de Android debe cubrir las mismas funcionalidades que la app de iPhone.

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

- Kotlin
- Jetpack Compose
- coroutines
- cliente API generado desde OpenAPI si es posible
- Supabase Auth para sesion
- Firebase Cloud Messaging para notificaciones push
- DataStore o almacenamiento seguro equivalente para credenciales

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

- mismo alcance funcional que iPhone
- contratos API estables
- permisos validados en servidor
- flujos criticos probados
- lista para piloto controlado

## Riesgos

- desalineacion con iPhone
- dependencia de cambios en API
- permisos inconsistentes entre cliente y servidor
- manejo de push incompleto
