# Test Datasets

This document defines deterministic input datasets for acceptance testing.

These datasets should always produce the same expected outputs.

## Dataset conventions

Each dataset must:

- use stable IDs
- define initial state
- define exact inputs
- define exact expected outputs
- be reusable across backend, frontend, and mobile tests

---

# Dataset: USERS-001

## Users

### Client

```json
{
  "id": "client_001",
  "name": "Juan Perez",
  "role": "client",
  "debtBalance": 0,
  "blockedByDebt": false
}
```

### Contractor

```json
{
  "id": "contractor_001",
  "name": "Carlos Plumbing",
  "role": "contractor",
  "approved": true,
  "available": true,
  "emergencyEnabled": true,
  "averageRating": 4.8
}
```

---

# Dataset: BOOKING-001

## Input

Client requests plumbing service tomorrow at 10:00.

## Expected output

```json
{
  "status": "pending_acceptance",
  "contractorNotified": true,
  "chatCreated": true
}
```

---

# Dataset: EMERGENCY-001

## Input

Client requests emergency plumbing service.

## Expected output

```json
{
  "status": "searching_contractor",
  "notificationsSent": true,
  "emergencyFlowStarted": true
}
```

---

# Dataset: DEBT-001

## Initial state

Client debt limit: 10000
Client current debt: 9500

## Input

New booking creates commission debt of 1000.

## Expected output

```json
{
  "blockedByDebt": true,
  "newDebtBalance": 10500
}
```

---

# Dataset: PAYMENT-PROOF-001

## Input

Client uploads payment proof image.

## Expected output

```json
{
  "status": "pending_review",
  "visibleToAdmin": true
}
```
