# Yavaa

Yavaa is now reduced to the approved minimum auth surface:

- home
- login
- registration
- forgot password
- reset password
- protected profile selection after login
- user, profile, and per-user roles

## Current Scope

The active roles are:

- `jefe`
- `trabajador`

The active database tables are:

- `users`
- `profiles`
- `roles`
- `user_roles`

Marketplace, bookings, emergencies, providers, chat, files, notifications, admin operations, Android, and iPhone have been removed from the active codebase.

## Development

1. Install dependencies with `npm install`.
2. Generate the Prisma client with `npm run db:generate`.
3. Apply migrations with `npm run db:migrate` or `npm run db:deploy`.
4. Seed deterministic baseline data with `npm run db:seed`.
5. Start the app with `npm run dev`.

## Routes

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
