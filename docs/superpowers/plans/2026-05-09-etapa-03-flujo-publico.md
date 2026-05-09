# Public Discovery Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any visitor discover approved contractors through a public provider search, open a limited public profile, and reach the new public flow from the landing page.

**Architecture:** Keep the public discovery slice API-first and server-enforced. A shared discovery module will own the Prisma queries and the public data shape so the API routes and server-rendered pages never expose private contractor data by accident. This first slice deliberately stops before booking creation and availability scheduling; those belong in the next stage-03 booking slice once the model is in place.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Supabase Postgres, OpenAPI, Vitest, Playwright, shadcn/ui, Tailwind CSS.

---

### Task 1: Add a shared public discovery data module and API routes

**Files:**
- Create: `src/lib/public-discovery.ts`
- Create: `src/app/api/providers/route.ts`
- Create: `src/app/api/providers/[contractorProfileId]/route.ts`
- Modify: `src/lib/openapi.ts`
- Test: `tests/provider-discovery.test.ts`
- Test: `tests/openapi.test.ts`

- [ ] **Step 1: Write the failing tests**

`tests/provider-discovery.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';

import { getPublicProviderProfile, listPublicProviders } from '@/lib/public-discovery';
import { getPrismaClient } from '@/lib/prisma';
import { hasDatabaseEnv } from '@/lib/env';

vi.mock('@/lib/env', () => ({
  hasDatabaseEnv: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

describe('public discovery', () => {
  it('returns only approved active providers filtered by category and market', async () => {
    vi.mocked(hasDatabaseEnv).mockReturnValue(true);

    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'cp_001',
        user: {
          id: 'u_001',
          displayName: 'Carlos Perez',
          status: 'ACTIVE',
          profile: { firstName: 'Carlos', lastName: 'Perez', avatarUrl: null, bio: 'Plomero' }
        },
        approvalStatus: 'APPROVED',
        categories: [
          {
            category: { slug: 'home-services', name: 'Home Services', group: 'home services' },
            isPrimary: true
          }
        ],
        workZones: [
          {
            workZone: {
              slug: 'central',
              name: 'Centro',
              market: {
                slug: 'san-martin-de-los-andes',
                city: 'San Martin de los Andes',
                province: 'Neuquen',
                country: 'Argentina'
              }
            }
          }
        ],
        address: null
      }
    ]);

    vi.mocked(getPrismaClient).mockReturnValue({
      contractorProfile: { findMany }
    } as never);

    const result = await listPublicProviders({
      category: 'home-services',
      market: 'san-martin-de-los-andes'
    });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      contractorProfileId: 'cp_001',
      displayName: 'Carlos Perez',
      marketSlug: 'san-martin-de-los-andes'
    });
    expect(result.items[0]).not.toHaveProperty('email');
    expect(result.items[0]).not.toHaveProperty('supabaseAuthId');
  });

  it('hides unapproved providers from public profile lookups', async () => {
    vi.mocked(hasDatabaseEnv).mockReturnValue(true);

    const findUnique = vi.fn().mockResolvedValue(null);

    vi.mocked(getPrismaClient).mockReturnValue({
      contractorProfile: { findUnique }
    } as never);

    const result = await getPublicProviderProfile('cp_hidden');

    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});
```

`tests/openapi.test.ts`

```ts
import { describe, expect, it } from 'vitest';

import { getOpenApiDocument } from '@/lib/openapi';

describe('openapi public discovery', () => {
  it('publishes public provider search and profile routes', () => {
    const document = getOpenApiDocument();

    expect(document.paths['/api/providers']).toBeDefined();
    expect(document.paths['/api/providers/{contractorProfileId}']).toBeDefined();
    expect(document.paths['/api/providers']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'category' }),
        expect.objectContaining({ name: 'market' })
      ])
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm run test -- tests/provider-discovery.test.ts tests/openapi.test.ts
```

Expected:

- `tests/provider-discovery.test.ts` fails because `src/lib/public-discovery.ts` does not exist yet
- `tests/openapi.test.ts` fails because the new public provider paths are missing from the OpenAPI document

- [ ] **Step 3: Implement the shared data module and routes**

`src/lib/public-discovery.ts`

```ts
export type PublicProviderSearchFilters = {
  category?: string | null;
  market?: string | null;
};

export type PublicProviderCard = {
  contractorProfileId: string;
  displayName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  marketSlug: string | null;
  marketCity: string | null;
  marketProvince: string | null;
  categories: Array<{
    slug: string;
    name: string;
    group: string | null;
    isPrimary: boolean;
  }>;
};

export type PublicProviderProfile = PublicProviderCard & {
  workZones: Array<{
    slug: string;
    name: string;
    description: string | null;
  }>;
};

export async function listPublicProviders(filters: PublicProviderSearchFilters): Promise<{ items: PublicProviderCard[] }> {
  // Read approved contractor profiles only, select public fields only, and filter by category and market.
}

export async function getPublicProviderProfile(contractorProfileId: string): Promise<PublicProviderProfile | null> {
  // Return null for missing, unapproved, or inactive providers.
}
```

`src/app/api/providers/route.ts`

```ts
import { jsonResponse } from '@/lib/http';
import { hasDatabaseEnv } from '@/lib/env';
import { listPublicProviders } from '@/lib/public-discovery';

export async function GET(request: Request) {
  if (!hasDatabaseEnv()) {
    return jsonResponse({ items: [] }, { status: 200 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const market = url.searchParams.get('market');

  return jsonResponse(await listPublicProviders({ category, market }), { status: 200 });
}
```

`src/app/api/providers/[contractorProfileId]/route.ts`

```ts
import { jsonResponse } from '@/lib/http';
import { hasDatabaseEnv } from '@/lib/env';
import { getPublicProviderProfile } from '@/lib/public-discovery';

type RouteContext = {
  params: Promise<{
    contractorProfileId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  if (!hasDatabaseEnv()) {
    return jsonResponse({ provider: null }, { status: 200 });
  }

  const { contractorProfileId } = await params;
  const provider = await getPublicProviderProfile(contractorProfileId);

  if (!provider) {
    return jsonResponse({ provider: null }, { status: 404 });
  }

  return jsonResponse({ provider }, { status: 200 });
}
```

- [ ] **Step 4: Update the OpenAPI document**

Add two new path entries to `src/lib/openapi.ts`:

```ts
'/api/providers': {
  get: {
    operationId: 'listPublicProviders',
    summary: 'Public provider search',
    tags: ['providers'],
    parameters: [
      { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'market', in: 'query', required: false, schema: { type: 'string' } }
    ],
    responses: {
      '200': { description: 'Public provider cards.' }
    }
  }
},
'/api/providers/{contractorProfileId}': {
  get: {
    operationId: 'getPublicProviderProfile',
    summary: 'Public provider profile',
    tags: ['providers'],
    parameters: [
      {
        name: 'contractorProfileId',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
    ],
    responses: {
      '200': { description: 'Limited public profile.' },
      '404': { description: 'Provider not found or not visible.' }
    }
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run:

```bash
npm run test -- tests/provider-discovery.test.ts tests/openapi.test.ts
```

Expected:

- the public discovery helper test passes
- the OpenAPI test passes with the new provider paths

- [ ] **Step 6: Commit**

```bash
git add src/lib/public-discovery.ts src/app/api/providers/route.ts src/app/api/providers/[contractorProfileId]/route.ts src/lib/openapi.ts tests/provider-discovery.test.ts tests/openapi.test.ts
git commit -m "feat: add public provider discovery api"
```

### Task 2: Build the public discovery pages and landing page entry point

**Files:**
- Create: `src/lib/public-catalog.ts`
- Create: `src/app/providers/page.tsx`
- Create: `src/app/providers/[contractorProfileId]/page.tsx`
- Create: `src/components/providers/public-provider-search-form.tsx`
- Create: `src/components/providers/public-provider-card.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/e2e/providers.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

`tests/e2e/providers.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('public provider search is reachable from the landing page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Explorar proveedores/i })).toBeVisible();

  await page.getByRole('link', { name: /Explorar proveedores/i }).click();
  await expect(page).toHaveURL('/providers');
  await expect(page.getByRole('heading', { name: /Proveedores/i })).toBeVisible();
});

test('public search filters by category and market and opens a limited profile', async ({ page }) => {
  await page.goto('/providers');

  await page.getByLabel('Categoría').selectOption('home-services');
  await page.getByLabel('Ubicación').selectOption('san-martin-de-los-andes');
  await page.getByRole('button', { name: /Buscar/i }).click();

  await expect(page.getByText(/Carlos Perez/i)).toBeVisible();
  await page.getByRole('link', { name: /Ver perfil/i }).first().click();

  await expect(page).toHaveURL(/\/providers\//);
  await expect(page.getByText(/@/)).toHaveCount(0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:e2e -- tests/e2e/providers.spec.ts
```

Expected:

- the public providers page does not exist yet
- the landing page does not link to the new public flow yet

- [ ] **Step 3: Implement the pages and reusable UI**

`src/app/providers/page.tsx`

```ts
import { listPublicProviders } from '@/lib/public-discovery';
import { listPublicCatalogCategories, listPublicCatalogMarkets } from '@/lib/public-catalog';
import { PublicProviderSearchForm } from '@/components/providers/public-provider-search-form';
import { PublicProviderCard } from '@/components/providers/public-provider-card';

export default async function ProvidersPage({
  searchParams
}: {
  searchParams?: Promise<{ category?: string; market?: string }>;
}) {
  // Read category and market query params.
  // Load filter options and provider cards server-side.
  // Render a plain GET form so the page works without client state.
}
```

`src/lib/public-catalog.ts`

```ts
export async function listPublicCatalogCategories(): Promise<Array<{ slug: string; name: string }>> {
  // Return active public categories ordered for discovery.
}

export async function listPublicCatalogMarkets(): Promise<Array<{ slug: string; city: string; province: string }>> {
  // Return public markets ordered for discovery.
}
```

`src/app/providers/[contractorProfileId]/page.tsx`

```ts
import { notFound } from 'next/navigation';

import { getPublicProviderProfile } from '@/lib/public-discovery';

export default async function ProviderProfilePage({
  params
}: {
  params: Promise<{ contractorProfileId: string }>;
}) {
  const { contractorProfileId } = await params;
  const provider = await getPublicProviderProfile(contractorProfileId);

  if (!provider) {
    notFound();
  }

  // Render the limited public profile: name, bio, categories, market, and work zones.
}
```

`src/components/providers/public-provider-search-form.tsx`

```tsx
type PublicProviderSearchFormProps = {
  categories: Array<{ slug: string; name: string }>;
  markets: Array<{ slug: string; city: string; province: string }>;
  category: string | null;
  market: string | null;
};

export function PublicProviderSearchForm(props: PublicProviderSearchFormProps) {
  // Plain GET form with a category select, a market select, and a submit button.
}
```

`src/components/providers/public-provider-card.tsx`

```tsx
type PublicProviderCardProps = {
  provider: {
    contractorProfileId: string;
    displayName: string;
    bio: string | null;
    profilePhotoUrl: string | null;
    marketCity: string | null;
    marketProvince: string | null;
    categories: Array<{ slug: string; name: string; isPrimary: boolean }>;
  };
};

export function PublicProviderCard({ provider }: PublicProviderCardProps) {
  // Keep the card limited to public fields only and link to /providers/[contractorProfileId].
}
```

`src/app/page.tsx`

```tsx
<Button asChild>
  <Link href="/providers">Explorar proveedores</Link>
</Button>
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm run test:e2e -- tests/e2e/providers.spec.ts
```

Expected:

- the landing page links to the public flow
- the public providers page renders
- the search form filters by category and market
- the public profile page does not expose private data

- [ ] **Step 5: Commit**

```bash
git add src/app/providers/page.tsx src/app/providers/[contractorProfileId]/page.tsx src/components/providers/public-provider-search-form.tsx src/components/providers/public-provider-card.tsx src/app/page.tsx tests/e2e/providers.spec.ts
git commit -m "feat: add public provider discovery pages"
```

### Task 3: Tighten acceptance coverage and update the stage-03 documentation trail

**Files:**
- Modify: `tests/e2e/app.spec.ts`
- Modify: `docs/planning/phases/etapa-03-flujo-cliente-contratista/README.md`
- Test: `npm run check`

- [ ] **Step 1: Write the failing smoke assertion**

`tests/e2e/app.spec.ts`

```ts
test('landing page exposes the public discovery entry point', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Explorar proveedores/i })).toBeVisible();
  await page.getByRole('link', { name: /Explorar proveedores/i }).click();
  await expect(page).toHaveURL('/providers');
});
```

- [ ] **Step 2: Run the e2e suite to verify the smoke assertion fails if the public entry point is missing**

Run:

```bash
npm run test:e2e -- tests/e2e/app.spec.ts tests/e2e/providers.spec.ts
```

Expected:

- the new smoke assertion fails until the landing page entry point exists
- the providers flow test covers the full public search path

- [ ] **Step 3: Record the first-stage-03 slice in the phase README**

Update `docs/planning/phases/etapa-03-flujo-cliente-contratista/README.md` with a short note that the first execution slice is public discovery only, and that booking creation, acceptance, cancellation, and reschedule logic come in the next stage-03 booking slice.

Suggested text:

```md
## Primer corte

La primera ejecucion de esta etapa cubre el flujo publico:

- busqueda por categoria
- busqueda por ubicacion
- perfiles publicos limitados
- entrada desde la landing page

El siguiente corte de la misma etapa agrega creacion de bookings, solicitudes urgentes y transiciones de estado.
```

- [ ] **Step 4: Run the full validation command**

Run:

```bash
npm run check
```

Expected:

- lint passes
- typecheck passes
- Vitest passes
- the Playwright public discovery coverage passes
- the build still succeeds

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/app.spec.ts docs/planning/phases/etapa-03-flujo-cliente-contratista/README.md
git commit -m "docs: record public discovery slice for stage 3"
```

## Self-Review

- Spec coverage check: the plan covers public search by category and market, limited public profiles, server-side visibility rules, OpenAPI updates, landing-page entry, and end-to-end verification.
- Placeholder scan: there are no TBD markers, vague "add validation" steps, or undefined helper names in the plan.
- Type consistency check: the shared public discovery module exports the same `listPublicProviders` and `getPublicProviderProfile` functions in both routes and tests, and the page props use the same `contractorProfileId` path param.
- Scope check: this plan intentionally does not add bookings, emergency matching, or availability scheduling yet. Those belong in the next stage-03 booking slice after the public discovery layer is stable.
