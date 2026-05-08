# Edge Cases

## High-risk scenarios
- Duplicate DNI submissions.
- Switching profile during pending approval.
- User suspended mid-session.

## Mitigation
- Validate state transitions on server.
- Reject stale or conflicting updates.
- Emit auditable events for sensitive overrides.
