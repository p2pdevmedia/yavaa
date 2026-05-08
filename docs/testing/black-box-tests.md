# Black-box Tests

This document defines black-box acceptance tests for Yavaa.

The goal is to describe expected behavior using known inputs and expected outputs, before implementation starts.

These tests must be independent from the internal code structure.

## Testing philosophy

A feature is valid only if, given a known input state, it produces the expected output state.

Tests should focus on user-visible behavior and business rules.

## Main domains to test

- User roles and profile switching
- Provider search
- Booking creation
- Scheduled bookings
- Emergency bookings
- Contractor availability
- Chat access
- Ratings
- Commission debt
- Debt blocking
- Payment proof upload
- Admin validation
- Cancellations
- No-show reports
- Disputes

## Test format

Each test should include:

- ID
- Feature
- Initial state
- Input
- Expected output
- Expected status
- Notes

Example:

```txt
ID: BOOKING-001
Feature: Scheduled booking
Initial state: Client has no debt, contractor is approved and available
Input: Client requests plumbing service tomorrow at 10:00
Expected output: Booking is created with status pending_acceptance
Expected status: true
```

## Required result convention

For automated tests, each scenario should return:

```json
{
  "ok": true,
  "scenarioId": "BOOKING-001",
  "actual": {},
  "expected": {}
}
```

When a scenario fails:

```json
{
  "ok": false,
  "scenarioId": "BOOKING-001",
  "reason": "Booking status was created instead of pending_acceptance",
  "actual": {},
  "expected": {}
}
```
