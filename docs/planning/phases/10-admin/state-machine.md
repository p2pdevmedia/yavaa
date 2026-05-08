# State Machine — Phase 10 Admin System

## Canonical admin case states
### Moderation case
- `case_open`
- `case_in_review`
- `case_action_required`
- `case_resolved`
- `case_appealed`
- `case_closed`

### Dispute handling
- `dispute_open`
- `dispute_investigating`
- `dispute_decided`
- `dispute_escalated`
- `dispute_closed`

## Valid transitions
### Moderation
- `case_open -> case_in_review`
- `case_in_review -> case_action_required`
- `case_action_required -> case_resolved`
- `case_resolved -> case_appealed`
- `case_appealed -> case_in_review`
- `case_resolved -> case_closed`

### Disputes
- `dispute_open -> dispute_investigating`
- `dispute_investigating -> dispute_decided`
- `dispute_decided -> dispute_escalated`
- `dispute_escalated -> dispute_decided`
- `dispute_decided -> dispute_closed`

## Rejection causes (must fail server-side)
- Admin actor lacks required permission scope.
- Required evidence or note missing for transition.
- Attempt to close while dependent actions remain pending.
- Transition invalid for current state.
- Concurrent admin updates with stale version.

## Idempotency policy
- Admin mutation actions accept `Idempotency-Key`.
- Repeated request with same key returns same action result.
- Payload mismatch with same key returns `409 conflict`.
- Manual override actions always emit unique audit event IDs.

## Retry policy
- Background admin automations (alerts/escalations) retried via queue.
- UI retries only for transient errors; business-rule failures require user correction.
- Escalation tasks have max retry budget and alert on failure.

## Compensation flows
- If enforcement action succeeds but external notification fails: preserve action, retry notification asynchronously.
- If partial bulk moderation fails: commit successful subset and create recovery job for failed items.
- If dispute decision published but downstream index update fails: mark `pending_sync` and reprocess.

## Operational safeguards
- Mandatory reason code + comment for sensitive admin overrides.
- Audit trail with actor, timestamp, before/after state.
- Dual-control policy option for high-risk actions (e.g., unblocking disputed debt).
