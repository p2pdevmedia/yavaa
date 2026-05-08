# State Machine — Phase 04 Booking Engine

## Canonical booking states
- `draft`
- `searching_contractors`
- `pending_contractor_response`
- `contractor_selected`
- `confirmed`
- `in_progress`
- `completed`
- `cancelled_by_client`
- `cancelled_by_contractor`
- `expired`
- `disputed`

## Valid transitions
- `draft -> searching_contractors`
- `searching_contractors -> pending_contractor_response`
- `pending_contractor_response -> contractor_selected`
- `contractor_selected -> confirmed`
- `confirmed -> in_progress`
- `in_progress -> completed`
- `pending_contractor_response -> expired`
- `confirmed -> cancelled_by_client`
- `confirmed -> cancelled_by_contractor`
- `in_progress -> disputed`
- `completed -> disputed`

## Rejection causes (must fail server-side)
- Invalid transition from current state.
- Actor mismatch (user is not booking participant/admin).
- Contractor suspended or blocked.
- Debt/approval constraints preventing continuation.
- Request expired by policy window (emergency/today/scheduled).
- Concurrency conflict (stale version/event sequence).

## Idempotency policy
- Mutating endpoints require `Idempotency-Key`.
- Same key + same payload returns same result snapshot.
- Same key + different payload returns `409 conflict`.
- Webhook/realtime duplicate events deduplicated by event ID.

## Retry policy
- Client retries only on network/5xx/timeout with backoff + jitter.
- Retry budget per operation (e.g., 3 attempts).
- Do not retry 4xx business-rule failures.
- Server operations must be safe for at-least-once delivery.

## Compensation flows
- If contractor confirmation write succeeds but notification fails: keep state, enqueue async notification retry.
- If selection succeeds but downstream side-effect fails: rollback to previous state or mark `pending_recovery` internal flag.
- If expiration runs during concurrent acceptance: winner determined by optimistic lock/version check; loser request rejected and audited.

## Operational safeguards
- Optimistic locking/version column on booking aggregate.
- Auditable timeline event for every state transition.
- Outbox pattern for side-effects (notifications/realtime) tied to DB commit.
