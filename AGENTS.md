# AGENTS.md

# Yavaa

Yavaa is a service marketplace and realtime coordination platform for humans and AI agents.

The platform allows people to:

- find contractors
- offer services
- manage bookings
- handle emergencies
- coordinate real-world work
- manage debt and commissions
- communicate through internal chat

Yavaa is designed to work for:

- humans
- AI agents
- automated workflows
- future orchestration systems

---

# Core Philosophy

The project prioritizes:

1. reliability
2. permissions correctness
3. deterministic behavior
4. strong testing
5. agent-friendly architecture
6. modularity
7. long-term scalability

Do not optimize prematurely for:

- microservices
- over-engineered realtime
- unnecessary abstraction
- premature mobile complexity

The correct order is:

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

# Technology Stack

## Core

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Prisma
- Tailwind CSS
- shadcn/ui
- Vercel Blob

## Realtime

- Supabase Realtime

## Auth

- Supabase Auth

## Validation

- Zod
- React Hook Form

## State

- TanStack Query
- Zustand

## Testing

- Playwright
- Vitest

## API

- OpenAPI is mandatory

---

# Project Structure Philosophy

Yavaa is organized into phases and domains.

Important documentation:

- docs/planning/phases/README.md
- docs/product/decisions.md
- docs/product/user-action-map.md
- docs/testing/user-action-test-matrix.md
- docs/architecture/tech-stack.md
- docs/agents/openclaw-orchestration.md

Agents should first:

1. understand the current phase
2. read only relevant phase docs
3. avoid loading the entire repository when unnecessary

---

# Development Rules

## General

- Keep patches small.
- Avoid unrelated changes.
- Never rewrite large areas unnecessarily.
- Prefer explicit code over clever abstractions.
- Keep business logic outside UI components.
- Use TypeScript strictly.
- Avoid `any` whenever possible.

---

# Database Rules

## Prisma

- Prisma is the source of schema truth.
- All schema changes require migrations.
- Never manually drift database schema.
- Always run the matching migration workflow before relying on a schema change, even when the target Supabase database is only used for testing.

## Relationships

- Use explicit relationships.
- Prefer normalized data.
- Add indexes intentionally.

## Auditability

Important actions must be auditable.

Examples:

- role changes
- contractor approvals
- payment confirmations
- debt changes
- disputes
- booking state overrides

---

# Permissions Rules

Permissions must ALWAYS be enforced server-side.

Never trust frontend permissions.

Every important action must validate:

- user role
- ownership
- booking relationship
- debt status
- suspension status
- approval status

---

# OpenAPI Rules

Yavaa is API-first.

Whenever APIs change:

- OpenAPI must be updated
- request schemas must stay typed
- response schemas must stay typed
- breaking changes must be documented

The web app, mobile apps, tests, and future agents should use the same API contract.

---

# Playwright Rules

Playwright is mandatory.

Critical user flows must always have:

- end-to-end coverage
- black-box testing
- permission testing
- edge-case testing when relevant

Examples:

- bookings
- emergencies
- role switching
- contractor approval
- debt blocking
- payment confirmation
- disputes

---

# Testing Rules

Every important action must eventually map to:

- unit tests
- integration tests
- Playwright tests
- permission tests
- invalid-state tests

Use deterministic datasets whenever possible.

Do not rely only on manual testing.

---

# Realtime Rules

Realtime should notify clients.

Realtime should NOT replace durable database state.

The database is the source of truth.

Important realtime domains:

- chat
- booking updates
- emergency requests
- contractor responses
- booking status changes

---

# Agent-Friendly Rules

Yavaa is designed for AI agents.

The platform should support:

- automated search
- automated booking assistance
- automated contractor workflows
- structured responses
- deterministic APIs
- orchestration systems

Sensitive actions should still require confirmation when appropriate.

---

# Booking Philosophy

Yavaa supports:

- emergency now
- today
- scheduled bookings

Matching is assisted, not fully automatic.

The client remains in control.

The system helps discover compatible contractors.

---

# Payment Philosophy

Yavaa does not process the main service payment in the MVP.

The client pays the contractor directly.

The contractor confirms payment received.

Admin only enters when disputes or conflicts exist.

Commission debt is handled separately.

---

# UI Philosophy

The UI must be:

- simple
- predictable
- testable
- accessible
- agent-friendly

Avoid:

- hidden state complexity
- inconsistent forms
- unstable navigation
- unclear actions

---

# Mobile Philosophy

Native mobile apps come later.

Priority order:

1. web foundation
2. permissions
3. tests
4. business rules
5. realtime
6. mobile apps

---

# Agent Orchestration Philosophy

OpenClaw acts as orchestrator.

Different agents should specialize in:

- planning
- architecture
- backend
- frontend
- testing
- auditing
- fixing
- documentation

Do not use one giant agent for everything.

Use stronger models only when necessary.

Use cheaper models for repetitive tasks.

---

# Quality Gates

A task is NOT complete unless:

- implementation works
- tests pass
- Playwright passes when relevant
- OpenAPI updated when APIs changed
- permissions validated server-side
- docs updated when behavior changed
- no unrelated files changed

---

# Important Engineering Principles

## Keep context small

Agents should read only:

- relevant phase docs
- relevant APIs
- relevant schemas
- relevant tests

Avoid loading the entire repository unnecessarily.

## Keep patches focused

One task should solve one problem.

Avoid giant mixed PRs.

## Prefer deterministic systems

Avoid hidden state.

Avoid implicit side effects.

Avoid unpredictable realtime behavior.

## Prefer explicit state machines

Important systems should eventually have explicit state machines:

- bookings
- payments
- disputes
- emergencies
- debt handling

---

# Long-Term Vision

Yavaa should become:

- a trusted service marketplace
- a realtime coordination platform
- an agent-friendly platform
- infrastructure for human and AI collaboration
- a scalable LatAm-wide service network
