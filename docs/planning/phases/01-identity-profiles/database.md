# Database

## Prisma scope
- User, profile, role membership, contractor application models.
- Approval status history and suspension flags.
- Audit entries for role/approval changes.

## Constraints and integrity
- Use explicit relationships and intentional indexes.
- Preserve auditable history for sensitive actions.
- Keep database as source of truth for durable state.
