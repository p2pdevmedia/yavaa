# Yavaa roadmap replan

Date: 2026-05-09

This plan is a fresh read of the current planning docs and the code that already exists in the repo. I treated the phase docs as the source of truth and checked the implemented API, schema, seed data, permissions, OpenAPI, and tests against them.

## What is already in place

- Etapa 00 is closed.
- Etapa 01 is closed.
- Etapa 02 is active and already has a useful baseline.
- Existing routes already cover the first data and permission surfaces:
  - `/api/me`
  - `/api/me/profile`
  - `/api/me/addresses`
  - `/api/me/contractor-profile`
  - `/api/catalog/categories`
  - `/api/catalog/markets`
  - `/api/admin/categories`
  - `/api/admin/contractors/[contractorProfileId]`
- Prisma already has the core foundation tables and the stage-02 data model for users, profiles, roles, addresses, markets, categories, work zones, contractor profiles, and audit logs.
- There is already deterministic seed work for the launch market, roles, and baseline users.
- There are already tests for permissions, OpenAPI foundation, database tables, auth basics, and a simple Playwright smoke flow.

## What still needs to be done

### 1. Finish Etapa 02 cleanly

Goal: make the data and permission layer fully reliable before any heavier product flow work.

Tasks:

- tighten the Prisma schema where the data model still needs hard guarantees
- verify the migrations reflect the final stage-02 schema, not only the current partial shape
- finish deterministic seeding for the baseline admin, contractor, market, categories, and any fixtures needed by tests
- expand server-side permission helpers so every sensitive action is checked centrally
- make sure ownership, role, approval status, and suspended/blocked state are enforced server-side
- update the OpenAPI document so stage-02 routes have typed request and response contracts
- add or extend tests for:
  - happy paths
  - denied permissions
  - invalid ownership or invalid state
  - seed stability
  - database existence and relation checks

Files likely involved:

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `prisma/seed.mjs`
- `src/lib/permissions.ts`
- `src/lib/openapi.ts`
- `src/app/api/me/*`
- `src/app/api/admin/*`
- `tests/permissions.test.ts`
- `tests/database.test.ts`
- `tests/openapi.test.ts`

### 2. Build Etapa 03: client and contractor flow

Goal: let a client discover a contractor, create a request, and get to a simple end-to-end booking flow.

Tasks:

- add public discovery APIs for provider search by category and location
- expose availability and basic public profile data
- implement scheduled booking creation
- implement emergency request creation
- model request status transitions explicitly
- support accept, reject, cancel, and reschedule decisions
- make sure booking access stays limited to the booking participants and admins
- add tests for booking creation, permission denial, and invalid state transitions

Files likely involved:

- `src/app/api/providers/*`
- `src/app/api/bookings/*`
- `src/lib/booking*`
- `src/lib/permissions.ts`
- `src/lib/openapi.ts`
- `tests/*booking*`
- `tests/e2e/app.spec.ts`

### 3. Build Etapa 04: communication and files

Goal: keep the important coordination inside Yavaa instead of pushing it out to external channels.

Tasks:

- add chat/message persistence tied to bookings
- add system messages for status changes
- support image and file uploads for problem photos and proof files
- define storage behavior clearly and keep the database as the source of truth
- add tests for chat visibility, upload ownership, and file access restrictions

Files likely involved:

- `src/app/api/chat/*`
- `src/app/api/uploads/*`
- `src/lib/storage*`
- `src/lib/openapi.ts`
- `tests/*chat*`
- `tests/*upload*`

### 4. Build Etapa 05: administration and operations

Goal: give admins the tools to moderate and correct the marketplace safely.

Tasks:

- add user management surfaces
- add contractor review and approval flows
- add category moderation flows
- add booking correction and reassignment flows
- add audit logging for every sensitive admin action
- add tests for admin access, denial, and auditability

Files likely involved:

- `src/app/api/admin/users/*`
- `src/app/api/admin/contractors/*`
- `src/app/api/admin/categories/*`
- `src/app/api/admin/bookings/*`
- `src/lib/audit.ts`
- `src/lib/permissions.ts`
- `tests/*admin*`

### 5. Build Etapa 06: debt, reputation, and validations

Goal: handle the trust and risk layer once the operational flows exist.

Tasks:

- add commission debt tracking
- add payment proof review flows
- add debt limits and debt-based blocking
- add ratings and reviews
- add dispute handling rules
- ensure only the right roles can validate or override sensitive states
- add tests for blocked states, duplicate reviews, proof review, and dispute handling

Files likely involved:

- `src/app/api/debt/*`
- `src/app/api/reviews/*`
- `src/app/api/payment-proofs/*`
- `src/app/api/disputes/*`
- `src/lib/permissions.ts`
- `src/lib/openapi.ts`
- `tests/*debt*`
- `tests/*review*`
- `tests/*dispute*`

### 6. Finish with Etapa 07: quality and pilot readiness

Goal: make the product stable enough for a real pilot.

Tasks:

- close coverage gaps across unit, integration, and Playwright tests
- add permission tests for every important action in `docs/testing/user-action-test-matrix.md`
- add invalid-state tests for critical transitions
- verify OpenAPI stays aligned with implemented endpoints
- run a final pass on deterministic seeding and repeatable local setup
- confirm the main user journeys work end to end

Files likely involved:

- `tests/*`
- `tests/e2e/*`
- `docs/testing/user-action-test-matrix.md`
- `docs/product/user-action-map.md`
- `docs/planning/phases/*`

## Recommended execution order

1. Close Etapa 02.
2. Build Etapa 03.
3. Build Etapa 04.
4. Build Etapa 05.
5. Build Etapa 06.
6. Finish Etapa 07.

## Guardrails

- Keep permissions server-side only.
- Keep Prisma as the schema source of truth.
- Update OpenAPI whenever an API changes.
- Add tests before calling a phase done.
- Avoid widening scope into mobile, advanced realtime, or automation before the core marketplace flows are stable.

## Exit criteria

This replan is complete when:

- the remaining stage-02 work is finished and test-covered
- the booking flow exists as a stable stage-03 foundation
- chat and files are implemented with durable storage
- admin operations are auditable and permission-safe
- debt, reputation, and validation flows are explicit
- the critical user journeys pass automated tests and Playwright smoke coverage
