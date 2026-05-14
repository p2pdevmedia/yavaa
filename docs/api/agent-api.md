# Agent API

## Overview

Agents use the same Yavaa HTTP API that the web UI uses.

There is no separate agent-only API, no Yavaa password endpoint, and no agent-specific API key in this version. An agent authenticates the user with Supabase Auth, receives a Supabase access token, and sends that token to Yavaa API routes with a bearer authorization header.

The server still enforces every protected rule:

- the Supabase token must be valid
- the Supabase identity must resolve to a local Yavaa user
- the local Yavaa user must be active
- role-specific actions still require the correct role
- onboarding-specific actions still require the expected profile state

## Requirements

An agent client needs:

- `YAVAA_BASE_URL`: the deployed Yavaa URL, for example `https://example.com`
- `SUPABASE_URL`: the Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable key
- a real user email and password

The agent must never ask for or use `SUPABASE_SERVICE_ROLE_KEY`.

## Authentication

Use Supabase Auth to exchange the user's email and password for an access token.

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'user-password'
});

if (error || !data.session) {
  throw new Error(error?.message ?? 'Login failed');
}

const accessToken = data.session.access_token;
```

For clients that cannot use `@supabase/supabase-js`, Supabase Auth also exposes the password token endpoint:

```bash
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user-password"
  }'
```

Use the returned `access_token` for Yavaa requests.

Yavaa does not receive the user's password in any Yavaa-specific endpoint. Password verification belongs to Supabase.

## Authenticated Requests

Send the Supabase access token in the standard bearer header:

```txt
Authorization: Bearer <access_token>
```

For JSON endpoints, also send:

```txt
Content-Type: application/json
Accept: application/json
```

Example:

```ts
const response = await fetch(`${process.env.YAVAA_BASE_URL}/api/me`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json'
  }
});

const body = await response.json();
```

Before doing role-specific work, agents should call `GET /api/me` or `GET /api/onboarding/status` to confirm identity, local user linkage, roles, and onboarding state.

## Endpoint Reference

### GET /api/session

Checks whether a bearer token is a valid Supabase token.

Auth: optional bearer token.

Success with a valid token:

```json
{
  "authenticated": true,
  "configured": true,
  "user": {
    "id": "supabase-user-id",
    "email": "user@example.com"
  },
  "reason": null
}
```

Response with a missing or invalid token:

```json
{
  "authenticated": false,
  "configured": true,
  "user": null,
  "reason": "missing-token"
}
```

Possible `reason` values:

- `missing-token`
- `supabase-not-configured`
- `invalid-token`

Use this endpoint only to validate the Supabase session. To inspect Yavaa user roles and local profile data, use `GET /api/me`.

### GET /api/me

Returns the resolved Yavaa request auth state.

Auth: bearer token required for a `200` response.

Success:

```json
{
  "authenticated": true,
  "configured": true,
  "reason": null,
  "identity": {
    "id": "supabase-user-id",
    "email": "user@example.com"
  },
  "appUser": {
    "id": "local-user-id",
    "email": "user@example.com",
    "supabaseAuthId": "supabase-user-id",
    "displayName": null,
    "status": "ACTIVE",
    "roles": ["jefe"],
    "profile": {
      "firstName": "Ana",
      "lastName": "Perez",
      "avatarUrl": null,
      "phone": null,
      "bio": null,
      "onboardingRole": "JEFE",
      "workerOnboardingCompletedAt": null,
      "jefeOnboardingCompletedAt": "2026-05-14T12:00:00.000Z",
      "identityVerificationStatus": "NOT_STARTED",
      "dniNumber": null,
      "workerCategories": [],
      "workerHourlyRateCents": null,
      "addressText": "Centro, San Martin de los Andes",
      "locationLatitude": "-40.1579",
      "locationLongitude": "-71.3534"
    }
  },
  "matchedBy": "supabase_auth_id",
  "permissionContext": {
    "userId": "local-user-id",
    "status": "ACTIVE",
    "roles": ["jefe"]
  }
}
```

Unauthenticated response:

```json
{
  "authenticated": false,
  "configured": true,
  "reason": "missing-token",
  "identity": null,
  "appUser": null,
  "matchedBy": null,
  "permissionContext": null
}
```

HTTP statuses:

- `200`: authenticated Supabase user
- `401`: missing or invalid token

### GET /api/onboarding/status

Returns where the authenticated user should go next and which profile modes are available.

Auth: bearer token required for a `200` response.

Success for a linked user:

```json
{
  "authenticated": true,
  "linkedUser": true,
  "nextPath": "/dashboard/jefe",
  "modes": [
    {
      "mode": "jefe",
      "completed": true,
      "nextPath": "/dashboard/jefe"
    },
    {
      "mode": "trabajador",
      "completed": false,
      "nextPath": "/dashboard/onboarding/trabajador"
    }
  ]
}
```

Success for an authenticated Supabase user without a linked local Yavaa user:

```json
{
  "authenticated": true,
  "linkedUser": false,
  "nextPath": "/dashboard/seleccionar-modo",
  "modes": []
}
```

Unauthenticated response:

```json
{
  "authenticated": false,
  "nextPath": "/sign-in?next=%2Fdashboard",
  "modes": []
}
```

HTTP statuses:

- `200`: authenticated Supabase user
- `401`: missing or invalid token

### POST /api/onboarding/jefe

Completes the `jefe` onboarding flow with the same payload used by the UI.

Auth: bearer token required.

Required role: `jefe`.

Required local state:

- linked local Yavaa user
- active user status

Request:

```json
{
  "firstName": "Ana",
  "lastName": "Perez",
  "addressName": "Casa",
  "addressText": "Centro, San Martin de los Andes",
  "locationLatitude": -40.1579,
  "locationLongitude": -71.3534,
  "avatarBlobPath": null
}
```

Fields:

- `firstName`: string, 1 to 40 characters
- `lastName`: string, 1 to 40 characters
- `addressName`: string, 1 to 40 characters
- `addressText`: string, 3 to 160 characters
- `locationLatitude`: number between `-90` and `90`
- `locationLongitude`: number between `-180` and `180`
- `avatarBlobPath`: optional string or `null`

Success:

```json
{
  "ok": true,
  "nextPath": "/dashboard/jefe"
}
```

Validation error:

```json
{
  "ok": false,
  "message": "Revisá los datos del formulario.",
  "fieldErrors": {
    "addressText": ["Ingresá una ubicación válida."]
  }
}
```

### POST /api/onboarding/trabajador

Completes the `trabajador` onboarding flow with the same payload used by the UI.

Auth: bearer token required.

Required role: `trabajador`.

Required local state:

- linked local Yavaa user
- active user status

Request:

```json
{
  "firstName": "Luis",
  "lastName": "Gomez",
  "dniNumber": "12345678",
  "addressText": "Vega Maipu, San Martin de los Andes",
  "workerCategories": ["cleaning", "gardening"],
  "hourlyRatePesos": 6000,
  "avatarBlobPath": null
}
```

Fields:

- `firstName`: string, 1 to 40 characters
- `lastName`: string, 1 to 40 characters
- `dniNumber`: string with 7 or 8 digits
- `addressText`: string, 3 to 160 characters
- `workerCategories`: one or more supported category slugs
- `hourlyRatePesos`: positive integer up to `10000000`
- `avatarBlobPath`: optional string or `null`

Supported `workerCategories`:

```txt
carpinteria
zingueria
electricidad
herreria
construction
cleaning
classes
plumbing
gardening
painting
moving
```

Success:

```json
{
  "ok": true,
  "nextPath": "/dashboard/trabajador"
}
```

Validation error:

```json
{
  "ok": false,
  "message": "Revisá los datos del formulario.",
  "fieldErrors": {
    "workerCategories": ["Elegí al menos un tipo de trabajo."]
  }
}
```

### GET /api/job-posts

Lists job posts owned by the authenticated `jefe` user.

Auth: bearer token required.

Required role: `jefe`.

Required local state:

- linked local Yavaa user
- active user status
- completed `jefe` onboarding

Success:

```json
{
  "ok": true,
  "jobPosts": [
    {
      "id": "job-post-id",
      "title": "Limpiar departamento de 2 ambientes",
      "category": "cleaning",
      "description": "Necesito limpieza general de cocina, baño y living.",
      "addressText": "Centro, San Martin de los Andes",
      "desiredTime": "2026-05-20T14:00:00.000Z",
      "photoPathnames": [],
      "status": "PUBLISHED",
      "createdAt": "2026-05-14T12:00:00.000Z"
    }
  ]
}
```

### POST /api/job-posts

Publishes a job post with the same JSON payload used by the UI.

Auth: bearer token required.

Required role: `jefe`.

Required local state:

- linked local Yavaa user
- active user status
- completed `jefe` onboarding

Request:

```json
{
  "title": "Limpiar departamento de 2 ambientes",
  "category": "cleaning",
  "description": "Necesito limpieza general de cocina, baño y living.",
  "addressText": "Centro, San Martin de los Andes",
  "desiredTime": "2026-05-20T14:00:00.000Z",
  "photoPathnames": []
}
```

Required fields:

- `title`: string, 3 to 80 characters
- `category`: string, 2 to 40 characters
- `description`: string, 10 to 800 characters
- `addressText`: string, 3 to 160 characters

Optional fields:

- `desiredTime`: ISO datetime string
- `photoPathnames`: array with up to 6 job photo blob pathnames uploaded by the same user

Success:

```json
{
  "ok": true,
  "jobPost": {
    "id": "job-post-id",
    "title": "Limpiar departamento de 2 ambientes",
    "category": "cleaning",
    "status": "PUBLISHED"
  }
}
```

Validation error:

```json
{
  "ok": false,
  "message": "Revisá los datos del trabajo.",
  "fieldErrors": {
    "title": ["Usá un título de al menos 3 caracteres."]
  }
}
```

## Error Handling

Common statuses:

- `400`: invalid JSON or malformed request body
- `401`: missing or invalid Supabase token
- `403`: authenticated but not allowed by local Yavaa checks
- `422`: valid JSON request with invalid business fields

Common auth errors:

```json
{
  "ok": false,
  "message": "Iniciá sesión para publicar trabajos."
}
```

```json
{
  "ok": false,
  "message": "No pudimos encontrar tu usuario de Yavaa."
}
```

```json
{
  "ok": false,
  "message": "Tu cuenta no está activa."
}
```

```json
{
  "ok": false,
  "message": "No tenés permiso para publicar trabajos."
}
```

Validation errors include a `fieldErrors` object. Agents should read the field names, correct only those fields, and retry the same endpoint.

## Agent Flow

Recommended flow:

1. Sign in with Supabase Auth.
2. Store `session.access_token` only for the current task unless the user explicitly approves longer storage.
3. Call `GET /api/me`.
4. Confirm `authenticated` is `true`.
5. Confirm `appUser.status` is `ACTIVE`.
6. Confirm the needed role exists in `appUser.roles`.
7. Call `GET /api/onboarding/status`.
8. Complete onboarding through the API if the role-specific `completed` value is `false`.
9. Call the same endpoint the UI uses for the requested action.
10. If the API returns `fieldErrors`, fix the payload and retry.

Example publish-job flow:

```ts
const publishResponse = await fetch(`${process.env.YAVAA_BASE_URL}/api/job-posts`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  body: JSON.stringify({
    title: 'Limpiar departamento de 2 ambientes',
    category: 'cleaning',
    description: 'Necesito limpieza general de cocina, baño y living.',
    addressText: 'Centro, San Martin de los Andes',
    desiredTime: '2026-05-20T14:00:00.000Z'
  })
});

const publishBody = await publishResponse.json();

if (!publishResponse.ok) {
  throw new Error(publishBody.message ?? 'Yavaa API request failed');
}
```

## Safety Rules

- Do not send the user's password to any Yavaa endpoint.
- Do not ask users for `SUPABASE_SERVICE_ROLE_KEY`.
- Do not use the Supabase service role key in agent clients.
- Do not scrape the UI when an HTTP endpoint exists.
- Do not assume the UI state is authorization. The server is the source of truth.
- Do not reuse tokens across users.
- Treat file uploads separately; upload endpoints may require multipart form data instead of JSON.
- Treat `photoPathnames` and `avatarBlobPath` as references to previously uploaded files, not raw image bytes.

## Supabase References

- [Supabase JavaScript signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase password-based auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Auth API overview](https://supabase.com/docs/reference/javascript/auth-api)
- [Supabase Auth password token endpoint](https://supabase.com/docs/reference/self-hosting-auth/signs-in-a-user-with-a-password)
