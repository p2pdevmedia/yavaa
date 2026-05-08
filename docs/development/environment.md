# Environment Setup

## Required variables
- `DATABASE_URL`: PostgreSQL connection string for Prisma.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key for browser and session bootstrap calls.
- `SUPABASE_SERVICE_ROLE_KEY`: Reserved for server-only operations that need elevated access.

## Optional variables
- `DIRECT_URL`: Direct PostgreSQL URL for workflows that need a non-pooled connection.
- `OPENAPI_OUTPUT_PATH`: Output path used by the OpenAPI generation script.

## Local workflow
1. Copy `.env.example` to `.env.local`.
2. Point `DATABASE_URL` at a local Postgres instance or a Supabase database.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.

## Notes
- Keep secrets out of git.
- Do not rely on client-side checks for permissions.
- The app is build-safe when env vars are missing, but database and auth features remain inactive until configured.
