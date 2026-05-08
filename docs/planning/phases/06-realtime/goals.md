# Goals

## Phase
Realtime Infrastructure

## Product goals
- Add realtime notifications on top of durable DB state.
- Keep consistency between subscriptions and persisted state.
- Prevent race-induced UI inconsistencies.

## Non-goals
- Avoid premature over-engineering.
- Avoid hidden state and non-deterministic flows.
- Avoid bypassing server-side permissions.
