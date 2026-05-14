# Bottom Tabs Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a logged-in dashboard bottom tabs navigator with Inicio, contextual mode access, and Perfil.

**Architecture:** A pure route helper owns dashboard tab metadata. A small client component renders active navigation from `usePathname()`. The dashboard layout wraps all protected dashboard pages.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest.

---

### Task 1: Route Metadata

**Files:**
- Modify: `src/lib/dashboard-routes.ts`
- Modify: `tests/dashboard-routes.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests for inferring mode from dashboard paths and generating bottom tab labels and hrefs.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/dashboard-routes.test.ts`

- [ ] **Step 3: Implement route helpers**

Add `getDashboardModeFromPathname()` and `getDashboardTabsForMode()` with no UI imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/dashboard-routes.test.ts`

### Task 2: Bottom Tabs Component

**Files:**
- Create: `src/components/dashboard/bottom-tabs-nav.tsx`
- Modify: `src/app/dashboard/layout.tsx`
- Test: `tests/dashboard-bottom-tabs-design.test.ts`

- [ ] **Step 1: Write failing design test**

Assert the component uses `usePathname`, renders `Inicio`, `Trabajadores`, `Trabajos`, and `Perfil`, and dashboard layout includes the component.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/dashboard-bottom-tabs-design.test.ts`

- [ ] **Step 3: Implement component and layout**

Create the client component and render it from the dashboard layout below `children`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/dashboard-bottom-tabs-design.test.ts`

### Task 3: Worker Routes

**Files:**
- Create: `src/app/dashboard/trabajador/perfil/page.tsx`
- Create: `src/app/dashboard/trabajador/trabajos/page.tsx`

- [ ] **Step 1: Add minimal protected worker profile page**

Use the same server-side checks as `src/app/dashboard/trabajador/page.tsx`, then render the worker profile summary and an edit link to `/dashboard/onboarding/trabajador?editar=1`.

- [ ] **Step 2: Add minimal protected worker jobs page**

Use the same server-side checks as `src/app/dashboard/trabajador/page.tsx`, then render nearby, active, and finished jobs for the `Trabajos` tab.

### Task 4: Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused tests**

Run: `npm run test -- tests/dashboard-routes.test.ts tests/dashboard-bottom-tabs-design.test.ts`

- [ ] **Step 2: Run quality gate**

Run: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
