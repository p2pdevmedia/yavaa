# Auth Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the designed Next.js flow stage by stage: login/register, profile type selection, role-specific onboarding wizards, post-wizard homes, and the first mobile-compatible client marketplace APIs.

**Architecture:** Keep the existing Supabase Auth + local Prisma user foundation. Store onboarding state and profile details in `profiles`, enforce every protected transition on the server, and use route helpers to send users to selection, onboarding, or the right dashboard home. Expose HTTP route handlers for onboarding and marketplace actions so the web app and future native mobile apps can share the same API contracts.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth, Prisma/PostgreSQL, Tailwind CSS, Vitest, Playwright.

---

## Scope Decisions

- Work stage by stage. Each stage must leave the app mobile-compatible, testable, and visually coherent before moving on.
- Stage 1-4 stay inside the existing auth/profile foundation.
- Stage 5 explicitly starts the first marketplace slice requested by the user: publish jobs and search workers. Keep it small and avoid unrelated product domains.
- Add profile/onboarding columns through one small Prisma migration.
- Add marketplace data through one later Prisma migration with only `job_posts`. Do not add chat, payments, files, emergency flows, notifications, bookings, or offers tables in this plan.
- Implement UI for DNI photo and job photo steps, but do not implement real file storage yet. Store no fake uploaded files; keep photo inputs presentational until storage is planned.
- Use routes under `/dashboard` because this is protected app UX, not public marketing.

## Stage Roadmap

### Stage 1: Mobile Visual Foundation + Auth Screens

**Design:** Apply the new Yavaa mobile-first visual language to login/register/forgot/reset: violet primary, 56px controls, soft background, large tappable CTAs, no desktop-only assumptions.

**Models:** No schema changes.

**API:** Preserve existing Supabase Auth calls and existing `/api/session` behavior.

**Routes:** `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`.

**Exit gate:** auth UI matches canvas on mobile and existing auth tests still pass.

### Stage 2: Profile Type Selection + Onboarding Data Model

**Design:** Build the two profile type cards: `Quiero trabajar` and `Quiero contratar`.

**Models:** Add onboarding fields to `profiles`: selected role, completion timestamps, identity status, DNI number, worker categories, hourly rate, address, latitude, longitude.

**API:** Add server-side onboarding validation helpers, permission helpers, and HTTP endpoints for onboarding status. No browser-only authorization.

**Routes:** `/dashboard`, `/dashboard/seleccionar-modo`.

**Exit gate:** authenticated users route to selection; selecting a role routes to the correct onboarding or post-onboarding home.

### Stage 3: Worker Wizard

**Design:** Build the full mobile worker wizard: name, DNI, DNI photos, work zone, categories, hourly price, success.

**Models:** Save worker profile fields on `profiles`; hourly rate stored as cents.

**API:** `POST /api/onboarding/trabajador` validates authenticated identity, linked local user, active user status, assigned `trabajador` role, and payload.

**Routes:** `/dashboard/onboarding/trabajador`, `/dashboard/trabajador`.

**Exit gate:** worker cannot reach worker home until the wizard is complete; worker home shows verification state, categories, and hourly rate.

### Stage 4: Jefe Wizard + Client Home

**Design:** Build the jefe wizard and the post-wizard client home. Client home has one dominant action: `Publicar trabajo`.

**Models:** Save jefe profile fields on `profiles`.

**API:** `POST /api/onboarding/jefe` validates authenticated identity, linked local user, active user status, assigned `jefe` role, and payload.

**Routes:** `/dashboard/onboarding/jefe`, `/dashboard/jefe`.

**Exit gate:** jefe cannot reach client home until the wizard is complete; mobile home hierarchy matches `client-home-priority.html`.

### Stage 5: Publish Job + Search Workers API

**Design:** Build a mobile-first publish-job screen from the client home CTA and a secondary worker search screen.

**Models:** Add one table, `job_posts`, owned by the local `users` row for the client. Search workers reads from completed worker profiles.

**API:** Add route handlers:
- `POST /api/job-posts`
- `GET /api/job-posts`
- `GET /api/workers/search`

**Routes:** `/dashboard/jefe/publicar-trabajo`, `/dashboard/jefe/buscar-trabajadores`.

**Exit gate:** client can publish a short job post, see it in client home, and search verified/completed worker profiles from mobile.

### Stage 6: Final Mobile QA + Quality Gate

**Design:** Browser-check mobile and desktop widths. Mobile is the primary target.

**Models:** Verify migrations are small and reversible in development.

**API:** Verify unauthenticated and unauthorized requests fail consistently.

**Exit gate:** `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass.

## File Map

- Modify `prisma/schema.prisma`: add onboarding fields and enums.
- Create `prisma/migrations/<timestamp>_profile_onboarding_fields/migration.sql`: migration for profile fields.
- Create `prisma/migrations/<timestamp>_job_posts/migration.sql`: migration for the first marketplace table.
- Modify `src/lib/app-user.ts`: return onboarding fields with the app user profile.
- Modify `src/lib/dashboard-routes.ts`: centralize route decisions.
- Create `src/lib/onboarding.ts`: validation schemas, step metadata, and completion helpers.
- Create `src/lib/onboarding-service.ts`: shared server-only onboarding completion logic.
- Create `src/lib/onboarding-actions.ts`: optional web server actions that call the shared service.
- Create `src/lib/job-posts.ts`: validation and persistence helpers for client job posts.
- Create `src/lib/worker-search.ts`: completed-worker search helpers.
- Modify `src/lib/permissions.ts`: add explicit onboarding permission helpers.
- Create `src/components/onboarding/type-selection.tsx`: role selection cards.
- Create `src/components/onboarding/worker-wizard.tsx`: worker wizard client UI.
- Create `src/components/onboarding/jefe-wizard.tsx`: jefe wizard client UI.
- Create `src/components/dashboard/client-home.tsx`: post-wizard jefe home.
- Create `src/components/dashboard/worker-home.tsx`: minimal post-wizard worker home.
- Create `src/components/jobs/publish-job-form.tsx`: mobile publish-job form.
- Create `src/components/workers/worker-search.tsx`: mobile worker search UI.
- Modify `src/components/auth/auth-form.tsx`: apply new visual design while preserving Supabase behavior.
- Modify `src/app/dashboard/seleccionar-modo/page.tsx`: become the designed type selection gate.
- Create `src/app/dashboard/onboarding/[mode]/page.tsx`: protected onboarding route.
- Create `src/app/dashboard/jefe/page.tsx`: protected client home.
- Create `src/app/dashboard/jefe/publicar-trabajo/page.tsx`: protected publish-job page.
- Create `src/app/dashboard/jefe/buscar-trabajadores/page.tsx`: protected worker search page.
- Create `src/app/dashboard/trabajador/page.tsx`: protected worker home.
- Create `src/app/api/onboarding/trabajador/route.ts`: mobile-compatible worker onboarding API.
- Create `src/app/api/onboarding/jefe/route.ts`: mobile-compatible jefe onboarding API.
- Create `src/app/api/job-posts/route.ts`: protected job post API.
- Create `src/app/api/workers/search/route.ts`: protected worker search API.
- Modify `src/app/dashboard/page.tsx`: route to the correct next step.
- Modify `src/app/globals.css` and `tailwind.config.ts`: align tokens with design docs.
- Add/update Vitest files under `tests/`.
- Add/update Playwright coverage in `tests/e2e/auth-login.spec.ts` or a new `tests/e2e/onboarding-flow.spec.ts`.

---

### Task 1: Add Profile Onboarding Data

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_profile_onboarding_fields/migration.sql`
- Modify: `tests/database.test.ts`

- [ ] **Step 1: Write schema expectation test**

Update `tests/database.test.ts` so it still asserts only the minimal auth tables exist, and add a query that verifies the new `profiles` columns exist.

Expected columns:
- `onboarding_role`
- `worker_onboarding_completed_at`
- `jefe_onboarding_completed_at`
- `identity_verification_status`
- `dni_number`
- `worker_categories`
- `worker_hourly_rate_cents`
- `address_text`
- `location_latitude`
- `location_longitude`

- [ ] **Step 2: Add Prisma schema fields**

Use fields on `Profile`, not new tables:

```prisma
enum OnboardingRole {
  jefe
  trabajador
}

enum IdentityVerificationStatus {
  NOT_STARTED
  PENDING
  VERIFIED
  REJECTED
}
```

Add nullable fields to `Profile` for role, completion timestamps, DNI number, categories, hourly rate, address text, and coordinates.

- [ ] **Step 3: Create migration**

Run:

```bash
npm run db:migrate -- --name profile_onboarding_fields
```

Expected: Prisma creates one migration and regenerates the client.

- [ ] **Step 4: Verify database tests**

Run:

```bash
npm run test -- tests/database.test.ts
```

Expected: PASS when `DATABASE_URL` is available, otherwise database suite remains skipped.

---

### Task 2: Centralize Onboarding Rules

**Files:**
- Create: `src/lib/onboarding.ts`
- Modify: `src/lib/app-user.ts`
- Modify: `src/lib/permissions.ts`
- Test: `tests/onboarding.test.ts`
- Test: `tests/permissions.test.ts`

- [ ] **Step 1: Add unit tests for route/completion decisions**

Test these cases:
- active `jefe` without completed jefe onboarding goes to `/dashboard/onboarding/jefe`
- active `jefe` with completed jefe onboarding goes to `/dashboard/jefe`
- active `trabajador` without completed worker onboarding goes to `/dashboard/onboarding/trabajador`
- active `trabajador` with completed worker onboarding goes to `/dashboard/trabajador`
- suspended users cannot complete onboarding
- users cannot complete onboarding for an unassigned role

- [ ] **Step 2: Implement onboarding helpers**

Create `src/lib/onboarding.ts` with:

```ts
export const onboardingModes = ['jefe', 'trabajador'] as const;
export type OnboardingMode = (typeof onboardingModes)[number];

export function isOnboardingMode(value: string): value is OnboardingMode;
export function hasCompletedOnboarding(profile: AppUserProfile | null, mode: OnboardingMode): boolean;
export function getRequiredOnboardingPath(mode: OnboardingMode): Route;
export function getPostOnboardingDashboardPath(mode: OnboardingMode): Route;
```

Use `zod` schemas for worker and jefe payloads. Worker requires first name, last name, DNI number, address, categories, and hourly rate. Jefe requires first name, last name, address, and optional avatar URL.

- [ ] **Step 3: Extend permission helpers**

Add:

```ts
export function canCompleteOnboarding(context: PermissionContext, mode: AppRoleSlug): boolean {
  return canSelectProfileMode(context, mode);
}
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm run test -- tests/onboarding.test.ts tests/permissions.test.ts
```

Expected: PASS.

---

### Task 3: Route Users Through The Flow

**Files:**
- Modify: `src/lib/dashboard-routes.ts`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/seleccionar-modo/page.tsx`
- Create: `tests/dashboard-flow.test.ts`

- [ ] **Step 1: Add route helper tests**

Cover:
- default dashboard path remains `/dashboard/seleccionar-modo`
- mode selection path remains `/dashboard/seleccionar-modo?perfil=jefe|trabajador`
- onboarding path resolves to `/dashboard/onboarding/jefe|trabajador`
- post-onboarding home resolves to `/dashboard/jefe|trabajador`

- [ ] **Step 2: Implement route helpers**

Add helpers to avoid ad hoc string building in pages:

```ts
export function getOnboardingPath(mode: DashboardMode): Route;
export function getDashboardHomePath(mode: DashboardMode): Route;
export function getNextDashboardPathForMode(appUser: AppUserSummary, mode: DashboardMode): Route;
```

- [ ] **Step 3: Update dashboard redirect**

`src/app/dashboard/page.tsx` should:
- require authentication
- resolve local app user
- redirect unlinked/database-unavailable states through existing handling where possible
- redirect ready users to `/dashboard/seleccionar-modo`

- [ ] **Step 4: Update mode selection behavior**

When `perfil` is present and allowed:
- if onboarding incomplete, redirect to onboarding route
- if onboarding complete, redirect to role home

When `perfil` is absent:
- render the designed type selection cards.

- [ ] **Step 5: Run route tests**

Run:

```bash
npm run test -- tests/dashboard-flow.test.ts tests/dashboard-routes.test.ts
```

Expected: PASS.

---

### Task 4: Build Shared Visual Components

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `src/components/onboarding/onboarding-shell.tsx`
- Create: `src/components/onboarding/progress-bar.tsx`
- Create: `src/components/onboarding/mobile-map-preview.tsx`

- [ ] **Step 1: Align design tokens**

Use the design tokens:
- background `#FBFAF8`
- primary violet `#6E3FF3`
- violet hover `#5B30D9`
- violet soft `#EFE7FF`
- neutral text `#111111`
- secondary text `#666666`
- border `#E5E5E5`
- success `#10B981`

- [ ] **Step 2: Create wizard shell**

`OnboardingShell` should provide:
- mobile-first full-height layout
- top brand/status area
- progress area
- content slot
- sticky bottom action slot

- [ ] **Step 3: Create map preview**

`MobileMapPreview` is a static visual component for now. It must not request browser geolocation until a real map integration is planned.

- [ ] **Step 4: Run lint/typecheck**

Run:

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

---

### Task 5: Restyle Login And Registration

**Files:**
- Modify: `src/components/auth/auth-form.tsx`
- Modify: `src/app/sign-in/page.tsx`
- Modify: `src/app/sign-up/page.tsx`
- Test: `tests/e2e/auth-login.spec.ts`

- [ ] **Step 1: Preserve auth behavior**

Do not change Supabase calls. Keep:
- email/password sign in
- email/password sign up
- Google OAuth
- confirmation message
- configured/unconfigured Supabase state
- forgot password link

- [ ] **Step 2: Apply the new mobile-first design**

Match the canvas:
- Yavaa brand block
- large friendly title
- 56px rounded inputs/buttons
- primary violet CTA
- secondary create-account/sign-in CTA
- forgot password as lightweight link

- [ ] **Step 3: Update Playwright selectors only if needed**

Existing labels should remain:
- `Correo electrónico`
- `Contraseña`
- `Registrar cuenta`

- [ ] **Step 4: Run e2e smoke**

Run:

```bash
npm run test:e2e -- tests/e2e/auth-login.spec.ts
```

Expected: PASS or skipped where database/env requirements are missing.

---

### Task 6: Implement Type Selection Screen

**Files:**
- Create: `src/components/onboarding/type-selection.tsx`
- Modify: `src/app/dashboard/seleccionar-modo/page.tsx`
- Test: `tests/permissions.test.ts`
- Test: `tests/dashboard-flow.test.ts`

- [ ] **Step 1: Render designed role cards**

Cards:
- `Quiero trabajar`
- `Quiero contratar`

Each card links to `getModeSelectionPath(mode)`.

- [ ] **Step 2: Keep server-side role enforcement**

Do not hide security in the frontend. `page.tsx` must still call `canSelectProfileMode()` before redirecting to onboarding/home.

- [ ] **Step 3: Preserve unavailable states**

Keep existing:
- `DashboardDatabaseUnavailableState`
- `DashboardUnlinkedUserState`
- `SignOutButton`

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm run test -- tests/permissions.test.ts tests/dashboard-flow.test.ts
```

Expected: PASS.

---

### Task 7: Implement Onboarding API And Web Actions

**Files:**
- Create: `src/lib/onboarding-service.ts`
- Create: `src/lib/onboarding-actions.ts`
- Create: `src/app/api/onboarding/trabajador/route.ts`
- Create: `src/app/api/onboarding/jefe/route.ts`
- Test: `tests/onboarding-actions.test.ts`
- Test: `tests/api-onboarding.test.ts`

- [ ] **Step 1: Write tests with mocked auth/prisma boundaries**

Cover:
- unauthenticated action rejects
- unlinked user rejects
- suspended user rejects
- missing assigned role rejects
- invalid worker hourly rate rejects
- valid worker payload updates profile and completion timestamp
- valid jefe payload updates profile and completion timestamp

- [ ] **Step 2: Implement shared server service**

Create:

```ts
export async function completeWorkerOnboardingForUser(input: WorkerOnboardingInput): Promise<ActionResult>;
export async function completeJefeOnboardingForUser(input: JefeOnboardingInput): Promise<ActionResult>;
```

Both service functions must:
- resolve authenticated identity
- resolve linked local user
- validate active status
- validate assigned role
- validate payload with zod
- update only the current user's `Profile`
- return the next route

- [ ] **Step 3: Implement HTTP route handlers**

Create:
- `POST /api/onboarding/trabajador`
- `POST /api/onboarding/jefe`

Both endpoints accept JSON, call the shared service, and return JSON. This is the mobile-compatible API contract.

- [ ] **Step 4: Implement web server actions**

`src/lib/onboarding-actions.ts` should call the same shared service so the web UI and mobile API cannot drift.

- [ ] **Step 5: Use cents for hourly rate**

Store `workerHourlyRateCents`, computed from ARS integer pesos:

```ts
const workerHourlyRateCents = hourlyRatePesos * 100;
```

- [ ] **Step 6: Run action and API tests**

Run:

```bash
npm run test -- tests/onboarding-actions.test.ts tests/api-onboarding.test.ts
```

Expected: PASS.

---

### Task 8: Implement Worker Wizard UI

**Files:**
- Create: `src/components/onboarding/worker-wizard.tsx`
- Create/Modify: `src/app/dashboard/onboarding/[mode]/page.tsx`
- Test: `tests/e2e/onboarding-flow.spec.ts`

- [ ] **Step 1: Build client-side wizard state**

Steps:
1. `¿Cómo te llamás?`
2. `Validemos tu identidad`
3. `Subí fotos del DNI`
4. `¿Dónde trabajás?`
5. `¿Qué trabajos hacés?`
6. `¿Cuánto cobrás por hora?`
7. `Tu perfil está listo`

- [ ] **Step 2: Validate before moving forward**

Client validation:
- first/last name required
- DNI numeric with Argentine length
- address required
- at least one category
- hourly price numeric and greater than 0

- [ ] **Step 3: Submit once at the end**

Submit to `POST /api/onboarding/trabajador` from the final actionable step. The API route remains the source of truth, and the web action can wrap the same service if needed.

- [ ] **Step 4: Redirect after completion**

After success, route to `/dashboard/trabajador`.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test
npm run typecheck
```

Expected: PASS.

---

### Task 9: Implement Jefe Wizard UI

**Files:**
- Create: `src/components/onboarding/jefe-wizard.tsx`
- Modify: `src/app/dashboard/onboarding/[mode]/page.tsx`
- Test: `tests/e2e/onboarding-flow.spec.ts`

- [ ] **Step 1: Build client-side wizard state**

Steps:
1. `Tus datos`
2. `¿Dónde necesitás ayuda?`
3. `Agregá una foto`
4. `Ya podés contratar`

- [ ] **Step 2: Make photo optional**

The avatar/photo step can be skipped. Do not block completion on file storage.

- [ ] **Step 3: Submit on final step**

Submit to `POST /api/onboarding/jefe` and redirect to `/dashboard/jefe`.

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm run test
npm run typecheck
```

Expected: PASS.

---

### Task 10: Implement Post-Wizard Homes

**Files:**
- Create: `src/components/dashboard/client-home.tsx`
- Create: `src/components/dashboard/worker-home.tsx`
- Create: `src/app/dashboard/jefe/page.tsx`
- Create: `src/app/dashboard/trabajador/page.tsx`
- Test: `tests/dashboard-flow.test.ts`

- [ ] **Step 1: Client home**

Use the canvas hierarchy:
- greeting
- dominant violet `Publicá un trabajo` card
- secondary `Buscar trabajadores`
- secondary offers/suggested workers preview

Primary CTA links to `/dashboard/jefe/publicar-trabajo`. Secondary worker search links to `/dashboard/jefe/buscar-trabajadores`.

- [ ] **Step 2: Worker home**

Minimal protected post-wizard home:
- verification pending state
- hourly rate visible
- selected categories visible
- nearby jobs empty state until Stage 5 job posts are available

- [ ] **Step 3: Enforce server-side access**

Each home must validate:
- authenticated identity
- linked local user
- active status
- assigned role
- completed onboarding for that role

Incomplete users redirect back to the correct onboarding route.

- [ ] **Step 4: Run route tests**

Run:

```bash
npm run test -- tests/dashboard-flow.test.ts tests/permissions.test.ts
```

Expected: PASS.

---

### Task 11: Add Job Post Model And API

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_job_posts/migration.sql`
- Create: `src/lib/job-posts.ts`
- Create: `src/app/api/job-posts/route.ts`
- Test: `tests/job-posts.test.ts`
- Test: `tests/api-job-posts.test.ts`

- [ ] **Step 1: Add the first marketplace model**

Add only this marketplace table:

```prisma
enum JobPostStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
}

model JobPost {
  id          String        @id @default(uuid()) @db.Uuid
  clientId    String        @map("client_id") @db.Uuid
  title       String
  category    String
  description String
  addressText String        @map("address_text")
  desiredTime DateTime?     @map("desired_time")
  status      JobPostStatus @default(PUBLISHED)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  client User @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId, createdAt])
  @@index([category, status])
  @@map("job_posts")
}
```

Also add `jobPosts JobPost[]` to `User`.

- [ ] **Step 2: Create validation helpers**

`src/lib/job-posts.ts` exports:

```ts
export const createJobPostSchema = z.object({
  title: z.string().trim().min(3).max(80),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(800),
  addressText: z.string().trim().min(3).max(160),
  desiredTime: z.string().datetime().optional()
});
```

The helper must enforce:
- authenticated identity
- linked local user
- active status
- assigned `jefe` role
- completed jefe onboarding

- [ ] **Step 3: Implement `POST /api/job-posts`**

Request body:

```json
{
  "title": "Pintar una habitación",
  "category": "painting",
  "description": "Necesito pintar una habitación chica esta semana.",
  "addressText": "Salta Capital",
  "desiredTime": "2026-05-20T15:00:00.000Z"
}
```

Successful response:

```json
{
  "jobPost": {
    "id": "uuid",
    "title": "Pintar una habitación",
    "category": "painting",
    "status": "PUBLISHED"
  }
}
```

- [ ] **Step 4: Implement `GET /api/job-posts`**

Return only the authenticated client's own posts, newest first.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test -- tests/job-posts.test.ts tests/api-job-posts.test.ts
```

Expected: PASS.

---

### Task 12: Add Worker Search API

**Files:**
- Create: `src/lib/worker-search.ts`
- Create: `src/app/api/workers/search/route.ts`
- Test: `tests/worker-search.test.ts`
- Test: `tests/api-worker-search.test.ts`

- [ ] **Step 1: Define searchable worker result**

Return only workers that:
- are active users
- have assigned `trabajador` role
- completed worker onboarding
- have at least one category

Response shape:

```json
{
  "workers": [
    {
      "id": "uuid",
      "displayName": "Carla R.",
      "categories": ["cleaning"],
      "hourlyRateCents": 450000,
      "identityVerificationStatus": "PENDING",
      "distanceLabel": "Cerca"
    }
  ]
}
```

- [ ] **Step 2: Implement query params**

Support:
- `category`
- `q`

Do not implement live geospatial search yet. Use profile location fields later when real distance ranking is planned.

- [ ] **Step 3: Enforce protected client access**

The API must validate:
- authenticated identity
- linked local user
- active status
- assigned `jefe` role
- completed jefe onboarding

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test -- tests/worker-search.test.ts tests/api-worker-search.test.ts
```

Expected: PASS.

---

### Task 13: Build Publish Job And Worker Search Screens

**Files:**
- Create: `src/components/jobs/publish-job-form.tsx`
- Create: `src/components/workers/worker-search.tsx`
- Create: `src/app/dashboard/jefe/publicar-trabajo/page.tsx`
- Create: `src/app/dashboard/jefe/buscar-trabajadores/page.tsx`
- Modify: `src/components/dashboard/client-home.tsx`
- Test: `tests/e2e/marketplace-entry.spec.ts`

- [ ] **Step 1: Build mobile publish form**

Fields:
- title
- category
- description
- location
- desired time
- optional photos UI only

CTA:
- `Publicar y recibir ofertas`

- [ ] **Step 2: Connect form to API**

Submit with `fetch('/api/job-posts', { method: 'POST' })`.

On success:
- show success state
- link back to `/dashboard/jefe`

- [ ] **Step 3: Build worker search screen**

UI:
- search input
- category chips
- worker cards with name, category, hourly price, verification state

Fetch from `/api/workers/search`.

- [ ] **Step 4: Keep mobile compatibility**

Both screens must:
- work at 360px width
- use tappable controls at least 44px high
- avoid horizontal scrolling
- keep one dominant CTA per screen

- [ ] **Step 5: Run visual and e2e checks**

Run:

```bash
npm run test:e2e -- tests/e2e/marketplace-entry.spec.ts
```

Expected: PASS or deterministic skip where environment is missing.

---

### Task 14: Add E2E Smoke Coverage

**Files:**
- Create: `tests/e2e/onboarding-flow.spec.ts`

- [ ] **Step 1: Cover protected redirects**

Unauthenticated visits to:
- `/dashboard/seleccionar-modo`
- `/dashboard/onboarding/jefe`
- `/dashboard/onboarding/trabajador`
- `/dashboard/jefe`
- `/dashboard/trabajador`
- `/dashboard/jefe/publicar-trabajo`
- `/dashboard/jefe/buscar-trabajadores`

Expected: redirect to sign-in with `next`.

- [ ] **Step 2: Cover visible logged-out screens**

Smoke test:
- sign-in renders designed login
- sign-up renders designed registration
- forgot/reset remain reachable

- [ ] **Step 3: Add database-backed happy path only if env is available**

Like the current signup E2E, skip when required Supabase/database env is missing.

---

### Task 15: Final Quality Gate

**Files:** all changed files.

- [ ] **Step 1: Run full quality gate**

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Run Playwright where environment supports it**

Run:

```bash
npm run test:e2e
```

Expected: PASS or deterministic skips for missing env.

- [ ] **Step 3: Manual visual check**

Start dev server:

```bash
npm run dev
```

Check:
- `/sign-in`
- `/sign-up`
- `/dashboard/seleccionar-modo`
- `/dashboard/onboarding/trabajador`
- `/dashboard/onboarding/jefe`
- `/dashboard/jefe`
- `/dashboard/jefe/publicar-trabajo`
- `/dashboard/jefe/buscar-trabajadores`
- `/dashboard/trabajador`

Expected: no overflow, no broken mobile layout, primary actions match the canvas.

---

## Self-Review

- Spec coverage: login, role selection, two wizards, worker hourly price, and post-wizard client home are covered.
- Scope check: job publishing/search are intentionally not implemented as data models in this plan.
- Permission check: all protected actions and homes validate auth, linked local user, active status, and role server-side.
- Database check: schema changes stay inside `profiles`, preserving the current minimal table set.
