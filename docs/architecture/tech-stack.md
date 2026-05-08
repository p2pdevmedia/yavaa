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

- PostgreSQL
- Prisma ORM

## File storage

- Vercel Blob for uploaded images and files

Use cases:

- user profile photos
- contractor portfolio images
- booking problem photos
- chat attachments
- payment proof uploads
- review evidence

---

# Recommended additions

## Authentication

Recommended options:

1. Clerk
2. Auth.js
3. Supabase Auth
4. Custom JWT auth

For the MVP, Clerk is the fastest option.

If the project needs full control and lower long-term dependency, use Auth.js or custom JWT.

Required auth features:

- email login
- phone verification eventually
- role-based access
- active profile mode
- admin protection
- blocked user handling

---

## Realtime

Realtime is important for:

- chat
- emergency requests
- booking status updates
- contractor acceptance
- notifications

Recommended options:

1. Pusher
2. Ably
3. Supabase Realtime
4. Socket.IO with a dedicated server

For the MVP, Pusher or Ably is recommended because they are simple and reliable.

Avoid depending only on serverless functions for persistent WebSocket connections.

---

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

Recommended:

- Vitest for unit tests
- Playwright for end-to-end tests
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

### Android

- Kotlin
- Jetpack Compose
- Firebase Cloud Messaging
- shared API client generated from OpenAPI if possible

---

## API documentation

Recommended:

- OpenAPI spec

Benefits:

- web, iOS, and Android consume the same contract
- easier testing
- easier agent implementation
- easier future integrations

---

# Recommended MVP stack summary

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- Vercel Blob
- Clerk or Auth.js
- Pusher or Ably
- Resend
- Zod
- React Hook Form
- TanStack Query
- TanStack Table
- Vitest
- Playwright
- Sentry
- Vercel Analytics

---

# Recommendation

Start with the simplest reliable stack:

- Next.js web app first
- PostgreSQL + Prisma
- Vercel Blob
- Clerk or Auth.js
- Pusher or Ably for realtime
- Resend for email
- Playwright for acceptance tests

Native mobile apps should come after the core web experience is validated.
