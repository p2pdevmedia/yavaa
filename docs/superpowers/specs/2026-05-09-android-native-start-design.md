# Android Native Start Design

## Goal

Start the native Android application for Yavaa inside `android/` using Kotlin, Jetpack Compose, Gradle, Supabase Auth, and the existing OpenAPI contract as the API source of truth.

## Scope

This first Android slice creates a runnable project foundation, not the full mobile product. It must prove that the app can render, authenticate through Supabase, persist session state through the Supabase Android client, attach bearer tokens to backend requests, and call the Yavaa backend contract through a small typed API client.

The first user-facing flow is:

1. An unauthenticated user sees a login screen.
2. The user enters email and password.
3. The app signs in with Supabase Auth.
4. The authenticated home screen can request `/api/me` through the Yavaa backend using the Supabase access token.
5. The user can sign out.

## Architecture

The initial project uses one Gradle module, `android/app`, with package `lat.yavaa.android`. Multi-module Android architecture is intentionally deferred until there is enough feature surface to justify it.

Source code is split by responsibility:

- `core/config` stores runtime configuration keys and validation.
- `core/auth` wraps Supabase Auth session operations.
- `core/network` owns the backend HTTP client and typed API results.
- `core/ui` owns the Compose theme and shared visual primitives.
- `feature/auth` owns the login state and UI.
- `feature/home` owns the authenticated home state and UI.
- `navigation` decides whether auth or home is visible.

## API Contract

`public/openapi.json` remains the contract source of truth. The first scaffold does not generate a full OpenAPI Android client because generated clients can add significant build complexity early. Instead, it introduces a small typed client for `/api/me` and documents the later generator path.

The client uses an explicit backend base URL and sends `Authorization: Bearer <supabase access token>` for authenticated calls.

## Auth And Secrets

The Android app must only use public Supabase configuration:

- Supabase URL
- Supabase publishable key
- Yavaa backend base URL

Service role keys are forbidden in Android. Local values live in `android/local.properties`, while committed sample keys live in `android/local.properties.example`.

## Testing

The first test target covers deterministic code that can run without Android devices:

- configuration validation
- authenticated request construction or token handling

Compose/UI and instrumentation tests are prepared but can wait until the local Android SDK is available.

## Out Of Scope

This slice does not implement FCM, booking creation, chat, profile editing, file uploads, role permissions UI, or generated OpenAPI coverage for every endpoint.

