# iPhone Action Map: Login And Role Switching

## Scope

This document defines the first native iPhone action map slice.

The slice starts at app launch, covers the guest bottom menu, authentication, resolves the linked Yavaa account through `GET /api/me`, and then shows the first post-login native role screen.

Client mode is presented to the user as `Jefe`. Contractor mode is presented to the user as `Trabajador`.

After a normal login, the user explicitly chooses between Jefe and Trabajador. A user can choose a mode that is not fully configured yet; sensitive actions still remain server-validated and can be blocked by missing profile, approval, debt, or status.

Admin and support remain web-only in this slice.

Client and contractor action groups in this document are mode surface entry points and placeholders. They do not imply full native implementation of bookings, emergencies, chat, uploads, availability, or service management in this slice.

## Source Of Truth

- Roles come from the server through `GET /api/me`.
- Account status comes from the server through `GET /api/me`.
- A mobile mode is exactly `client` or `contractor`.
- Admin and support roles are not mobile roles and remain web-only.
- The selected mobile mode is a local navigation preference.
- The previous mobile mode is allowed only when it is `client` or `contractor` and the account status permits entering app mode.
- Server APIs must still validate every sensitive action.

## Guest State

Visible actions:

- Inicio
- Urgencias
- Perfil

Inicio surface:

- View public discovery entry point when exposed by the public API

Urgencias surface:

- Fill an emergency draft before authentication
- Store the draft locally on device
- Continue to Perfil for sign in or sign up before submitting

Perfil surface:

- Sign in
- Create account
- Recover account when exposed by the auth flow

Blocked actions:

- Create booking
- Submit emergency request
- Chat
- Upload files
- Switch to Trabajador mode

## Authenticated Client Mode

These actions are client-mode surface entry points for this slice.

Bottom menu:

- Inicio
- Urgencias
- Mis Casas
- Trabajadores
- Perfil

Inicio surface:

- Jefe summary and fast access to urgent work

Urgencias API-backed surface:

- Create emergency requests for work that needs to be resolved urgently

Mis Casas API-backed surface:

- View saved addresses/properties
- Open each property as the future home for repair history

Trabajadores API-backed surface:

- Search services
- View providers
- Keep space for favorites and history

Perfil API-backed surface:

- View and edit profile
- Manage addresses
- Create address
- Edit address
- Delete address
- Switch to Trabajador mode when the contractor role exists

Future client actions:

- Create scheduled booking
- Create emergency request
- View booking status
- View booking history
- Open booking chat
- Upload booking files
- Confirm completion
- Report a problem
- View account status

## Authenticated Contractor Mode

These actions are contractor-mode surface entry points for this slice.

Bottom menu:

- Inicio
- Urgencias
- Mis Clientes
- Perfil

Inicio surface:

- Trabajador summary
- Show incomplete profile guidance without hiding the menu

Urgencias API-backed surface:

- Browse existing urgent requests available to workers

Mis Clientes API-backed surface:

- Show clients with accepted or completed work only

Perfil API-backed surface:

- View and edit profile
- Create address
- Edit address
- Delete address
- Switch to Jefe mode when the client role exists

Future contractor actions:

- Edit contractor profile
- Manage services
- Manage availability
- Respond to emergency requests
- Open booking chat
- Upload booking files
- Mark booking progress
- View account status

## Blocked Or Suspended Account

Visible actions:

- View account status
- Sign out

Hidden actions:

- Create bookings
- Accept bookings
- Respond to emergencies
- Send chat messages

## Initial Navigation

1. Launch app.
2. Load stored token from Keychain.
3. Call `GET /api/me`.
4. If unauthenticated, show the guest bottom menu: Inicio, Urgencias, Perfil.
5. If authenticated but account status is `BLOCKED` or `SUSPENDED`, show account status and sign out.
6. After a successful native login from Perfil, show the Jefe/Trabajador choice screen.
7. If the user chooses Trabajador without a completed worker profile, enter the Trabajador menu with sensitive actions blocked by server-side checks.
8. If authenticated from a stored token, restore the previous mode when it is still allowed.
9. If the restored mode is no longer allowed, default to client when available.
10. If authentication starts from the guest Urgencias draft, enter directly as Jefe and return to the Jefe urgency surface.

## Test IDs

- IOS-GUEST-AUTH-001: guest can open sign-in screen.
- IOS-GUEST-AUTH-002: successful login stores the token and resolves `/api/me`.
- IOS-GUEST-AUTH-003: failed login shows an error and does not enter the app.
- IOS-GUEST-NAV-001: guest bottom menu shows Inicio, Urgencias, Perfil.
- IOS-GUEST-URGENCY-001: guest can fill an emergency draft before authentication.
- IOS-GUEST-URGENCY-002: login from a guest emergency enters directly as Jefe.
- IOS-CLIENT-MODE-001: client-only account can still choose Jefe or Trabajador after normal login.
- IOS-CONTRACTOR-MODE-001: contractor-only account can still choose Jefe or Trabajador after normal login.
- IOS-MODE-SWITCH-001: dual-role account can switch from client to contractor mode.
- IOS-MODE-SWITCH-003: dual-role account sees a Jefe/Trabajador choice screen after native login.
- IOS-MODE-SWITCH-004: selecting Trabajador changes the scenario before entering contractor mode.
- IOS-MODE-SWITCH-002: client-only account cannot switch to contractor mode.
- IOS-MODE-RESTORE-001: account restores the previous mode when it is `client` or `contractor` and account status permits app entry.
- IOS-MODE-RESTORE-002: app falls back from a disallowed restored mode to client mode when client is available.
- IOS-NO-MOBILE-ROLE-001: authenticated active account without configured app roles can still choose Jefe or Trabajador for onboarding.
- IOS-WEB-ONLY-ROLE-001: admin or support role alone does not grant server-side Jefe or Trabajador permissions.
- IOS-STATUS-001: blocked or suspended account does not show booking or emergency actions.
- IOS-STATUS-002: blocked or suspended account shows sign out.
