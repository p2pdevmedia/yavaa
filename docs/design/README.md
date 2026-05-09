# Design

This folder contains the product design planification for Yavaa.

## Purpose

Design in Yavaa must support:

- trust-first user journeys
- predictable role-based flows
- permission-aware UX
- deterministic state transitions
- testable and auditable interactions
- a clear visual and interaction direction before UI work begins

## Current source status

The external design link provided for implementation could not be fetched from this environment (`403 Forbidden` on `https://api.anthropic.com/v1/design/h/df9UbrVuEy5a4EcXmZkjCg`).

To keep progress unblocked, this folder provides a project-native design planification baseline aligned with existing architecture and phase planning docs.

## Reference prototype

The current direction is based on the local prototype artifact in the repository and should be treated as a design reference, not production code.

## Visual direction

- Mobile-first service marketplace shell with an iOS-style frame.
- Warm, local, trust-oriented aesthetic instead of cold SaaS styling.
- Strong use of cards, pills, and grouped surfaces.
- Spanish-first copy with English as a mirrored secondary language.

## Design system cues

- Terracotta, jade, and midnight palettes form the core theme set.
- `Manrope` is the body face.
- `Bricolage Grotesque` is the display face.
- `Instrument Serif` is the accent face.
- `JetBrains Mono` is reserved for technical micro-labels and prototypes.
- Status, navigation, and list treatments should stay visually quiet and highly readable.

## Scope

- Establish the shared visual language for web-first screens.
- Define reusable layout primitives and component patterns.
- Document tokens for color, typography, spacing, radius, shadows, and motion.
- Define accessible states for loading, empty, error, disabled, and success.
- Keep the UI predictable for humans, agents, and Playwright tests.
- Prepare the design system for future mobile reuse without implementing native UI now.

## Design principles

- Simple over ornamental.
- Predictable over surprising.
- Explicit over hidden.
- Accessible over clever.
- Stable routes and stable labels over dynamic navigation tricks.
- Strong hierarchy for fast scanning.
- Server-driven state remains the source of truth.

## Product surfaces to plan

- Public landing and discovery screens.
- Authentication and profile switching flows.
- Contractor onboarding and approval screens.
- Category, service, and availability management.
- Booking, emergency, and chat flows.
- Debt, payment proof, and dispute review surfaces.
- Admin moderation and operational dashboards.

## Layout patterns

- Persistent top status area for phone-shaped previews.
- Search-first home screen with a clear greeting and trust strip.
- Category grid for discovery.
- Horizontal worker cards for near-you browsing.
- Filter chips for result refinement.
- Profile detail pages with strong CTA hierarchy.
- Bottom tab bar for the primary mobile navigation.

## Required design outputs

- Brand and UI tokens document.
- Shared component inventory.
- Page template inventory.
- Form and validation patterns.
- Table, list, and detail view patterns.
- Empty/loading/error state patterns.
- Accessibility and keyboard-navigation rules.
- Handoff notes for implementation.

## Documents

- `planification.md`: design planification by phase, domain, and quality gate.

## Design workflow

- Start from product decisions and user-action maps.
- Reuse the same patterns across client, contractor, support, and admin views.
- Keep content models aligned with the API contract.
- Make each screen easy to verify in tests.
- Treat design changes as documented decisions, not ad hoc styling.
- Prefer reusable prototype primitives over one-off component experiments.

## Non-goals

- No UI implementation in this phase.
- No native mobile design work yet.
- No animation-first experimentation.
- No one-off visual treatment that breaks component reuse.
- No permission shortcuts in the interface.

## Completion criteria

- The design direction is documented and reviewed.
- The phase has enough detail to guide implementation work later.
- The plan supports deterministic, accessible, agent-friendly UI development.
