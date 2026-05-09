# Urgencias Etapa 03 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a client create an urgent request, let compatible contractors accept or ignore it, support timeout and admin reassignment, and close stage 03 with tests, OpenAPI, and a basic dashboard flow.

**Architecture:** Keep urgent requests as their own aggregate so they do not interfere with scheduled bookings. The new emergency helper will own matching, candidate selection, and state transitions, while API routes stay thin and server-enforced. We will also expose contractor emergency eligibility through the contractor profile so the matching rules are deterministic and visible in the UI.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Supabase Postgres, OpenAPI, Vitest, Playwright, shadcn/ui, Tailwind CSS.

---

### Task 1: Add emergency data models, seed support, and user/profile mappings

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/migrations/*`
- Modify: `prisma/seed.mjs`
- Modify: `src/lib/app-user.ts`
- Modify: `src/lib/public-discovery.ts`
- Modify: `src/app/api/me/contractor-profile/route.ts`
- Modify: `src/components/dashboard/dashboard-panel.tsx`
- Test: `tests/app-user.test.ts`
- Test: `tests/provider-discovery.test.ts`
- Test: `tests/database.test.ts`

- [ ] **Step 1: Add the failing coverage first**

`tests/database.test.ts`

```ts
expect(rows.map((row) => row.table_name)).toEqual([
  'addresses',
  'audit_logs',
  'bookings',
  'categories',
  'contractor_categories',
  'contractor_profiles',
  'contractor_work_zones',
  'emergency_request_candidates',
  'emergency_requests',
  'markets',
  'profiles',
  'roles',
  'user_roles',
  'users',
  'work_zones'
]);
```

`tests/app-user.test.ts`

```ts
expect(result.user?.contractorProfile).toMatchObject({
  acceptsEmergencies: false
});
```

`tests/provider-discovery.test.ts`

```ts
expect(result.items[0]).toMatchObject({
  contractorProfileId: 'cp_001',
  displayName: 'Carlos Perez',
  marketSlug: 'san-martin-de-los-andes'
});
```

- [ ] **Step 2: Run the tests to confirm the schema gap**

Run:

```bash
npm run test -- tests/database.test.ts tests/app-user.test.ts tests/provider-discovery.test.ts
```

Expected:

- `tests/database.test.ts` fails because the emergency tables are not in the database yet
- the profile mapping tests fail once `acceptsEmergencies` becomes required in the mapped shape

- [ ] **Step 3: Add the schema and mapping updates**

`prisma/schema.prisma`

```prisma
enum EmergencyRequestStatus {
  OPEN
  DISPATCHING
  ACCEPTED
  CANCELLED_BY_CLIENT
  REASSIGNMENT_NEEDED
  EXPIRED
}

enum EmergencyRequestCandidateStatus {
  NOTIFIED
  ACCEPTED
  IGNORED
  EXPIRED
  REVOKED
}

model ContractorProfile {
  acceptsEmergencies Boolean @default(false) @map("accepts_emergencies")
}
```

`src/lib/app-user.ts`

```ts
acceptsEmergencies: boolean;
```

`src/lib/public-discovery.ts`

```ts
acceptsEmergencies: boolean;
```

`src/app/api/me/contractor-profile/route.ts`

```ts
const contractorProfileUpdateSchema = z.object({
  acceptsEmergencies: z.boolean().optional().default(false),
  addressId: z.string().uuid().nullable().optional(),
  dniNumber: z.string().trim().min(6).max(32).nullable().optional(),
  dniFrontUrl: z.string().url().nullable().optional(),
  dniBackUrl: z.string().url().nullable().optional(),
  profilePhotoUrl: z.string().url().nullable().optional(),
  reviewNotes: z.string().trim().max(1000).nullable().optional(),
  submitForReview: z.boolean().optional().default(false)
});
```

`src/components/dashboard/dashboard-panel.tsx`

```tsx
<input
  id="accepts-emergencies"
  type="checkbox"
  checked={contractorDraft.acceptsEmergencies}
  onChange={(event) =>
    setContractorDraft((current) => ({ ...current, acceptsEmergencies: event.target.checked }))
  }
/>
```

- [ ] **Step 4: Apply the Prisma migration and regenerate the client**

Run:

```bash
npm run db:generate
npm run db:deploy
```

Expected:

- Prisma Client is regenerated
- the remote database has the new emergency tables and columns

---

### Task 2: Build the emergency domain helper and API routes

**Files:**
- Create: `src/lib/emergencies.ts`
- Modify: `src/lib/permissions.ts`
- Create: `src/app/api/emergencies/route.ts`
- Create: `src/app/api/emergencies/[emergencyRequestId]/route.ts`
- Create: `src/app/api/emergencies/[emergencyRequestId]/response/route.ts`
- Create: `src/app/api/admin/emergencies/[emergencyRequestId]/reassign/route.ts`
- Modify: `src/lib/openapi.ts`
- Test: `tests/emergencies.test.ts`
- Test: `tests/openapi.test.ts`

- [ ] **Step 1: Write the failing emergency tests**

`tests/emergencies.test.ts`

```ts
it('creates an emergency request and dispatches to eligible contractors', async () => {
  const request = await createEmergencyRequest(prisma as never, clientActor, {
    categoryId: '88888888-8888-4888-8888-888888888888',
    addressId: '66666666-6666-4666-8666-666666666666',
    description: 'Pipe burst and water is flooding the kitchen'
  });

  expect(request.status).toBe('DISPATCHING');
  expect(request.candidates).toHaveLength(1);
});
```

`tests/openapi.test.ts`

```ts
expect(document.paths['/api/emergencies']).toBeDefined();
expect(document.paths['/api/emergencies/{emergencyRequestId}']).toBeDefined();
expect(document.paths['/api/emergencies/{emergencyRequestId}/response']).toBeDefined();
expect(document.paths['/api/admin/emergencies/{emergencyRequestId}/reassign']).toBeDefined();
```

- [ ] **Step 2: Run the tests to confirm the new surface is missing**

Run:

```bash
npm run test -- tests/emergencies.test.ts tests/openapi.test.ts
```

Expected:

- the emergency tests fail because `src/lib/emergencies.ts` and the routes do not exist yet
- the OpenAPI test fails because the new paths are not documented yet

- [ ] **Step 3: Implement the emergency helper and routes**

`src/lib/emergencies.ts`

```ts
export async function createEmergencyRequest(prisma, actor, input) {
  // validate ownership, category, market, contractor eligibility,
  // create the request, create deterministic candidates, and record audit logs
}

export async function respondToEmergencyCandidate(prisma, actor, emergencyRequestId, action, note) {
  // accept or ignore only when the candidate belongs to the contractor and is still actionable
}

export async function cancelEmergencyRequest(prisma, actor, emergencyRequestId) {
  // client cancel for open or dispatching requests
}

export async function reassignEmergencyRequest(prisma, actor, emergencyRequestId, reason) {
  // admin-only manual reassignment
}
```

`src/app/api/emergencies/route.ts`

```ts
export async function GET(request: NextRequest) { /* list visible emergencies */ }
export async function POST(request: NextRequest) { /* create urgent request */ }
```

`src/app/api/emergencies/[emergencyRequestId]/route.ts`

```ts
export async function GET(request: NextRequest, { params }: RouteContext) { /* fetch visible emergency */ }
export async function PATCH(request: NextRequest, { params }: RouteContext) { /* client cancel */ }
```

`src/app/api/emergencies/[emergencyRequestId]/response/route.ts`

```ts
export async function PATCH(request: NextRequest, { params }: RouteContext) { /* contractor accept/ignore */ }
```

`src/app/api/admin/emergencies/[emergencyRequestId]/reassign/route.ts`

```ts
export async function PATCH(request: NextRequest, { params }: RouteContext) { /* admin reassign */ }
```

`src/lib/openapi.ts`

```ts
'/api/emergencies': { /* GET + POST */ },
'/api/emergencies/{emergencyRequestId}': { /* GET + PATCH */ },
'/api/emergencies/{emergencyRequestId}/response': { /* PATCH */ },
'/api/admin/emergencies/{emergencyRequestId}/reassign': { /* PATCH */ }
```

- [ ] **Step 4: Run the emergency helper and route tests**

Run:

```bash
npm run test -- tests/emergencies.test.ts tests/openapi.test.ts
```

Expected:

- the new tests pass

---

### Task 3: Add dashboard and provider UI for emergency visibility

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/dashboard/dashboard-panel.tsx`
- Modify: `src/app/providers/page.tsx`
- Modify: `src/app/providers/[contractorProfileId]/page.tsx`
- Modify: `src/lib/public-discovery.ts`
- Modify: `src/lib/openapi.ts`
- Test: `tests/e2e/app.spec.ts`
- Test: `tests/e2e/providers.spec.ts`

- [ ] **Step 1: Add failing UI expectations**

`tests/e2e/app.spec.ts`

```ts
test('dashboard exposes the emergency request panel for authenticated users', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText(/Urgencias/i)).toBeVisible();
});
```

`tests/e2e/providers.spec.ts`

```ts
await expect(page.getByText(/Emergencias/i)).toBeVisible();
```

- [ ] **Step 2: Run the tests to see the missing UI**

Run:

```bash
npm run test:e2e -- tests/e2e/app.spec.ts tests/e2e/providers.spec.ts
```

Expected:

- the new selectors fail until the dashboard and provider cards render emergency data

- [ ] **Step 3: Implement the UI**

`src/app/dashboard/page.tsx`

```tsx
const categories = await listPublicCatalogCategories();
return <DashboardPanel initialUser={appUser.user} categories={categories} ... />;
```

`src/components/dashboard/dashboard-panel.tsx`

```tsx
// Client emergency request form for clients
// Contractor emergency toggle and incoming request actions for contractors
```

`src/app/providers/page.tsx`

```tsx
<Badge variant={provider.acceptsEmergencies ? 'default' : 'secondary'}>
  {provider.acceptsEmergencies ? 'Emergencias' : 'Sin emergencias'}
</Badge>
```

`src/app/providers/[contractorProfileId]/page.tsx`

```tsx
<Badge variant="outline">
  {provider.acceptsEmergencies ? 'Acepta urgencias' : 'No acepta urgencias'}
</Badge>
```

- [ ] **Step 4: Run the Playwright smoke and UI tests**

Run:

```bash
npm run test:e2e -- tests/e2e/app.spec.ts tests/e2e/providers.spec.ts
```

Expected:

- the dashboard and provider pages expose the emergency-related UI and remain navigable

---

### Task 4: Update docs, seed fixtures, and finish verification

**Files:**
- Modify: `docs/planning/phases/etapa-03-flujo-cliente-contratista/README.md`
- Modify: `docs/superpowers/plans/2026-05-09-etapa-03-urgencias-design.md` if needed
- Modify: `tests/database.test.ts`
- Modify: `tests/openapi.test.ts`
- Modify: `tests/provider-discovery.test.ts`
- Modify: `tests/app-user.test.ts`
- Modify: `tests/permissions.test.ts`
- Test: `npm run check`

- [ ] **Step 1: Add the final assertions**

`tests/permissions.test.ts`

```ts
expect(canCreateEmergencyRequest(activeClient)).toBe(true);
expect(canRespondToEmergencyRequest(activeContractor)).toBe(true);
expect(canReassignEmergencyRequest(activeAdmin)).toBe(true);
```

- [ ] **Step 2: Run the full verification suite**

Run:

```bash
npm run check
```

Expected:

- lint passes
- typecheck passes
- vitest passes
- build passes

- [ ] **Step 3: Mark stage 3 as complete**

Update `docs/planning/phases/etapa-03-flujo-cliente-contratista/README.md` so it reflects:

- discovery public
- scheduled bookings
- emergency requests
- stage 3 closed by slices

---

## Self-review checklist

- The plan covers the emergency data model, matching helper, routes, UI, docs, and verification.
- The booking slice stays untouched except for the contractor profile flag and shared UI mappings.
- The plan keeps urgent requests separate from scheduled bookings, which matches the approved design.
- No placeholder text remains in the actual tasks.
