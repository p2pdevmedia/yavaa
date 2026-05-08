# User Action Test Matrix

Every action defined in `docs/product/user-action-map.md` must have tests.

This document maps each user action to required test coverage.

## Test rule

Every action must have at least:

- one happy-path test
- one permission-denied test
- one invalid-state test when applicable

Critical actions must also have:

- concurrency tests
- realtime tests
- audit/log tests

---

# Test ID convention

Use this format:

```txt
ROLE-DOMAIN-NUMBER
```

Examples:

```txt
CLIENT-BOOKING-001
CONTRACTOR-EMERGENCY-001
ADMIN-DEBT-001
SUPPORT-DISPUTE-001
```

---

# Guest actions

| Action | Required tests |
|---|---|
| View landing page | GUEST-PUBLIC-001 |
| Search public categories | GUEST-SEARCH-001 |
| View limited provider info | GUEST-PROVIDER-001 |
| Create account | GUEST-AUTH-001 |
| Log in | GUEST-AUTH-002 |
| Cannot create booking | GUEST-PERMISSION-001 |
| Cannot chat | GUEST-PERMISSION-002 |
| Cannot rate provider | GUEST-PERMISSION-003 |

---

# Client actions

## Search and discovery

| Action | Required tests |
|---|---|
| Search by category | CLIENT-SEARCH-001 |
| Search by location | CLIENT-SEARCH-002 |
| Filter providers | CLIENT-SEARCH-003 |
| View provider profiles | CLIENT-PROVIDER-001 |
| View ratings | CLIENT-RATING-001 |
| View availability | CLIENT-AVAILABILITY-001 |
| View emergency availability | CLIENT-EMERGENCY-001 |

## Booking

| Action | Required tests |
|---|---|
| Create scheduled booking | CLIENT-BOOKING-001 |
| Create emergency request | CLIENT-EMERGENCY-002 |
| Add address | CLIENT-ADDRESS-001 |
| Add description | CLIENT-BOOKING-002 |
| Upload problem photos | CLIENT-BOOKING-003 |
| Cancel booking | CLIENT-BOOKING-004 |
| Request reschedule | CLIENT-BOOKING-005 |
| View booking status | CLIENT-BOOKING-006 |
| View booking history | CLIENT-BOOKING-007 |
| Directly pay contractor outside Yavaa | CLIENT-PAYMENT-001 |
| Dispute contractor payment confirmation | CLIENT-PAYMENT-002 |

## Chat

| Action | Required tests |
|---|---|
| Chat with assigned contractor | CLIENT-CHAT-001 |
| Send text messages | CLIENT-CHAT-002 |
| Send images | CLIENT-CHAT-003 |
| View system messages | CLIENT-CHAT-004 |
| Cannot access unrelated chat | CLIENT-CHAT-005 |

## Completion and ratings

| Action | Required tests |
|---|---|
| Confirm completed work | CLIENT-COMPLETION-001 |
| Report incomplete work | CLIENT-DISPUTE-001 |
| Rate contractor | CLIENT-RATING-002 |
| Leave review comment | CLIENT-RATING-003 |
| Prevent duplicate review | CLIENT-RATING-004 |
| Report contractor no-show | CLIENT-DISPUTE-002 |

## Debt and payments

| Action | Required tests |
|---|---|
| View debt balance | CLIENT-DEBT-001 |
| View debt limit | CLIENT-DEBT-002 |
| Upload payment proof | CLIENT-PAYMENT-PROOF-001 |
| View payment proof status | CLIENT-PAYMENT-PROOF-002 |
| Debt block prevents new booking | CLIENT-DEBT-003 |
| Debt block still allows payment proof | CLIENT-DEBT-004 |

## Profile

| Action | Required tests |
|---|---|
| Edit personal profile | CLIENT-PROFILE-001 |
| Manage addresses | CLIENT-ADDRESS-002 |
| Switch to contractor mode | CLIENT-PROFILE-SWITCH-001 |

---

# Contractor actions

## Profile

| Action | Required tests |
|---|---|
| Create contractor profile | CONTRACTOR-PROFILE-001 |
| Edit contractor profile | CONTRACTOR-PROFILE-002 |
| Upload profile photo | CONTRACTOR-PROFILE-003 |
| Configure service area | CONTRACTOR-PROFILE-004 |
| Submit profile for approval | CONTRACTOR-APPROVAL-001 |
| Cannot receive bookings before approval | CONTRACTOR-APPROVAL-002 |

## Services

| Action | Required tests |
|---|---|
| Create service | CONTRACTOR-SERVICE-001 |
| Edit service | CONTRACTOR-SERVICE-002 |
| Pause service | CONTRACTOR-SERVICE-003 |
| Archive service | CONTRACTOR-SERVICE-004 |
| Set price type | CONTRACTOR-SERVICE-005 |
| Set estimated duration | CONTRACTOR-SERVICE-006 |
| Enable emergency service | CONTRACTOR-EMERGENCY-001 |
| Configure emergency price | CONTRACTOR-EMERGENCY-002 |

## Availability

| Action | Required tests |
|---|---|
| Configure weekly schedule | CONTRACTOR-AVAILABILITY-001 |
| Add blocked time | CONTRACTOR-AVAILABILITY-002 |
| Remove blocked time | CONTRACTOR-AVAILABILITY-003 |
| Pause availability | CONTRACTOR-AVAILABILITY-004 |
| Prevent overlapping blocked time | CONTRACTOR-AVAILABILITY-005 |
| Prevent double booking | CONTRACTOR-AVAILABILITY-006 |

## Bookings

| Action | Required tests |
|---|---|
| View incoming requests | CONTRACTOR-BOOKING-001 |
| Accept scheduled booking | CONTRACTOR-BOOKING-002 |
| Reject scheduled booking | CONTRACTOR-BOOKING-003 |
| Propose reschedule | CONTRACTOR-BOOKING-004 |
| View assigned bookings | CONTRACTOR-BOOKING-005 |
| Mark as on the way | CONTRACTOR-BOOKING-006 |
| Mark as started | CONTRACTOR-BOOKING-007 |
| Mark as completed | CONTRACTOR-BOOKING-008 |
| Confirm direct payment received | CONTRACTOR-PAYMENT-001 |
| Confirm payment amount received | CONTRACTOR-PAYMENT-002 |
| Cannot confirm payment for unrelated booking | CONTRACTOR-PAYMENT-003 |
| Payment confirmation generates commission debt | CONTRACTOR-PAYMENT-004 |
| Report client no-show | CONTRACTOR-DISPUTE-001 |

## Emergencies

| Action | Required tests |
|---|---|
| Receive emergency notification | CONTRACTOR-EMERGENCY-003 |
| Accept emergency request | CONTRACTOR-EMERGENCY-004 |
| Ignore emergency request | CONTRACTOR-EMERGENCY-005 |
| Disable emergency mode | CONTRACTOR-EMERGENCY-006 |
| Only one contractor assigned | CONTRACTOR-EMERGENCY-007 |

## Chat

| Action | Required tests |
|---|---|
| Chat with assigned client | CONTRACTOR-CHAT-001 |
| Send text messages | CONTRACTOR-CHAT-002 |
| Send images | CONTRACTOR-CHAT-003 |
| View system messages | CONTRACTOR-CHAT-004 |
| Cannot access unrelated chat | CONTRACTOR-CHAT-005 |

## Ratings

| Action | Required tests |
|---|---|
| View received ratings | CONTRACTOR-RATING-001 |
| View review history | CONTRACTOR-RATING-002 |
| Reply to review if enabled | CONTRACTOR-RATING-003 |

## Debt and payments

| Action | Required tests |
|---|---|
| View debt balance | CONTRACTOR-DEBT-001 |
| View debt limit | CONTRACTOR-DEBT-002 |
| Upload payment proof | CONTRACTOR-PAYMENT-PROOF-001 |
| View proof review status | CONTRACTOR-PAYMENT-PROOF-002 |
| Debt block prevents accepting jobs | CONTRACTOR-DEBT-003 |
| Debt block allows finishing accepted jobs | CONTRACTOR-DEBT-004 |

## Profile switching

| Action | Required tests |
|---|---|
| Switch to client mode | CONTRACTOR-PROFILE-SWITCH-001 |

---

# Admin actions

## User management

| Action | Required tests |
|---|---|
| View users | ADMIN-USER-001 |
| Search users | ADMIN-USER-002 |
| Edit basic user data | ADMIN-USER-003 |
| Suspend users | ADMIN-USER-004 |
| Reactivate users | ADMIN-USER-005 |
| Assign roles | ADMIN-USER-006 |
| Remove roles | ADMIN-USER-007 |
| View user debt | ADMIN-DEBT-001 |
| View user booking history | ADMIN-BOOKING-001 |

## Contractor management

| Action | Required tests |
|---|---|
| Review contractor applications | ADMIN-CONTRACTOR-001 |
| Approve contractor | ADMIN-CONTRACTOR-002 |
| Reject contractor | ADMIN-CONTRACTOR-003 |
| Suspend contractor | ADMIN-CONTRACTOR-004 |
| Reactivate contractor | ADMIN-CONTRACTOR-005 |
| Edit contractor categories | ADMIN-CONTRACTOR-006 |
| Review provider reputation | ADMIN-CONTRACTOR-007 |

## Category and service management

| Action | Required tests |
|---|---|
| Create categories | ADMIN-CATEGORY-001 |
| Edit categories | ADMIN-CATEGORY-002 |
| Disable categories | ADMIN-CATEGORY-003 |
| Set category rules | ADMIN-CATEGORY-004 |
| Set default commission rules | ADMIN-COMMISSION-001 |

## Booking management

| Action | Required tests |
|---|---|
| View all bookings | ADMIN-BOOKING-002 |
| Filter bookings by status | ADMIN-BOOKING-003 |
| Reassign booking | ADMIN-BOOKING-004 |
| Cancel booking | ADMIN-BOOKING-005 |
| Force status correction | ADMIN-BOOKING-006 |
| View booking timeline | ADMIN-BOOKING-007 |
| View booking chat when needed | ADMIN-CHAT-001 |

## Emergency operations

| Action | Required tests |
|---|---|
| View active emergencies | ADMIN-EMERGENCY-001 |
| Monitor matching status | ADMIN-EMERGENCY-002 |
| Manually assign contractor | ADMIN-EMERGENCY-003 |
| Close unresolved emergency | ADMIN-EMERGENCY-004 |

## Debt and commission management

| Action | Required tests |
|---|---|
| Configure commission rules | ADMIN-COMMISSION-002 |
| View generated debts | ADMIN-DEBT-002 |
| Adjust debt manually | ADMIN-DEBT-003 |
| Cancel incorrect debt | ADMIN-DEBT-004 |
| Set debt limits | ADMIN-DEBT-005 |
| Block users by debt | ADMIN-DEBT-006 |
| Unblock users after payment | ADMIN-DEBT-007 |

## Payment proof validation

| Action | Required tests |
|---|---|
| View payment proofs | ADMIN-PAYMENT-PROOF-001 |
| Approve proof | ADMIN-PAYMENT-PROOF-002 |
| Reject proof | ADMIN-PAYMENT-PROOF-003 |
| Add admin comment | ADMIN-PAYMENT-PROOF-004 |
| Allocate payment to debts | ADMIN-PAYMENT-PROOF-005 |

## Service payment disputes

| Action | Required tests |
|---|---|
| Admin does not validate normal direct service payment | ADMIN-PAYMENT-001 |
| Admin can review service payment only when disputed | ADMIN-PAYMENT-002 |
| Admin can mark payment dispute resolved | ADMIN-PAYMENT-003 |

## Disputes

| Action | Required tests |
|---|---|
| View disputes | ADMIN-DISPUTE-001 |
| Review chat history | ADMIN-DISPUTE-002 |
| Review booking evidence | ADMIN-DISPUTE-003 |
| Decide dispute outcome | ADMIN-DISPUTE-004 |
| Apply penalties | ADMIN-DISPUTE-005 |
| Close dispute | ADMIN-DISPUTE-006 |

## Reviews and moderation

| Action | Required tests |
|---|---|
| Moderate reviews | ADMIN-REVIEW-001 |
| Hide abusive reviews | ADMIN-REVIEW-002 |
| Flag suspicious reviews | ADMIN-REVIEW-003 |
| Track low-quality contractors | ADMIN-REVIEW-004 |

---

# Support actions

| Action | Required tests |
|---|---|
| View users | SUPPORT-USER-001 |
| View bookings | SUPPORT-BOOKING-001 |
| View booking status | SUPPORT-BOOKING-002 |
| View limited chat history | SUPPORT-CHAT-001 |
| Create support notes | SUPPORT-NOTE-001 |
| Help with disputes | SUPPORT-DISPUTE-001 |
| Escalate to admin | SUPPORT-DISPUTE-002 |
| Cannot approve contractors | SUPPORT-PERMISSION-001 |
| Cannot validate payment proofs | SUPPORT-PERMISSION-002 |
| Cannot change debt balances | SUPPORT-PERMISSION-003 |
| Cannot assign roles | SUPPORT-PERMISSION-004 |

---

# Coverage requirement

A feature is not considered complete unless:

1. Its action exists in `user-action-map.md`.
2. Its test ID exists in this matrix.
3. At least one automated test implements the test ID.
4. Permission-denied behavior is tested.
5. Blocked/suspended/debt states are tested when relevant.
