# Plan de Desarrollo iPhone

## Estado actual

Se inicio un scaffold SwiftUI modular en esta carpeta.

## Primer corte funcional implementado

El primer corte funcional de iPhone cubre:

- login con Supabase Auth
- sesion persistente en Keychain
- resolucion de cuenta con `GET /api/me`
- derivacion local de modos mobile desde roles del servidor
- cambio entre cliente y contratista cuando ambos roles existen
- action map inicial por modo

El modo activo no otorga permisos. Solo decide la navegacion visible. Los endpoints del website siguen validando rol, estado, ownership y relaciones server-side.

La base mobile queda preparada para conectarse a la API web de Yavaa:

- entorno local por defecto: `http://localhost:3000`
- entorno productivo previsto: `https://app.yavaa.lat`
- endpoints iniciales:
  - `GET /api/me`
  - `GET /api/openapi`
- autenticacion preparada para `Authorization: Bearer <token>`

## Estructura inicial

```txt
iphone/
  Package.swift
  Sources/
    YavaaApp/
    YavaaAPI/
    YavaaAuth/
    YavaaCore/
    YavaaDesign/
  Tests/
    YavaaAPITests/
    YavaaCoreTests/
  Docs/
```

## Modulos

### YavaaApp

Capa SwiftUI inicial.

Incluye:

- `YavaaRootView`
- `AppContainer`
- bootstrap de sesion
- verificacion basica de contrato OpenAPI contra el website

### YavaaAPI

Cliente HTTP para consumir la API del website.

Reglas:

- solo acepta paths bajo `/api/`
- agrega `Accept: application/json`
- agrega `Content-Type: application/json`
- agrega bearer token cuando hay sesion
- decodifica respuestas `Decodable`

### YavaaAuth

Capa de sesion inicial.

Incluye:

- protocolo para store de tokens
- store en memoria para desarrollo
- store de tokens en Keychain
- proveedor de token inyectable
- servicio de autenticacion con Supabase Auth SDK
- controlador de sesion basado en `GET /api/me`

Pendiente:

- pulir refresh y renovacion real de sesion

### YavaaCore

Tipos compartidos:

- modo activo
- roles
- identidad
- estado de sesion

### YavaaDesign

Design system minimo SwiftUI:

- colores base
- spacing
- boton primario

## Comandos

Desde `iphone/`:

```sh
swift build
swift test
```

Proyecto Xcode para iPhone:

```sh
open iphone.xcodeproj
```

El scheme `YavaaIPhone` corre la app `Yavaa` en iPhone Simulator. Para compilar por consola:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  xcodebuild -project iphone.xcodeproj \
  -scheme YavaaIPhone \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  CODE_SIGNING_ALLOWED=NO \
  build
```

El scheme de desarrollo inyecta las variables runtime que necesita el login:

- `YAVAA_API_BASE_URL`
- `YAVAA_SUPABASE_URL`
- `YAVAA_SUPABASE_PUBLISHABLE_KEY`

E2E de login en iPhone Simulator:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  xcodebuild test \
  -project iphone.xcodeproj \
  -scheme YavaaIPhone \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:YavaaIPhoneUITests/YavaaLoginUITests/testConfiguredUserCanSignIn \
  CODE_SIGNING_ALLOWED=NO \
  YAVAA_E2E_EMAIL='usuario@example.com' \
  YAVAA_E2E_PASSWORD='password'
```

Si `YAVAA_E2E_EMAIL` o `YAVAA_E2E_PASSWORD` no estan configurados, el test se salta. Si Supabase rechaza el login, el test falla mostrando el mensaje visible de la app.

Nota: en esta maquina `swift build` compila correctamente. `swift test` queda bloqueado por el toolchain local porque no expone `XCTest`; debe correrse desde un entorno Xcode completo o ajustarse cuando se cree el proyecto `.xcodeproj`.

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
- navegacion visible segun modo activo
- permisos validados por endpoints del website

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
- mantener permisos validados server-side por rol, estado, ownership y relaciones

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
