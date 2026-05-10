# Admin CRUD and Navigation Design

## Goal

Evolve the MVP admin panel from one anchored screen into dedicated admin pages with safer CRUD operations and deeper user inspection.

## Scope

- Keep admin pages inside the existing dashboard shell so the bottom navigation remains visible.
- Split admin domains into dedicated pages:
  - `/dashboard/admin`
  - `/dashboard/admin/usuarios`
  - `/dashboard/admin/usuarios/[userId]`
  - `/dashboard/admin/categorias`
  - `/dashboard/admin/bookings`
- Add a user detail view that shows identity, roles, profile, contractor profile, bookings as client, bookings as contractor, and audit activity.
- Keep user mutations server-side and audited.
- Upgrade category management from upsert/status-only to CRUD:
  - create
  - edit slug, name, group, and status
  - delete only when the category has no contractor links, bookings, or emergency requests
  - block deletion for initial or already-used categories and guide admins to inactivate instead
- Update OpenAPI for any changed admin API contract.
- Cover important behavior with unit tests and keep Playwright as the target for critical admin UI flows.

## Architecture

Admin routes remain under `src/app/dashboard/admin` and reuse the same `DashboardViewPageShell` flow already used by `/dashboard/admin`, preserving dashboard navigation. Server Components fetch initial admin data; small Client Components handle forms and mutation calls to route handlers.

Business rules live in `src/lib/admin-*` modules, not UI components. API routes remain deterministic, validate payloads with Zod, check active admin permissions server-side, and write audit logs for important category and user changes.

## Category Delete Rule

`DELETE /api/admin/categories/{categoryId}` physically deletes a category only when it is safe:

- category is not initial
- no `ContractorCategory` rows reference it
- no `Booking` rows reference it
- no `EmergencyRequest` rows reference it

If any dependency exists, the endpoint returns `409 category-in-use`. The UI should keep the admin on the page and offer status changes, especially `INACTIVE`, instead of destructive deletion.

## User Detail Rule

`GET /api/admin/users/{userId}` returns a read-only inspection payload for active admins:

- user summary
- profile
- roles
- contractor profile when present
- bookings where the user is client
- bookings where the user's contractor profile is assigned
- recent audit logs tied to the user

The page must not trust frontend role checks; API and server loaders enforce active admin access.

## Tests

- Unit tests for category update by ID and safe deletion.
- Unit tests for user detail inspection payload.
- Route/page tests where existing project patterns allow it.
- Existing admin tests should keep passing.
