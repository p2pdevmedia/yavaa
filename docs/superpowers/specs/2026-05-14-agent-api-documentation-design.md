# Agent API Documentation Design

## Status

Approved for documentation planning.

## Goal

Document how an external agent can interact with Yavaa through the same HTTP API used by the web UI.

The agent must be able to:

- authenticate as a real Yavaa user with Supabase email/password auth
- send authenticated requests to Yavaa with the user's Supabase access token
- understand which existing endpoints are available
- create or read supported resources without requiring UI-only automation
- receive predictable guidance for auth, role, validation, and permission errors

This design does not add a separate agent API surface. The UI and agents share the same backend endpoints.

## Non-Goals

- Do not create API keys in this cycle.
- Do not store user passwords in Yavaa.
- Do not expose Supabase service role credentials.
- Do not add OAuth delegation, long-lived agent tokens, or token revocation UI.
- Do not add new product domains.
- Do not bypass server-side role checks used by the UI.

## Current Context

Yavaa uses Next.js API routes, Supabase Auth, Prisma, and server-side permission helpers.

The existing request auth layer already supports bearer token authentication:

- API clients can send `Authorization: Bearer <access_token>`.
- `resolveRequestAuth()` validates the Supabase token.
- The validated Supabase identity is resolved to a local Yavaa user.
- Protected actions still check local user status and roles.

This makes the current backend suitable for agent access without adding a parallel authentication system.

## Auth Model

Agents authenticate directly with Supabase Auth using the project's public Supabase URL and publishable key.

For email/password users, the documented flow is:

1. The user gives the agent their email and password.
2. The agent calls Supabase `signInWithPassword()`.
3. Supabase returns a session containing an `access_token`.
4. The agent calls Yavaa endpoints with:

```txt
Authorization: Bearer <access_token>
Content-Type: application/json
```

Yavaa never receives or stores the user's password in a custom endpoint. Password verification remains Supabase's responsibility.

## Security Rules

The documentation must make these rules explicit:

- Agents must use the Supabase publishable key, never the service role key.
- Agents should avoid storing user passwords after login.
- Agents may store short-lived access tokens only according to the user's instructions and environment security.
- Every protected Yavaa endpoint must continue validating authenticated identity, linked local user, active user status, and required role.
- A bearer token proves authentication only. It does not grant permissions beyond the local Yavaa user and role checks.
- If a user can do something in the UI, an agent may do it through the same API only when the endpoint allows it.

## Documentation Artifact

Create a developer-facing guide at:

```txt
docs/api/agent-api.md
```

The guide should be written for agent builders and automation clients. It should be practical, copyable, and explicit.

## Guide Structure

The guide should include:

1. Overview
   - Explain that agents use the same endpoints as the UI.
   - Explain that Yavaa uses Supabase Auth bearer tokens.

2. Requirements
   - Yavaa base URL.
   - Supabase project URL.
   - Supabase publishable key.
   - A real user email and password.

3. Login
   - JavaScript example using `@supabase/supabase-js`.
   - HTTP/cURL example if a direct Supabase Auth REST call is practical and stable.
   - Instructions to extract `session.access_token`.

4. Authenticated Yavaa Requests
   - Show common headers.
   - Show how to call `GET /api/me`.
   - Explain that `401` means unauthenticated, while `403` means authenticated but not allowed.

5. Endpoint Reference
   - Document only endpoints that already exist and are intended to be usable by the UI.
   - Start with the smallest useful set:
     - `GET /api/session`
     - `GET /api/me`
     - `GET /api/job-posts`
     - `POST /api/job-posts`
     - `GET /api/onboarding/status`
     - `POST /api/onboarding/jefe`
     - `POST /api/onboarding/trabajador`
   - Include request examples, response examples, required roles, and validation notes.

6. Error Handling
   - `400`: invalid JSON or malformed request body.
   - `401`: missing or invalid Supabase token.
   - `403`: local Yavaa user missing, inactive user, or missing role.
   - `422`: valid request shape but invalid business fields.

7. Agent Usage Pattern
   - Login once.
   - Call `GET /api/me` or `GET /api/session` to verify identity.
   - Check onboarding status before role-specific actions.
   - Submit JSON to the same endpoint the UI uses.
   - Read `fieldErrors` and retry with corrected fields.

8. Safety Notes
   - Do not ask users for the Supabase service role key.
   - Do not scrape the UI when an HTTP endpoint is available.
   - Do not assume a visible UI button means the API call will pass server-side authorization.
   - Treat file upload endpoints separately because they may use multipart form data.

## Initial Endpoint Details

### GET /api/session

Purpose: allow an agent to check whether the request is associated with an authenticated session.

Documentation should describe the current response shape by reading the existing route implementation before writing examples.

### GET /api/me

Purpose: allow an agent to identify the current Yavaa user, local profile, status, and available roles.

Documentation should describe the current response shape by reading the existing route implementation before writing examples.

### GET /api/job-posts

Purpose: allow an authenticated `jefe` user to list their job posts.

Documentation should include:

- required auth: authenticated Yavaa user
- required role: `jefe`
- response: list of serialized job posts

### POST /api/job-posts

Purpose: allow an authenticated `jefe` user to publish a job using the same JSON payload as the UI.

Required payload:

```json
{
  "title": "Limpiar departamento de 2 ambientes",
  "category": "cleaning",
  "description": "Necesito limpieza general de cocina, baño y living.",
  "addressText": "Centro, San Martin de los Andes"
}
```

Optional fields:

```json
{
  "desiredTime": "2026-05-20T14:00:00.000Z",
  "photoPathnames": []
}
```

Validation rules should mirror `createJobPostSchema` in `src/lib/job-posts.ts`.

### POST /api/onboarding/jefe

Purpose: allow an authenticated user with the `jefe` role to complete the same onboarding flow used by the UI.

Documentation should include the required location fields and explain that avatar upload is optional and must reference an uploaded profile avatar path if provided.

### POST /api/onboarding/trabajador

Purpose: allow an authenticated user with the `trabajador` role to complete the same onboarding flow used by the UI.

Documentation should include worker categories, hourly rate in pesos, DNI fields, address text, and optional avatar path.

## Testing Strategy

The documentation-only implementation should be verified with:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

If the implementation includes documentation tests or route contract tests, those tests must assert the documented examples match the current route behavior.

Manual review should check:

- examples do not include secrets
- examples use bearer auth consistently
- documented endpoints exist
- documented payload field names match current schemas
- permission language matches server-side checks

## Implementation Notes

Before writing `docs/api/agent-api.md`, inspect the route files and service schemas for exact response and payload shapes:

- `src/app/api/session/route.ts`
- `src/app/api/me/route.ts`
- `src/app/api/job-posts/route.ts`
- `src/app/api/onboarding/status/route.ts`
- `src/app/api/onboarding/jefe/route.ts`
- `src/app/api/onboarding/trabajador/route.ts`
- `src/lib/job-posts.ts`
- `src/lib/onboarding.ts`
- `src/lib/onboarding-service.ts`
- `src/lib/request-auth.ts`

Use code examples that are accurate for the current Supabase JavaScript client and cite Supabase documentation in the guide.

## Open Decisions

No open product decisions remain for the first documentation pass.

Future cycles may decide whether Yavaa needs:

- agent-specific API keys
- a machine-readable OpenAPI document
- an `/api/agent/capabilities` discovery endpoint
- audit logs for agent actions
