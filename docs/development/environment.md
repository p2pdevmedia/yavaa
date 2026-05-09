# Environment Setup

## Required variables
- `DATABASE_URL`: PostgreSQL connection string for Prisma.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key for browser and session bootstrap calls.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Legacy alias accepted by the helpers if present.
- `SUPABASE_SERVICE_ROLE_KEY`: Reserved for server-only operations that need elevated access.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token used by booking file uploads.

## Optional variables
- `DIRECT_URL`: Direct PostgreSQL URL for workflows that need a non-pooled connection.
- `NEXT_PUBLIC_SITE_URL`: Public web origin used in Supabase Auth email redirects. If omitted, the browser origin is used.
- `OPENAPI_OUTPUT_PATH`: Output path used by the OpenAPI generation script.

## Supabase Auth email sender

Supabase Auth email delivery is configured in the Supabase project settings, not in this app's runtime env.

Auth confirmation and password recovery emails redirect through `/auth/callback`, where the app exchanges the Supabase auth code for a session cookie.

In Supabase Dashboard > Authentication > URL Configuration:

- set Site URL to the canonical deployed web origin, for example `https://www.yavaa.lat`
- add the local development redirect URLs you use, for example `http://localhost:3000/**` and `http://127.0.0.1:3000/**`
- add production or preview callback URLs intentionally, for example `https://www.yavaa.lat/auth/callback` or the approved Vercel preview pattern

To send auth emails from `@yavaa.lat`:

- configure a custom SMTP provider in Supabase
- set the authenticated sender to something like `no-reply@yavaa.lat`
- make sure `yavaa.lat` has SPF, DKIM, and DMARC configured
- use a separate auth sender address from any marketing email address

Recommended providers for the project's MVP email flow include Resend, Postmark, or SendGrid.

## Local workflow
1. Copy `.env.example` to `.env.local`.
2. Point `DATABASE_URL` at a local Postgres instance or a Supabase database.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.

## Testing Supabase

- Our Supabase project is used as a testing environment.
- Schema changes must still be applied through Prisma migrations before anything depends on them.
- Do not treat the testing database as disposable drift; keep it aligned with the schema on purpose.

## Notes
- Keep secrets out of git.
- Do not rely on client-side checks for permissions.
- The app is build-safe when env vars are missing, but database and auth features remain inactive until configured.
