# Client Agent Scenarios

These scenarios explain how client functionality should behave.

They are intended for developers and agents before implementation.

---

# Client mental model

A client is a user who needs help from a trusted provider.

A client can:

- search providers
- request scheduled services
- request emergency services
- chat with assigned contractors
- upload images or context
- cancel or reschedule bookings
- confirm completed work
- rate contractors
- manage commission debt if applicable
- upload payment proofs

The client experience must remain simple and fast.

---

# Scenario CL-001 — Client searches by category

## Initial state

- Client is logged in.
- There are approved contractors in the selected category.

## Input

Client searches for plumbing services.

## Expected behavior

- System returns approved and active contractors.
- Suspended contractors are not shown.
- Contractors outside the coverage area are not shown.
- Results can include rating, availability, service summary, and emergency support.

---

# Scenario CL-002 — Client creates scheduled booking

## Initial state

- Client has no debt block.
- Contractor is approved and available.
- Contractor offers the requested service.

## Input

Client selects contractor, service, date, time, address, and description.

## Expected behavior

- Booking is created.
- Booking status becomes `pending_acceptance`.
- Contractor is notified.
- Chat thread is created.
- Client can see booking in active bookings.

---

# Scenario CL-003 — Client creates emergency request

## Initial state

- Client has no debt block.
- At least one compatible contractor accepts emergencies.

## Input

Client requests emergency help now.

## Expected behavior

- Emergency flow starts.
- Compatible contractors are notified.
- Booking status becomes `searching_contractor`.
- Client sees waiting state.
- First contractor to accept is assigned.

---

# Scenario CL-004 — Client blocked by debt

## Initial state

- Client debt limit is 10000.
- Client current debt is 12000.

## Input

Client tries to create a new booking.

## Expected behavior

- Booking creation is rejected.
- Client sees debt warning.
- Client can still access app.
- Client can still upload payment proof.
- Client can still chat in existing active bookings.

---

# Scenario CL-005 — Client sends chat message

## Initial state

- Booking exists.
- Contractor is assigned.
- Chat thread exists.

## Input

Client sends text and photo.

## Expected behavior

- Message is saved.
- Contractor is notified.
- Message is visible in booking chat.
- Admin can review chat only when needed for moderation or dispute.

---

# Scenario CL-006 — Client confirms completed work

## Initial state

- Contractor marked booking as completed.

## Input

Client confirms completion.

## Expected behavior

- Booking status becomes `completed` or `confirmed_completed`.
- Rating prompt is shown.
- Commission debt is generated if applicable.

---

# Scenario CL-007 — Client leaves review

## Initial state

- Booking is completed.
- Client has not reviewed it yet.

## Input

Client leaves 5-star rating and comment.

## Expected behavior

- Review is saved.
- Contractor average rating is updated.
- Client cannot review same booking twice.

---

# Scenario CL-008 — Client cancels before contractor accepts

## Initial state

- Booking is pending acceptance.

## Input

Client cancels booking.

## Expected behavior

- Booking status becomes `cancelled_by_client`.
- Contractor is notified if already notified.
- No penalty is applied by default.

---

# Scenario CL-009 — Client reports contractor no-show

## Initial state

- Booking is accepted.
- Scheduled time passed.
- Contractor did not start the job.

## Input

Client reports no-show.

## Expected behavior

- Booking enters dispute or reported no-show state.
- Admin is notified.
- Contractor may be reviewed by admin.

---

# Scenario CL-010 — Client uploads payment proof

## Initial state

- Client has pending commission debt.

## Input

Client uploads payment proof.

## Expected behavior

- Payment proof status becomes `pending_review`.
- Admin can review it.
- Debt is not reduced until admin approval.

---

# Scenario CL-011 — Client switches to contractor mode

## Initial state

- User has client and contractor roles.

## Input

User switches profile mode.

## Expected behavior

- Client navigation disappears.
- Contractor navigation appears.
- User identity remains the same.
- Permissions are enforced by backend.
