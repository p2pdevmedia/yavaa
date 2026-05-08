# Development Phases

Yavaa is built in independent phases that later connect together.

The goal is:

- avoid chaos
- reduce coupling
- make testing easier
- allow multiple developers and agents to work in parallel
- allow future scalability

---

# Engineering philosophy

The recommended order is:

```txt
Data
↓
Permissions
↓
Business rules
↓
Tests
↓
UI
↓
Realtime
↓
Mobile
↓
AI/Agent orchestration
```

Do not overbuild realtime, AI, or mobile too early.

The first priority is always:

- correct data
- correct permissions
- deterministic tests
- reliable business rules

---

# Recommended phase order

1. foundation
2. identity and profiles
3. categories and services
4. availability
5. bookings
6. matching
7. realtime
8. chat
9. payments and debt
10. ratings and reputation
11. admin
12. agent layer
13. native apps
14. scaling

---

# Recommended structure

```txt
docs/planning/phases/

00-foundation/
01-identity-profiles/
02-categories-services/
03-availability/
04-bookings/
05-matching/
06-realtime/
07-chat/
08-payments-debt/
09-ratings-reputation/
10-admin/
11-agent-layer/
12-native-apps/
13-scaling/
```

---

# Recommended files inside every phase

Each phase should eventually contain:

```txt
README.md
goals.md
deliverables.md
database.md
api.md
tests.md
playwright.md
edge-cases.md
checklist.md
```

---

# What each file means

## README.md

High-level overview of the phase.

---

## goals.md

Defines:

- what problems the phase solves
- why the phase exists
- expected product outcomes

---

## deliverables.md

Defines:

- what must exist
- what features are included
- what functionality is expected

The phase is not complete without all deliverables.

---

## database.md

Defines:

- Prisma models
- database relationships
- constraints
- indexes
- migrations
- audit requirements

---

## api.md

Defines:

- API endpoints
- OpenAPI contracts
- request schemas
- response schemas
- permission requirements
- realtime events if applicable

---

## tests.md

Defines:

- unit tests
- integration tests
- permission tests
- deterministic test datasets

All important business rules must have tests.

---

## playwright.md

Defines:

- end-to-end scenarios
- black-box acceptance tests
- critical user flows
- realtime interaction tests

Playwright is mandatory.

---

## edge-cases.md

Defines dangerous or complex situations.

Examples:

- double booking
- contractor suspended during booking
- expired emergency requests
- realtime race conditions
- debt limit reached
- duplicate payment confirmations
- timezone problems

---

## checklist.md

Defines implementation checklists.

Example:

```txt
[ ] contractor can create service
[ ] contractor can pause service
[ ] category approval works
[ ] tests pass
[ ] OpenAPI updated
[ ] Playwright tests pass
```

---

# Important project rules

## OpenAPI is mandatory

Yavaa must be API-first.

The web app, mobile apps, Playwright tests, and future AI agents should use the same product contract.

---

## Playwright is mandatory

All critical user flows must have end-to-end Playwright coverage.

---

## Database is the source of truth

Realtime systems, chats, notifications, and agents do not replace durable database state.

---

## Permissions must exist in backend

Never trust only frontend permissions.

All critical actions must validate:

- user role
- ownership
- booking relationship
- debt status
- suspension state

---

## Every important action requires tests

Every important action should eventually map to:

- permission tests
- invalid-state tests
- edge-case tests
- Playwright tests

---

# Long-term vision

Yavaa should become:

- a service marketplace
- a realtime coordination platform
- an agent-friendly platform
- a trusted service network
- infrastructure for human and AI collaboration
