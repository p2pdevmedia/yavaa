# Test Strategy

Yavaa should use two different testing layers.

---

# Layer 1 — Agent / Developer Scenarios

Location:

`docs/testing/agent-scenarios.md`

Purpose:

- Explain business logic.
- Explain product expectations.
- Explain user-visible behavior.
- Help agents understand edge cases before implementation.

Characteristics:

- Small number of scenarios.
- Human-readable.
- High-level.
- Product-oriented.
- Used before coding.

---

# Layer 2 — Automated Validation Scenarios

Purpose:

- Validate correctness.
- Detect regressions.
- Stress business rules.
- Test edge cases.
- Guarantee deterministic behavior.

Characteristics:

- Large number of scenarios.
- Machine-readable.
- Covers edge cases.
- Covers invalid states.
- Covers concurrency.
- Covers realtime behavior.
- Used continuously.

---

# Main categories of automated tests

## Authentication

Examples:

- valid login
- invalid login
- blocked user
- profile switching
- missing permissions

---

## Bookings

Examples:

- scheduled booking
- unavailable contractor
- double booking
- cancellation
- expired booking
- reschedule
- invalid time

---

## Emergencies

Examples:

- multiple contractors accepting simultaneously
- contractor timeout
- no contractors available
- contractor disconnects during assignment
- contractor becomes unavailable during search

---

## Debt system

Examples:

- debt generation
- debt reduction
- partial payment
- invalid payment proof
- debt limit exceeded
- debt unblock after approval

---

## Chat system

Examples:

- text messages
- image upload
- unread state
- notification delivery
- deleted booking with existing chat
- realtime synchronization

---

## Ratings

Examples:

- valid review
- duplicate review
- review without completed booking
- admin moderation

---

## Disputes

Examples:

- contractor no-show
- client no-show
- work not completed
- pricing dispute
- invalid dispute reopen

---

# Important rule

Every business-critical feature should have:

- happy-path tests
- edge-case tests
- invalid-input tests
- concurrency tests
- permission tests
- realtime tests

---

# Goal

The goal is that any future implementation:

- web
- iOS
- Android
- backend
- realtime systems

must behave consistently for the same known inputs.
