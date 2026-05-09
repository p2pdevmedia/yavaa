# Seeding

## Purpose
The seed workflow creates deterministic baseline data for local development and CI.

## Current seed data
- Standard roles: `client`, `contractor`, `admin`, and `support`.
- Deterministic foundation app users in `public.users`.
- Matching profiles and role assignments for app-level permissions.
- Launch market: San Martin de los Andes, Neuquen, Argentina.
- Initial service categories aligned with the MVP scope.

## Auth provisioning
- New Supabase Auth signups provision the matching `public.users`, `public.profiles`, and `client` role rows through the database trigger.
- Seed data itself does not create Supabase Auth credentials.

## Commands
- `npm run db:seed`

## Rules
- Seeds should stay repeatable.
- Seeds should not depend on random external state.
- Seeded fixtures should be safe to recreate.
