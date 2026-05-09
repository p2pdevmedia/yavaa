# Recommended Tech Stack

This document defines the recommended technologies for Yavaa.

The goal is to keep the first version simple, reliable, and scalable enough to grow.

---

# Core decisions

## Web

- Next.js
- TypeScript
- Tailwind CSS
- App Router

## Database

- Supabase Postgres
- Prisma ORM

Supabase will provide the PostgreSQL database.

Prisma will be used as the main ORM and schema/migration layer for the application code.

## Authentication

- Supabase Auth

Required auth features:

- email login
- phone verification eventually
- role-based access
- active profile mode
- admin protection
- blocked user handling

## Realtime

- Supabase Realtime

Realtime is important for:

- chat
- emergency requests
- booking status updates
- contractor acceptance
- notifications inside the app

Supabase Realtime should be used for realtime database-driven events.

Important rule:

The database remains the source of truth. Realtime events notify clients, but durable state must always be saved in Postgres.

## File storage

Primary decision:

- Vercel Blob for uploaded images and files

Use cases:

- user profile photos
- contractor portfolio images
- booking problem photos
- chat attachments
- payment proof uploads
- review evidence

Alternative later:

- Supabase Storage

For now, keep Vercel Blob as the selected storage layer unless the project decides to consolidate everything inside Supabase.

---

# Mandatory architecture decisions

## OpenAPI is mandatory

Yavaa must expose and maintain an OpenAPI contract.

Reason:

- web, iOS, and Android must consume the same API contract
- agents and developers need a stable source of truth
- tests can validate API behavior against the same contract
- future integrations become easier

The OpenAPI spec should be treated as part of the product contract.

## Playwright is mandatory

Yavaa must use Playwright for end-to-end and black-box acceptance testing.

Playwright tests should cover:

- client booking flows
- contractor flows
- admin flows
- role switching
- debt blocking
- emergency matching
- payment proof upload
- chat visibility and permissions

Playwright tests must follow the user action test matrix.

---

# Recommended additions

## Notifications

Required notification types:

- new booking request
- emergency request
- contractor accepted
- chat message
- booking status changed
- payment proof approved or rejected
- debt limit warning

Recommended technologies:

- Firebase Cloud Messaging for Android
- APNs for iOS
- Web Push for browser notifications
- Email provider for fallback notifications

For email:

- Resend
- Postmark
- SendGrid

Recommended for MVP: Resend.

For Supabase Auth specifically, configure custom SMTP so transactional emails send from a `@yavaa.lat` address, such as `no-reply@yavaa.lat`.

---

## Payments and commission debt

Yavaa will not collect the full service payment in the MVP.

The client pays the contractor directly.

Yavaa tracks commission debt internally.

Needed systems:

- CommissionRule
- CommissionDebt
- PaymentProof
- PaymentProofDebtAllocation
- Admin validation flow

Payment proof files should be stored in Vercel Blob.

---

## Maps and location

Needed for:

- client address
- contractor service area
- distance filtering
- future delivery flows
- future emergency matching

Recommended options:

- Google Maps Platform
- Mapbox
- OpenStreetMap with Nominatim / MapLibre

For MVP, use simple city/zone filtering first.

Do not overbuild live tracking in the first version.

---

## Video calls

Needed later for:

- psychologists
- consultants
- teachers
- remote professionals

Recommended options:

- Daily.co
- LiveKit
- Twilio Video
- WebRTC custom implementation later if needed

For MVP, do not implement video calls unless the first vertical requires it.

---

## Admin panel

Admin should be web-only.

Recommended stack:

- Next.js protected routes
- Supabase Auth
- Prisma
- Tailwind
- shadcn/ui
- TanStack Table

Admin features:

- user management
- contractor approval
- booking management
- emergency monitoring
- payment proof validation
- debt management
- dispute resolution

---

## UI components

Recommended:

- Tailwind CSS
- shadcn/ui
- lucide-react icons
- TanStack Table
- React Hook Form
- Zod

Why:

- fast development
- consistent UI
- good forms
- strong validation

---

## Forms and validation

Recommended:

- React Hook Form
- Zod

Validation should exist in both:

- frontend forms
- backend actions/API routes

Never trust only frontend validation.

---

## State and data fetching

Recommended:

- TanStack Query for server state
- Zustand for small local UI state

Use cases:

- active profile mode
- temporary UI filters
- modal state
- cached server data

---

## Testing

Mandatory:

- Playwright for end-to-end and black-box acceptance tests
- OpenAPI contract validation

Recommended:

- Vitest for unit tests
- Testing Library for component tests
- Prisma seed scripts for deterministic test data

Testing must follow:

- docs/testing/user-action-test-matrix.md
- docs/testing/agent-scenarios.md
- docs/testing/client-agent-scenarios.md
- docs/testing/contractor-agent-scenarios.md

---

## Observability

Recommended:

- Sentry for errors
- Vercel Analytics for basic analytics
- structured logs for backend actions

Important events to log:

- booking created
- emergency started
- contractor accepted
- debt generated
- payment proof approved/rejected
- dispute opened
- admin action performed

---

## Audit logs

Yavaa needs audit logs for sensitive actions.

Audit required for:

- admin role changes
- contractor approval/rejection
- debt changes
- payment proof validation
- booking status override
- dispute decision

Use a database table such as AuditLog.

---

## Mobile apps

### iOS

- SwiftUI
- native push notifications
- shared API client generated from OpenAPI if possible
- Supabase Auth session integration

### Android

- Kotlin
- Jetpack Compose
- Firebase Cloud Messaging
- shared API client generated from OpenAPI if possible
- Supabase Auth session integration

---

# Recommended MVP stack summary

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Postgres
- Supabase Auth
- Supabase Realtime
- Prisma
- Vercel Blob
- Resend
- Zod
- React Hook Form
- TanStack Query
- TanStack Table
- Vitest
- Playwright
- OpenAPI
- Sentry
- Vercel Analytics

---

# Recommendation

Start with this stack:

- Next.js web app first
- Supabase Postgres
- Prisma
- Supabase Auth
- Supabase Realtime
- Vercel Blob
- Resend for email
- OpenAPI as the API contract
- Playwright for acceptance tests

Native mobile apps should come after the core web experience is validated.
