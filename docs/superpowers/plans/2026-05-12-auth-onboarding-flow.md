# Auth Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the designed Next.js flow: login/register, profile type selection, role-specific onboarding wizards, and a post-wizard logged-in home for each role.

**Architecture:** Keep the existing Supabase Auth + local Prisma user foundation. Store onboarding state and profile details in `profiles`, enforce every protected transition on the server, and use route helpers to send users to selection, onboarding, or the right dashboard home. Keep job publishing/search as visible client-home entry points only; do not add job tables in this cycle.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth, Prisma/PostgreSQL, Tailwind CSS, Vitest, Playwright.

---

## Scope Decisions

- Add no new product tables in this cycle. The active schema remains `users`, `profiles`, `roles`, `user_roles`.
- Add profile/onboarding columns through one small Prisma migration.
- Implement UI for DNI photo steps, but do not implement real file storage yet. Mark identity verification as `PENDING` after worker wizard completion.
- Client home primary CTA is `Publicar trabajo`, but the real publish-job model/form belongs to the next feature cycle.
- Use routes under `/dashboard` because this is protected profile setup, not public marketing.

## File Map

- Modify `prisma/schema.prisma`: add onboarding fields and enums.
- Create `prisma/migrations/<timestamp>_profile_onboarding_fields/migration.sql`: migration for profile fields.
- Modify `src/lib/app-user.ts`: return onboarding fields with the app user profile.
- Modify `src/lib/dashboard-routes.ts`: centralize route decisions.
- Create `src/lib/onboarding.ts`: validation schemas, step metadata, and completion helpers.
- Create `src/lib/onboarding-actions.ts`: server actions to complete worker/jefe onboarding.
- Modify `src/lib/permissions.ts`: add explicit onboarding permission helpers.
- Create `src/components/onboarding/type-selection.tsx`: role selection cards.
- Create `src/components/onboarding/worker-wizard.tsx`: worker wizard client UI.
- Create `src/components/onboarding/jefe-wizard.tsx`: jefe wizard client UI.
- Create `src/components/dashboard/client-home.tsx`: post-wizard jefe home.
- Create `src/components/dashboard/worker-home.tsx`: minimal post-wizard worker home.
- Modify `src/components/auth/auth-form.tsx`: apply new visual design while preserving Supabase behavior.
- Modify `src/app/dashboard/seleccionar-modo/page.tsx`: become the designed type selection gate.
- Create `src/app/dashboard/onboarding/[mode]/page.tsx`: protected onboarding route.
- Create `src/app/dashboard/jefe/page.tsx`: protected client home.
- Create `src/app/dashboard/trabajador/page.tsx`: protected worker home.
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

`MobileMapPreview` is a presentational placeholder for now. It must not request browser geolocation until a real map integration is planned.

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

### Task 7: Implement Onboarding Server Actions

**Files:**
- Create: `src/lib/onboarding-actions.ts`
- Test: `tests/onboarding-actions.test.ts`

- [ ] **Step 1: Write tests with mocked auth/prisma boundaries**

Cover:
- unauthenticated action rejects
- unlinked user rejects
- suspended user rejects
- missing assigned role rejects
- invalid worker hourly rate rejects
- valid worker payload updates profile and completion timestamp
- valid jefe payload updates profile and completion timestamp

- [ ] **Step 2: Implement actions**

Create:

```ts
export async function completeWorkerOnboarding(input: WorkerOnboardingInput): Promise<ActionResult>;
export async function completeJefeOnboarding(input: JefeOnboardingInput): Promise<ActionResult>;
```

Both actions must:
- resolve authenticated identity
- resolve linked local user
- validate active status
- validate assigned role
- validate payload with zod
- update only the current user's `Profile`
- return the next route

- [ ] **Step 3: Use cents for hourly rate**

Store `workerHourlyRateCents`, computed from ARS integer pesos:

```ts
const workerHourlyRateCents = hourlyRatePesos * 100;
```

- [ ] **Step 4: Run action tests**

Run:

```bash
npm run test -- tests/onboarding-actions.test.ts
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

Call `completeWorkerOnboarding()` from the final actionable step. Server action remains the source of truth.

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

Call `completeJefeOnboarding()` and redirect to `/dashboard/jefe`.

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

Primary CTA should not create a job yet. Link it to a future-safe placeholder state inside the page or a disabled action with clear copy such as `Próximamente`.

- [ ] **Step 2: Worker home**

Minimal protected post-wizard home:
- verification pending state
- hourly rate visible
- selected categories visible
- nearby jobs preview placeholder

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

### Task 11: Add E2E Smoke Coverage

**Files:**
- Create: `tests/e2e/onboarding-flow.spec.ts`

- [ ] **Step 1: Cover protected redirects**

Unauthenticated visits to:
- `/dashboard/seleccionar-modo`
- `/dashboard/onboarding/jefe`
- `/dashboard/onboarding/trabajador`
- `/dashboard/jefe`
- `/dashboard/trabajador`

Expected: redirect to sign-in with `next`.

- [ ] **Step 2: Cover visible logged-out screens**

Smoke test:
- sign-in renders designed login
- sign-up renders designed registration
- forgot/reset remain reachable

- [ ] **Step 3: Add database-backed happy path only if env is available**

Like the current signup E2E, skip when required Supabase/database env is missing.

---

### Task 12: Final Quality Gate

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
- `/dashboard/trabajador`

Expected: no overflow, no broken mobile layout, primary actions match the canvas.

---

## Self-Review

- Spec coverage: login, role selection, two wizards, worker hourly price, and post-wizard client home are covered.
- Scope check: job publishing/search are intentionally not implemented as data models in this plan.
- Permission check: all protected actions and homes validate auth, linked local user, active status, and role server-side.
- Database check: schema changes stay inside `profiles`, preserving the current minimal table set.
