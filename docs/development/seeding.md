# Seeding

## Purpose
The seed workflow creates deterministic baseline data for local development and CI.

## Current seed data
- Standard roles: `client`, `contractor`, `admin`, and `support`.
- A deterministic foundation admin user.
- A matching profile and admin role assignment.

## Commands
- `npm run db:seed`

## Rules
- Seeds should stay repeatable.
- Seeds should not depend on random external state.
- Seeded fixtures should be safe to recreate.
