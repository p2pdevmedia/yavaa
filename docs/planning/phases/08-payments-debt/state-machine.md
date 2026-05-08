# State Machine — Phase 08 Payments & Debt

## Canonical payment/debt states
### Payment confirmation
- `payment_unconfirmed`
- `payment_reported`
- `payment_verified`
- `payment_rejected`
- `payment_disputed`

### Debt lifecycle
- `debt_clear`
- `debt_open`
- `debt_due`
- `debt_over_limit`
- `debt_blocked`
- `debt_settled`

## Valid transitions
### Payment
- `payment_unconfirmed -> payment_reported`
- `payment_reported -> payment_verified`
- `payment_reported -> payment_rejected`
- `payment_verified -> payment_disputed`
- `payment_rejected -> payment_disputed`

### Debt
- `debt_clear -> debt_open`
- `debt_open -> debt_due`
- `debt_due -> debt_over_limit`
- `debt_over_limit -> debt_blocked`
- `debt_open -> debt_settled`
- `debt_due -> debt_settled`
- `debt_over_limit -> debt_settled`
- `debt_blocked -> debt_settled`

## Rejection causes (must fail server-side)
- Non-authorized actor attempts confirmation/override.
- Missing proof/document where required.
- Amount inconsistency with booking or commission rules.
- Attempt to settle already-settled debt.
- Transition not allowed from current state.
- Concurrency conflict (same payment/debt updated simultaneously).

## Idempotency policy
- Payment confirmation and debt settlement endpoints require `Idempotency-Key`.
- Duplicate key returns same persisted result.
- Duplicate key + payload mismatch returns `409 conflict`.
- Proof uploads deduplicated by content hash + actor + booking.

## Retry policy
- Retry transient failures with exponential backoff.
- Async verifications use queued retries with dead-letter threshold.
- Manual admin resolution required after retry exhaustion.

## Compensation flows
- If payment verification succeeds but debt update fails: transaction rollback (single DB tx) or compensating debt-recalc job.
- If debt-block flag set but notification fails: keep block active and retry notification asynchronously.
- If dispute creation succeeds but attachment indexing fails: dispute remains open with `pending_attachment_processing` flag.

## Operational safeguards
- Ledger-style immutable debt movement records.
- Snapshot + movement model for reconciliation.
- Audit log entries for admin/manual overrides.
