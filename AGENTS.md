# AGENTS.md

# Yavaa

Yavaa is currently a minimal Next.js auth foundation.

The repo should stay focused on:

- home
- login
- registration
- forgot password
- reset password
- protected profile selection after login
- users, profiles, and per-user roles

The only app roles are:

- `jefe`
- `trabajador`

---

# Current Stack

- Next.js
- TypeScript
- Supabase Auth
- PostgreSQL
- Prisma
- Tailwind CSS
- Vitest
- Playwright

---

# Active Routes

- `/`
- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/dashboard/seleccionar-modo`
- `/api/health`
- `/api/session`
- `/api/me`

Do not add new product domains unless the user explicitly starts a new feature cycle.

---

# Database Rules

Prisma is the source of schema truth.

The active tables are:

- `users`
- `profiles`
- `roles`
- `user_roles`

All schema changes require a Prisma migration. Keep migrations small and aligned with the current minimal scope.

---

# Permissions Rules

Permissions must be enforced server-side.

Every protected action must validate:

- authenticated identity
- linked local user
- active user status
- assigned role when selecting a profile mode

Never trust frontend-only permissions.

---

# Development Rules

- Keep patches small.
- Avoid unrelated changes.
- Prefer explicit code over clever abstractions.
- Keep business logic outside UI components.
- Use TypeScript strictly.
- Avoid `any`.
- Keep tests deterministic.
- Do not reintroduce deleted product domains accidentally.

---

# Quality Gate

A task is complete only when the relevant checks pass:

```txt
npm run lint
npm run typecheck
npm run test
npm run build
```
