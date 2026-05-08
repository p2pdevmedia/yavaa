# Contractor Test Cases

## CT-001

Feature: contractor onboarding

Expected:

```json
{
  "status": "pending_approval"
}
```

---

## CT-002

Feature: contractor approval

Expected:

```json
{
  "status": "approved",
  "visibleInSearch": true
}
```

---

## CT-003

Feature: emergency acceptance

Expected:

```json
{
  "onlyOneAssigned": true
}
```

---

## CT-004

Feature: debt blocking

Expected:

```json
{
  "canAcceptBookings": false
}
```

---

## CT-005

Feature: rating update

Expected:

```json
{
  "averageRatingUpdated": true
}
```
