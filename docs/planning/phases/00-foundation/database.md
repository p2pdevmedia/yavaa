# Database

## Prisma scope
- Initial core tables: users/profiles/roles/audit scaffold.
- Migration discipline established.
- Seed data for deterministic local/test runs.

## Constraints and integrity
- Use explicit relationships and intentional indexes.
- Preserve auditable history for sensitive actions.
- Keep database as source of truth for durable state.
