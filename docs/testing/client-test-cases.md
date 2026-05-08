# Client Test Cases

## CLT-001

Feature: category search

Expected:

```json
{
  "onlyApprovedProvidersVisible": true
}
```

---

## CLT-002

Feature: scheduled booking

Expected:

```json
{
  "status": "pending_acceptance",
  "chatCreated": true
}
```

---

## CLT-003

Feature: emergency booking

Expected:

```json
{
  "status": "searching_contractor"
}
```

---

## CLT-004

Feature: debt block

Expected:

```json
{
  "canCreateBooking": false
}
```

---

## CLT-005

Feature: payment proof upload

Expected:

```json
{
  "status": "pending_review"
}
```

---

## CLT-006

Feature: duplicate review prevention

Expected:

```json
{
  "canReviewTwice": false
}
```

---

## CLT-007

Feature: no-show report

Expected:

```json
{
  "adminNotified": true
}
```
