# Yavaa Design Planification

## 1) Principles

Design decisions must follow this order:

1. Data model clarity
2. Permission correctness
3. Business-rule visibility
4. Deterministic interaction states
5. Testability
6. Visual polish

## 2) UX System Scope (MVP Web)

### Roles

- Client mode
- Contractor mode
- Admin mode

Each mode must have explicit entry points, visual context, and guardrails to prevent cross-role confusion.

### Core domains

- Identity & profiles
- Categories & services
- Availability
- Bookings
- Matching
- Realtime chat
- Emergencies
- Payments/debt
- Ratings
- Admin moderation

## 3) Information Architecture

### Global shell

- Header with role/context indicator
- Primary navigation by domain
- Status/alert region for blocking conditions (debt, suspension, pending verification)

### Domain-first navigation

Navigation labels should map 1:1 with planning phase domains to keep docs, APIs, tests, and UI aligned.

## 4) Design Deliverables by Maturity

### A. Foundation deliverables

- Page inventory by role
- Domain-level user flows
- Shared UI primitives list
- Form patterns and validation behavior

### B. Interaction deliverables

- State diagrams for booking and debt-sensitive actions
- Error and empty-state specifications
- Loading and optimistic update rules

### C. Validation deliverables

- Mapping from each critical action to:
  - permission checks
  - backend API endpoint
  - integration tests
  - Playwright scenarios

## 5) Domain Planification

### Identity & Profiles

- Profile completion checklist
- Role switch UX with explicit confirmation
- Verification badges and pending states

### Categories & Services

- Service creation/edit form patterns
- Category discovery and filtering UX
- Pricing and availability summary cards

### Availability

- Weekly availability editor
- Emergency availability toggle states
- Conflict and overlap handling messages

### Bookings

- Booking creation flow variants: emergency now / today / scheduled
- Booking timeline and state history
- Permission-based action buttons by role and state

### Matching

- Assisted shortlist presentation
- Compatibility signals (distance, availability, category match)
- Manual user confirmation before assignment

### Chat (Realtime)

- Durable message-first UX (DB as source of truth)
- Delivery state indicators
- Escalation to booking/emergency context actions

### Emergencies

- High-visibility emergency flow entry
- Fast contractor response cards
- Explicit timeout and fallback states

### Payments & Debt

- Direct payment confirmation UX between client and contractor
- Debt dashboard and threshold warnings
- Proof upload and admin validation states

### Ratings & Reputation

- Post-booking rating prompts
- Abuse-resistant review visibility rules
- Reputation summaries in contractor profile cards

### Admin

- Dispute queue interface
- Debt and proof validation workflows
- Auditable override actions with reason capture

## 6) Accessibility & Internationalization Baseline

- Keyboard-first navigation for all critical flows
- Semantic labels for role-sensitive actions
- Contrast-safe status colors for debt, emergencies, and blocking states
- Spanish-first copy strategy with stable term glossary

## 7) Quality Gates for Design Completion

A domain design is considered complete only when:

- Primary and edge flows are diagrammed
- Permission-sensitive actions are explicitly marked
- API contracts for the flow are identified
- Deterministic UI state transitions are documented
- Test hooks for Playwright coverage are defined

## 8) Execution Sequence

1. Validate phase priority from `docs/planning/phases/README.md`
2. Produce role-specific flow specs for the current phase
3. Map each UI action to permission checks and API contracts
4. Define deterministic state and error variants
5. Add/update Playwright scenario list for the domain
6. Ship UI only after these artifacts are accepted

## 9) Traceability Matrix Template

For each important action, track:

- Action name
- User role
- Required permissions
- Backend endpoint
- Success state
- Failure states
- Audit event requirement
- Unit/integration test reference
- Playwright test reference

This matrix should be maintained alongside implementation to keep design and behavior synchronized.
