# Contractor Agent Scenarios

These scenarios explain how contractor functionality should behave.

They are intended for developers and agents before implementation.

---

# Contractor mental model

A contractor is a provider who can:

- create and edit a public profile
- configure services
- configure availability
- accept scheduled jobs
- accept emergency jobs
- chat with clients
- complete jobs
- receive ratings
- manage debt

Contractors must be approved before they can receive real bookings.

---

# Scenario C-001 — Contractor onboarding pending approval

## Initial state

- User has an account.
- User wants to become a contractor.

## Input

User creates contractor profile with name, phone, service categories, work zone, and description.

## Expected behavior

- Contractor profile is created.
- Contractor status is `pending_approval`.
- Contractor cannot receive bookings yet.
- Admin can review the profile.

---

# Scenario C-002 — Approved contractor becomes searchable

## Initial state

- Contractor profile exists.
- Contractor status is `pending_approval`.

## Input

Admin approves contractor.

## Expected behavior

- Contractor status becomes `approved`.
- Contractor can configure services.
- Contractor can configure availability.
- Contractor can appear in search only if active and available.

---

# Scenario C-003 — Contractor creates service

## Initial state

- Contractor is approved.

## Input

Contractor creates plumbing service with title, category, description, price type, and estimated duration.

## Expected behavior

- Service is created.
- Service status is `active` by default or according to product setting.
- Service can be found by clients if contractor is active and available.

---

# Scenario C-004 — Contractor configures weekly availability

## Initial state

- Contractor is approved.
- Contractor has at least one active service.

## Input

Contractor sets availability Monday to Friday from 09:00 to 17:00.

## Expected behavior

- Availability rules are saved.
- Client search can use these rules.
- Contractor can receive scheduled bookings inside those time ranges.

---

# Scenario C-005 — Contractor blocks time

## Initial state

- Contractor is available Monday 09:00 to 17:00.

## Input

Contractor blocks next Monday from 10:00 to 12:00.

## Expected behavior

- That time range becomes unavailable.
- Clients cannot book the contractor in that blocked range.
- Other available times remain bookable.

---

# Scenario C-006 — Contractor accepts scheduled booking

## Initial state

- Contractor is approved.
- Contractor has an active service.
- Client created booking request.

## Input

Contractor accepts booking.

## Expected behavior

- Booking status becomes `accepted` or `scheduled`.
- Client is notified.
- Chat remains active.
- Contractor schedule is reserved for that time.

---

# Scenario C-007 — Contractor rejects scheduled booking

## Initial state

- Contractor received booking request.

## Input

Contractor rejects booking.

## Expected behavior

- Booking status becomes `rejected_by_contractor` or returns to matching state.
- Client is notified.
- Contractor is not assigned.
- System may suggest other contractors.

---

# Scenario C-008 — Contractor enables emergencies

## Initial state

- Contractor is approved.
- Contractor has active service category.

## Input

Contractor enables emergency mode with emergency price and active emergency hours.

## Expected behavior

- Contractor can receive emergency requests.
- Emergency price is visible or used in the quote.
- Contractor only receives compatible emergency requests.

---

# Scenario C-009 — Contractor accepts emergency request

## Initial state

- Emergency request is searching for contractor.
- Contractor is compatible and notified.

## Input

Contractor accepts emergency request.

## Expected behavior

- Contractor is assigned if request is still open.
- Booking status becomes `accepted` or `emergency_accepted`.
- Other contractors can no longer accept that request.
- Client is notified.

---

# Scenario C-010 — Contractor completes job

## Initial state

- Booking is accepted.
- Contractor performed the job.

## Input

Contractor marks job as completed.

## Expected behavior

- Booking status becomes `completed_by_contractor`.
- Client is asked to confirm and rate.
- Commission debt may be generated depending on commission rules.

---

# Scenario C-011 — Contractor debt blocks accepting new jobs

## Initial state

- Contractor debt limit is 10000.
- Contractor current debt is 12000.

## Input

Contractor tries to accept a new booking.

## Expected behavior

- Acceptance is rejected.
- Contractor sees debt warning.
- Contractor can still access app.
- Contractor can still upload payment proof.
- Contractor can still finish already accepted jobs.

---

# Scenario C-012 — Contractor receives rating

## Initial state

- Booking is completed.
- Client has not reviewed yet.

## Input

Client leaves 5-star rating and comment.

## Expected behavior

- Review is saved.
- Contractor average rating is recalculated.
- Review appears in contractor profile if moderation rules allow it.
