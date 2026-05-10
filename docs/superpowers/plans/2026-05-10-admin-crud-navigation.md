# Admin CRUD and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build dedicated admin pages, user inspection, category edit/delete, and preserve dashboard bottom navigation.

**Architecture:** Add focused admin library functions for user detail and category CRUD rules. Keep Next.js App Router pages under `src/app/dashboard/admin` so the dashboard layout remains active, and use small Client Components for admin forms/actions.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Zod, shadcn/ui, Vitest, OpenAPI.

---

### Task 1: Category CRUD Business Rules

**Files:**
- Modify: `src/lib/admin-categories.ts`
- Test: `tests/admin-categories.test.ts`

- [ ] Add failing tests for updating a category by ID.
- [ ] Add failing tests for deleting an unused category.
- [ ] Add failing tests for blocking deletion of initial or in-use categories.
- [ ] Implement `updateCategoryForAdmin`.
- [ ] Implement `deleteCategoryForAdmin`.
- [ ] Run `npm run test -- tests/admin-categories.test.ts`.

### Task 2: Category API Contract

**Files:**
- Create: `src/app/api/admin/categories/[categoryId]/route.ts`
- Modify: `src/app/api/admin/categories/route.ts`
- Modify: `src/lib/openapi.ts`
- Test: `tests/openapi.test.ts`

- [ ] Add `PATCH /api/admin/categories/{categoryId}`.
- [ ] Add `DELETE /api/admin/categories/{categoryId}`.
- [ ] Keep `POST /api/admin/categories` for create/upsert compatibility.
- [ ] Map validation, forbidden, not found, initial category, and category-in-use errors.
- [ ] Update OpenAPI paths.
- [ ] Run `npm run test -- tests/admin-categories.test.ts tests/openapi.test.ts`.

### Task 3: Admin User Detail

**Files:**
- Modify: `src/lib/admin-users.ts`
- Modify: `src/app/api/admin/users/[userId]/route.ts`
- Test: `tests/admin-users.test.ts`

- [ ] Add failing tests for admin user detail payload.
- [ ] Add failing tests for forbidden access and missing user.
- [ ] Implement `getUserForAdmin`.
- [ ] Add `GET /api/admin/users/{userId}`.
- [ ] Run `npm run test -- tests/admin-users.test.ts`.

### Task 4: Dedicated Admin Pages

**Files:**
- Modify: `src/lib/dashboard-admin-sections.ts`
- Modify: `src/app/dashboard/admin/page.tsx`
- Create: `src/app/dashboard/admin/usuarios/page.tsx`
- Create: `src/app/dashboard/admin/usuarios/[userId]/page.tsx`
- Create: `src/app/dashboard/admin/categorias/page.tsx`
- Create: `src/app/dashboard/admin/bookings/page.tsx`
- Create: focused client components under `src/components/dashboard/`
- Test: `tests/dashboard-admin-sections.test.ts`

- [ ] Change admin nav sections from hash links to page links.
- [ ] Make `/dashboard/admin` an overview page with links.
- [ ] Move users into `/dashboard/admin/usuarios`.
- [ ] Move categories into `/dashboard/admin/categorias`.
- [ ] Move bookings into `/dashboard/admin/bookings`.
- [ ] Render user detail at `/dashboard/admin/usuarios/[userId]`.
- [ ] Confirm all pages use the dashboard shell and keep bottom navigation.

### Task 5: Verification

**Files:**
- Existing tests and app pages.

- [ ] Run focused Vitest files.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Start dev server if needed and verify admin navigation in the browser.
