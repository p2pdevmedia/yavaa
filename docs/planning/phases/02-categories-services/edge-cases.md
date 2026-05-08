# Edge Cases

## High-risk scenarios
- Category removed while service is active.
- Emergency pricing without base price.
- Portfolio attachment fails partially.

## Mitigation
- Validate state transitions on server.
- Reject stale or conflicting updates.
- Emit auditable events for sensitive overrides.
