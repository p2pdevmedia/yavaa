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
- keep legacy/non-canonical callback variants only while links may still use them, for example `https://yavaa.lat/auth/callback`

Password recovery must arrive at the callback, not only at the site root. A valid recovery email
created by the app should include a `redirect_to` value shaped like:

```txt
https://www.yavaa.lat/auth/callback?next=%2Freset-password
```

If the email link contains only `redirect_to=https://www.yavaa.lat` or `redirect_to=https://yavaa.lat`,
the user will land on the home page instead of the reset form. In that case:

- verify `NEXT_PUBLIC_SITE_URL=https://www.yavaa.lat` in the deployed app environment
- verify the callback URL above is allow-listed in Supabase Auth URL Configuration
- if using a custom recovery email template, keep Supabase's `{{ .ConfirmationURL }}` link or another dynamic redirect value; do not hard-code `{{ .SiteURL }}` as the recovery link target

To send auth emails from `@yavaa.lat`:

- configure a custom SMTP provider in Supabase
- set the authenticated sender to something like `no-reply@yavaa.lat`
- make sure `yavaa.lat` has SPF, DKIM, and DMARC configured
- use a separate auth sender address from any marketing email address

Recommended providers for the project's MVP email flow include Resend, Postmark, or SendGrid.

## Supabase Auth Google provider

Google login and signup use Supabase OAuth and the same `/auth/callback` route as email auth.
Do not commit Google client secrets to the repository.

In Supabase Dashboard > Authentication > Providers > Google:

- enable Google
- paste the Google OAuth Client ID and Client Secret from the local Google client JSON
- keep the provider redirect URL shown by Supabase available for the Google Cloud OAuth client

In Google Cloud Console > APIs & Services > Credentials > OAuth client:

- add the Supabase provider callback as an authorized redirect URI, for example `https://<project-ref>.supabase.co/auth/v1/callback`
- keep the deployed app origin, for example `https://yavaa.lat`, as an authorized JavaScript origin when Google requires it

In Supabase Dashboard > Authentication > URL Configuration:

- keep the app callback URL allow-listed, for example `https://www.yavaa.lat/auth/callback`
- keep local development callbacks allow-listed, for example `http://localhost:3000/**` and `http://127.0.0.1:3000/**`

## Local workflow
1. Copy `.env.example` to `.env.local`.
2. Point `DATABASE_URL` at a local Postgres instance or a Supabase database.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.

## Supabase Prisma connection strings

For local Postgres, `DATABASE_URL` and `DIRECT_URL` can point at the same local database.

For hosted Supabase, keep these two URLs separate when possible:

- `DATABASE_URL`: runtime URL used by the Next.js app. In serverless/Vercel-style environments, use the Supabase session pooler URL because the direct `db.<project-ref>.supabase.co` hostname can be IPv6-only.
- `DIRECT_URL`: direct database URL for workflows that need a non-pooled connection. The current Prisma schema still reads `DATABASE_URL`, so use a Prisma-compatible URL when running migrations.

Example shape:

```txt
DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@<pooler-host>:5432/postgres"
DIRECT_URL="postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres"
```

For the current Yavaa Supabase project (`mvzkbhnfuhjvnojncwbf`, region `us-west-1`), the verified pooler host is:

```txt
aws-1-us-west-1.pooler.supabase.com
```

The resulting runtime URL shape is:

```txt
DATABASE_URL="postgresql://postgres.mvzkbhnfuhjvnojncwbf:<db-password>@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
```

Do not commit real database passwords. Update deployed environment variables through the hosting provider.

## Testing Supabase

- Our Supabase project is used as a testing environment.
- Schema changes must still be applied through Prisma migrations before anything depends on them.
- Do not treat the testing database as disposable drift; keep it aligned with the schema on purpose.

## Notes
- Keep secrets out of git.
- Do not rely on client-side checks for permissions.
- The app is build-safe when env vars are missing, but database and auth features remain inactive until configured.
