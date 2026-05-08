# Yavaa — Recommended Development Phases

This document defines the recommended implementation order for Yavaa.

The sequence follows the project philosophy:

```txt
Data
Permissions
Business rules
Tests
UI
Realtime
Mobile
AI orchestration
```

---

## Phase 00 — Foundation / Infrastructure

### Goal
Build the technical foundation before product features.

### Includes
- Next.js
- Supabase
- Prisma
- Auth
- OpenAPI
- Playwright
- CI/CD
- Tailwind
- shadcn/ui
- logging
- audit base
- seed system
- monorepo structure

### Result
Stable project foundation ready to scale.

---

## Phase 01 — Identity & Profiles

### Goal
Allow real users and contractors to exist.

### Includes
- signup/login
- roles
- profile switching
- contractor onboarding
- DNI uploads
- contractor approval
- contractor public profiles
- blocked/suspended users

### Result
Real users and contractors working correctly.

---

## Phase 02 — Categories & Services

### Goal
Allow contractors to offer services.

### Includes
- categories
- category proposals
- admin approval
- services CRUD
- pricing types
- emergency pricing
- portfolios
- contractor offerings

### Result
Searchable service marketplace.

---

## Phase 03 — Availability System

### Goal
Build a reliable scheduling engine.

### Includes
- weekly schedules
- blocked times
- emergency availability
- overlap prevention
- timezone handling
- slot validation

### Result
Reliable availability system.

---

## Phase 04 — Booking Engine

### Goal
Enable real work requests and bookings.

### Includes
- emergency now
- today
- scheduled bookings
- booking states
- booking timelines
- cancellations
- reschedules
- expirations

### Result
Operational booking lifecycle.

---

## Phase 05 — Matching Engine

### Goal
Find compatible contractors.

### Includes
- category matching
- location filtering
- urgency filtering
- availability filtering
- retry logic
- contractor targeting

### Result
Smart contractor matching.

---

## Phase 06 — Realtime Infrastructure

### Goal
Make Yavaa feel live and reactive.

### Includes
- Supabase Realtime
- realtime bookings
- realtime notifications
- realtime contractor responses
- realtime event subscriptions

### Result
Realtime user experience.

---

## Phase 07 — Internal Chat

### Goal
Provide controlled communication.

### Includes
- booking chats
- image attachments
- unread states
- moderation hooks
- attachment handling

### Result
Reliable communication inside Yavaa.

---

## Phase 08 — Payments & Debt

### Goal
Implement the financial model.

### Includes
- contractor payment confirmation
- debt engine
- commission rules
- payment proofs
- debt limits
- debt blocking
- disputes

### Result
Operational commission and debt system.

---

## Phase 09 — Ratings & Reputation

### Goal
Build trust and quality signals.

### Includes
- reviews
- ratings
- no-show tracking
- contractor reputation
- moderation
- reputation metrics

### Result
Reliable reputation system.

---

## Phase 10 — Admin System

### Goal
Create operational control tools.

### Includes
- dashboards
- moderation
- disputes
- debt management
- approvals
- emergency monitoring
- audit logs

### Result
Production-ready admin operations.

---

## Phase 11 — Agent Layer

### Goal
Prepare Yavaa for AI agents.

### Includes
- OpenAPI stabilization
- structured responses
- orchestration workflows
- agent-safe confirmations
- automation flows

### Result
Yavaa becomes agent-friendly.

---

## Phase 12 — Native Apps

### iOS
- SwiftUI

### Android
- Kotlin + Jetpack Compose

### Includes
- push notifications
- realtime sync
- authentication
- contractor/client modes

### Result
Complete mobile ecosystem.

---

## Phase 13 — Scaling & Expansion

### Goal
Expand across cities and countries.

### Includes
- multiple cities
- multiple countries
- analytics
- fraud detection
- advanced ranking
- deliveries
- subscriptions
- video calls
- advanced agent orchestration

### Result
Scalable regional platform.
