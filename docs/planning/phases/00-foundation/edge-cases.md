# Edge Cases

## High-risk scenarios
- Missing env vars at boot.
- Drift between Prisma schema and DB.
- Failed migration rollback path.

## Mitigation
- Validate state transitions on server.
- Reject stale or conflicting updates.
- Emit auditable events for sensitive overrides.
