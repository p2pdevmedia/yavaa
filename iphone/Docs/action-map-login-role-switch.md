# iPhone Action Map: Login And Role Switching

## Scope

This document defines the first native iPhone action map slice.

The slice starts at app launch, covers authentication, resolves the linked Yavaa account through `GET /api/me`, and then lets the user choose between client and contractor mode when both roles exist.

Admin and support remain web-only in this slice.

Client and contractor action groups in this document are mode surface entry points and placeholders. They do not imply full native implementation of bookings, emergencies, chat, uploads, availability, or service management in this slice.

## Source Of Truth

- Roles come from the server through `GET /api/me`.
- Account status comes from the server through `GET /api/me`.
- A mobile role is exactly `client` or `contractor`.
- Admin and support roles are not mobile roles and remain web-only.
- The selected mobile mode is a local navigation preference.
- The previous mobile mode is allowed only when it is `client` or `contractor`, exists in the latest `GET /api/me` roles, and the account status permits entering app mode.
- Server APIs must still validate every sensitive action.

## Guest State

Visible actions:

- Sign in
- Create account
- Recover account
- View public discovery entry point when exposed by the public API

Blocked actions:

- Create booking
- Create emergency request
- Chat
- Upload files
- Switch to contractor mode

## Authenticated Client Mode

These actions are client-mode surface entry points for this slice.

Visible action groups:

- Search services
- View providers
- Manage addresses
- Create scheduled booking
- Create emergency request
- View booking status
- View booking history
- Open booking chat
- Upload booking files
- Confirm completion
- Report a problem
- View account status
- Switch to contractor mode when the contractor role exists

## Authenticated Contractor Mode

These actions are contractor-mode surface entry points for this slice.

Visible action groups:

- Edit contractor profile
- Manage services
- Manage availability
- View incoming booking requests
- Accept or reject bookings
- Respond to emergency requests
- Open booking chat
- Upload booking files
- Mark booking progress
- View account status
- Switch to client mode when the client role exists

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
4. If unauthenticated, show auth tabs.
5. If authenticated but account status is `BLOCKED` or `SUSPENDED`, show account status and sign out.
6. If authenticated with one mobile role, enter that mode.
7. If authenticated with client and contractor roles, restore the previous mode when it is still allowed.
8. If the restored mode is no longer allowed, default to client when available.
9. If no mobile role exists, show account status and sign out.

## Test IDs

- IOS-GUEST-AUTH-001: guest can open sign-in screen.
- IOS-GUEST-AUTH-002: successful login stores the token and resolves `/api/me`.
- IOS-GUEST-AUTH-003: failed login shows an error and does not enter the app.
- IOS-CLIENT-MODE-001: client-only account enters client mode.
- IOS-CONTRACTOR-MODE-001: contractor-only account enters contractor mode.
- IOS-MODE-SWITCH-001: dual-role account can switch from client to contractor mode.
- IOS-MODE-SWITCH-002: client-only account cannot switch to contractor mode.
- IOS-MODE-RESTORE-001: dual-role account restores the previous mode when it is `client` or `contractor`, exists in latest `/api/me` roles, and account status permits app entry.
- IOS-MODE-RESTORE-002: app falls back from a disallowed restored mode to client mode when client is available.
- IOS-NO-MOBILE-ROLE-001: authenticated account with no `client` or `contractor` role shows account status and sign out.
- IOS-WEB-ONLY-ROLE-001: admin or support role alone does not enter a native mobile mode.
- IOS-WEB-ONLY-ROLE-002: admin or support role does not make contractor switching visible unless `contractor` also exists.
- IOS-STATUS-001: blocked or suspended account does not show booking or emergency actions.
- IOS-STATUS-002: blocked or suspended account shows sign out.
