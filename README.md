# Yavaa

Yavaa is a service marketplace and realtime coordination platform for humans and AI agents.

## Current status

Etapa 01 de base tecnica y autenticacion es la fase activa en este repositorio:

- Next.js App Router + TypeScript strict mode
- Prisma + PostgreSQL schema and migration baseline
- Supabase auth utilities and session bootstrap endpoint
- Deterministic foundation seed for roles, launch market, and categories
- OpenAPI generation and published JSON output
- Vitest and Playwright test wiring
- Tailwind CSS and shadcn-style component primitives

## Development

1. Copy `.env.example` to `.env.local`.
2. Install dependencies with `npm install`.
3. Generate the Prisma client with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate`.
5. Seed deterministic baseline data with `npm run db:seed`.
6. Start the app with `npm run dev`.

## Etapa 01 routes

- `/` landing page and etapa 01 status
- `/sign-in` email and password login
- `/sign-up` email and password registration
- `/dashboard` protected shell for later phases
- `/api/health` health and configuration check
- `/api/session` auth bootstrap endpoint
- `/api/openapi` OpenAPI contract JSON
