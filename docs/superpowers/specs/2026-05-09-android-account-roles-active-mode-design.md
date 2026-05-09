# Android Account, Roles, And Active Mode Design

## Goal

Build the Android account foundation that lets one authenticated Yavaa user operate the app as client or contractor from the same native app.

This slice connects native Android to the existing `/api/me` contract, derives the user's available roles, stores the selected active mode locally, and routes the user into separate client and contractor shells. It does not add admin mobile functionality.

## Scope

This slice covers:

1. authenticated session state
2. `GET /api/me`
3. typed Android models for the full `appUser` shape needed by account mode
4. available role detection for `client` and `contractor`
5. local active mode selection
6. switching between client and contractor mode when both roles exist
7. separate Android navigation shells for client and contractor
8. suspended, blocked, missing-role, loading, and error states

This slice deliberately stops before booking creation, emergency creation, contractor service management, availability editing, chat, payments, ratings, and admin/support workflows.

## Product Rules

Yavaa supports one account with multiple roles. The Android app must make the active mode explicit because the client and contractor mental models are different.

The active mode affects:

- navigation
- default screen
- visible actions
- dashboard copy

The active mode does not affect:

- user identity
- server permissions
- resource ownership
- debt, suspension, or approval checks

The backend remains the source of truth for roles and permissions. Android must never grant actions just because the UI is in a specific mode.

## Active Mode Decision

For this slice, Android stores active mode locally.

Rationale:

- The current backend contract does not expose `activeMode`.
- Existing APIs already validate real roles server-side.
- The product need is mobile navigation, not cross-device mode sync.
- Persisting this in backend now would require schema, migration, OpenAPI, and permission changes before the behavior needs them.

The local mode should be derived from `/api/me` roles and corrected when roles change. If the stored mode is no longer available, Android must select a valid fallback mode.

## Role Handling

Android supports only these operational modes in this slice:

- `client`
- `contractor`

If `/api/me` also returns `admin` or `support`, Android can show those labels as account roles later, but it must not expose admin or support navigation in the native app.

Initial mode selection:

1. Use the locally stored active mode if it is still available.
2. Otherwise use `client` when the user has the client role.
3. Otherwise use `contractor` when the user has the contractor role.
4. Otherwise show a limited account state with no operational mode.

Switching rules:

- Client mode is selectable only when `/api/me` includes `client`.
- Contractor mode is selectable only when `/api/me` includes `contractor`.
- Switching mode is local and immediate.
- Switching mode should not call backend APIs.

## User Flows

### Guest

1. App opens to public discovery.
2. Account action says `Ingresar`.
3. User signs in with email and password.
4. On authenticated session, Android loads `/api/me`.
5. If account data is usable, Android routes to the selected account mode.

### Authenticated Client

1. Android loads `/api/me`.
2. Available modes include `Cliente`.
3. Active mode defaults to client.
4. User sees a client shell with entry points for search, requests, addresses, and profile.
5. Contractor-only actions are not visible.

### Authenticated Contractor

1. Android loads `/api/me`.
2. Available modes include `Contratista`.
3. Active mode defaults to contractor when client is unavailable, or can be selected when both roles exist.
4. User sees a contractor shell with entry points for profile, incoming work, availability, and account.
5. Client-only actions are not visible.

### Multi-Role User

1. Android loads `/api/me`.
2. Available modes include `Cliente` and `Contratista`.
3. The account header shows a mode switch.
4. Switching mode changes the shell and default navigation.
5. The same session and identity remain active.

### Blocked Or Suspended User

1. Android loads `/api/me`.
2. If `appUser.status` or `permissionContext.status` is `SUSPENDED` or `BLOCKED`, operational modes are disabled.
3. The app shows a blocked account state and a sign-out action.
4. Client and contractor shells are not reachable.

### Missing Client/Contractor Role

1. Android loads `/api/me`.
2. If no supported Android role exists, the app shows a limited account state.
3. The user can sign out.
4. No operational shell is shown.

## Android Architecture

Add a focused account/session feature instead of expanding `HomeViewModel` into a general app coordinator.

Suggested source boundaries:

- `core/network`: full `/api/me` DTOs and existing bearer-token call.
- `feature/account`: account session state, role mapping, active mode selection, account shell UI, and mode switch.
- `feature/client`: client mode shell placeholders.
- `feature/contractor`: contractor mode shell placeholders.
- `navigation`: route authenticated users to the account shell and keep public discovery/login accessible.

`HomeScreen` can be replaced or renamed because the current screen is a technical `/api/me` demo, not a product home.

## Data Flow

1. Supabase Auth owns the local auth session.
2. `YavaaAuthRepository.currentAccessToken()` provides the bearer token.
3. `YavaaApiClient.getMe(token)` calls `GET /api/me`.
4. Account ViewModel maps the response into:
   - authenticated state
   - user status
   - available Android modes
   - selected active mode
   - display identity
   - contractor profile summary when present
   - address count and profile completeness signals when useful
5. Navigation renders the shell for the selected active mode.

The ViewModel should expose deterministic state, not raw UI guesses spread across Compose screens.

## API Contract

No backend API changes are required for this slice.

Android should expand its `/api/me` DTOs to match the current OpenAPI shape closely enough for account mode:

- `appUser.id`
- `appUser.email`
- `appUser.displayName`
- `appUser.status`
- `appUser.roles`
- `appUser.profile`
- `appUser.addresses`
- `appUser.contractorProfile`
- `permissionContext.userId`
- `permissionContext.status`
- `permissionContext.roles`

Parsing should ignore unknown fields so additive backend changes do not break Android. Missing required fields in the supported account shape should fail in unit tests.

If implementation discovers an OpenAPI mismatch, fix the backend contract and Android DTO tests together.

## UI Design

The account experience should be simple and operational, not a marketing page.

Account shell:

- account header with display name or email
- status indicator when not active
- mode switch when both client and contractor are available
- sign-out action
- retry action when `/api/me` fails

Client shell:

- `Buscar` entry point back to public discovery
- `Pedidos` placeholder for future bookings
- `Direcciones` placeholder using `/api/me.addresses` count when available
- `Perfil` account entry point

Contractor shell:

- `Perfil contratista` entry point using `/api/me.contractorProfile`
- `Solicitudes` placeholder for incoming booking requests
- `Disponibilidad` placeholder
- `Cuenta` account entry point

Placeholders must be honest: they can identify the future domain, but they must not imply that booking, availability, chat, or payment actions are implemented.

## Error Handling

Required states:

- loading account
- ready with client mode
- ready with contractor mode
- ready with mode switch
- unauthenticated session
- `/api/me` error with retry
- missing token
- blocked or suspended account
- no supported Android role

If the Supabase session ends, Android should return to the unauthenticated account/login path without keeping stale role state.

## Permissions And Security

Server-side permissions remain mandatory.

Android must not:

- expose admin/support navigation
- assume contractor approval grants more than the backend allows
- create protected actions without server validation
- cache roles in a way that survives `/api/me` contradicting them
- send service-role credentials

Android may hide actions for clarity, but hiding is not authorization.

## Testing

Unit tests should cover:

- supported mode extraction from roles
- initial active mode fallback
- rejecting a switch to an unavailable mode
- preserving a valid selected mode after refresh
- clearing/correcting stale mode when roles change
- blocked/suspended users do not get an operational mode
- `/api/me` parsing with profile, addresses, and contractor profile
- `/api/me` bearer token behavior remains intact
- navigation labels for guest vs authenticated account entry

Compose tests can be added later for full interaction. This slice should still be testable through JVM tests for state mapping and API parsing.

## Out Of Scope

- backend `activeMode` persistence
- schema migrations
- OpenAPI changes unless a mismatch is found
- role assignment flows
- contractor onboarding completion
- admin/support mobile
- booking creation
- emergency creation
- chat
- payments and debt actions
- push notifications
- realtime subscriptions

## Completion Criteria

- Android loads `/api/me` after login.
- Android derives supported modes from real roles.
- Active mode is local and corrects itself when roles change.
- Users with client role can enter a client shell.
- Users with contractor role can enter a contractor shell.
- Users with both roles can switch modes.
- Blocked or suspended users cannot enter operational shells.
- Users with no supported Android role see a limited account state.
- Existing public discovery and login access remain intact.
- Unit tests cover account mode selection and `/api/me` parsing.
- No backend permission behavior is moved into Android.
