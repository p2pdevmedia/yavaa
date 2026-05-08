# Agent Implementation Scenarios

This file contains a small but representative set of scenarios that agents and developers must understand before implementing features.

These are not exhaustive tests. They are product-design scenarios.

The goal is to force the implementation to support the right mental model.

---

# Scenario 1 — Simple scheduled service

## Initial state

- Client has no debt.
- Contractor is approved.
- Contractor offers plumbing.
- Contractor is available tomorrow at 10:00.

## Input

Client requests a plumbing service for tomorrow at 10:00.

## Expected behavior

- Booking is created.
- Booking status is `pending_acceptance`.
- Contractor receives notification.
- Chat thread is created.
- Client can see booking status.

---

# Scenario 2 — Emergency request

## Initial state

- Client has no debt.
- Three approved contractors offer plumbing emergencies.
- Two are available.
- One is unavailable.

## Input

Client requests emergency plumbing service now.

## Expected behavior

- System starts emergency matching.
- Only available compatible contractors are notified.
- Booking remains in `searching_contractor` until one accepts.
- First contractor to accept gets assigned.
- Other contractors stop receiving actionable acceptance options.

---

# Scenario 3 — Debt limit blocks new booking

## Initial state

- Client debt limit is 10000.
- Client current debt is 10500.

## Input

Client tries to create a new booking.

## Expected behavior

- Booking is rejected.
- User is informed that debt must be resolved first.
- User can still access the app.
- User can still upload payment proof.
- User can still chat in existing active bookings.

---

# Scenario 4 — Payment proof validation

## Initial state

- Client has pending debt.
- Client uploads payment proof.

## Input

Admin approves the payment proof.

## Expected behavior

- Payment proof status becomes `approved`.
- Debt balance is reduced.
- If debt balance is below limit, user is unblocked.

---

# Scenario 5 — Internal chat as source of truth

## Initial state

- Booking exists.
- Client and contractor are assigned.

## Input

Client sends a message and a photo.

## Expected behavior

- Message is saved in booking chat.
- Contractor receives notification.
- Admin can review chat if dispute is opened.

---

# Scenario 6 — Contractor no-show

## Initial state

- Booking is accepted.
- Scheduled time passed.
- Contractor did not mark arrival or start.

## Input

Client reports contractor no-show.

## Expected behavior

- Booking enters `reported_no_show` or `dispute` state.
- Admin is notified.
- Contractor reputation can be affected after review.

---

# Scenario 7 — One app with profile switching

## Initial state

- User has both client and contractor roles.

## Input

User switches from client mode to contractor mode.

## Expected behavior

- Navigation changes.
- Dashboard changes.
- Available actions change.
- User identity remains the same.
- Permissions are enforced by role, not only by UI.
