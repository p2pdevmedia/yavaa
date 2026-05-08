# Payment Flow

Yavaa does not collect the full service payment in the MVP.

The client pays the contractor directly.

The contractor must confirm inside Yavaa that the payment was received.

The admin does not validate the direct client-to-contractor service payment.

Admin only intervenes if there is a conflict, dispute, fraud report, or manual review need.

---

# Main flow

1. Client books or requests a service.
2. Contractor accepts the job.
3. Contractor performs the job.
4. Client pays contractor directly outside Yavaa.
5. Contractor marks payment as received in Yavaa.
6. Booking can move toward completed state.
7. Yavaa generates or confirms the platform commission debt.
8. The responsible user pays the commission later.
9. User uploads payment proof for the commission.
10. Commission payment proof follows its own review process.

---

# Contractor payment confirmation

The contractor must explicitly confirm:

- payment received
- amount received
- payment method if known
- optional note
- date/time of confirmation

This action should be stored as part of the booking timeline.

This confirmation is enough to mark the direct service payment as received unless the client opens a dispute.

---

# Admin role

Admin does not approve normal direct service payments.

Admin enters only when:

- client disputes contractor payment confirmation
- contractor claims payment was not received
- client claims service was not completed
- suspicious behavior is detected
- a manual support case is opened

---

# Agent automation

A user-authorized agent may automate booking and payment-related actions.

If the agent is authorized to pay or coordinate payment, Yavaa can allow the process to be mostly automatic.

However, the contractor confirmation remains required.

The booking should not be considered financially confirmed until the contractor marks payment as received.

---

# Booking payment states

Recommended states:

- unpaid
- payment_pending_confirmation
- paid_confirmed_by_contractor
- payment_disputed

---

# Important rule

The database is the source of truth.

Chat messages, agent actions, or external payment screenshots are not enough by themselves.

The contractor payment confirmation is the key event that marks the direct service payment as received.

---

# Commission debt

After contractor payment confirmation, Yavaa can generate the platform commission debt according to the configured commission rule.

The debt can belong to:

- client
- contractor
- both

depending on admin configuration.

Commission debt payment is separate from the direct service payment.
