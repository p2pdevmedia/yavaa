# Scaffold Mobile iPhone

## Objetivo

Arrancar la app iPhone de Yavaa con una base SwiftUI modular que consuma la misma API del website.

Este corte no implementa flujos productivos completos. Deja lista la fundacion para:

- conectar Supabase Auth
- guardar sesion en Keychain
- consumir endpoints `/api/*`
- validar el contrato OpenAPI
- construir pantallas por dominio

## Decision tecnica

Se usa Swift Package Manager como base inicial para mantener el scaffold pequeno y versionable.

El proyecto Xcode/app target puede agregarse despues apuntando a `YavaaApp.YavaaMobileApp` o usando `YavaaRootView` dentro de un target iOS.

## Conexion con website

`YavaaAPI` consume la API existente del website:

- `APIEnvironment.localWebsite`: `http://localhost:3000`
- `APIEnvironment.production`: `https://app.yavaa.lat`

El cliente exige paths bajo `/api/` para evitar consumir rutas de pagina accidentalmente.

El token se inyecta mediante `AccessTokenProviding`, lo que permite conectar luego:

- Supabase Auth
- Keychain
- sesiones mock para UI tests

## Primeros endpoints

- `GET /api/me`: verifica sesion y permisos resueltos por servidor.
- `GET /api/openapi`: confirma que el cliente ve el contrato del website.

## Proximo paso recomendado

1. Crear target Xcode iOS que use los modulos SwiftPM.
2. Agregar Supabase Auth y Keychain.
3. Generar tipos desde OpenAPI o mapear manualmente endpoints criticos por etapa.
4. Construir login, modo activo y perfil antes de discovery/bookings.
