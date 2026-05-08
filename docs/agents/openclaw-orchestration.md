# OpenClaw Orchestration Plan

This document defines how OpenClaw should orchestrate multiple AI agents to develop Yavaa.

OpenClaw is the coordinator. Claude, Codex, and other models are workers with specific roles.

---

# Goal

Build Yavaa using multiple specialized agents that can:

- finish planning
- write code
- audit code
- write tests
- run tests
- fix errors
- compile
- repeat until stable

The system should optimize for:

- quality
- low token usage
- clear responsibility
- repeatable development loops

---

# Main principle

Do not use one giant agent for everything.

Use small specialized agents with clear roles.

Each agent should receive only the documents and files needed for its task.

---

# Agent roles

## 1. Planner Agent

Purpose:

- read product docs
- split work into phases
- create implementation tasks
- update planning docs

Recommended model:

- Claude Sonnet class

Use stronger model only for major architecture decisions.

---

## 2. Architect Agent

Purpose:

- database design
- API design
- state machines
- permissions
- realtime event design

Recommended model:

- Claude Opus class for hard architecture
- Claude Sonnet class for normal architecture

---

## 3. Backend Agent

Purpose:

- Prisma schema
- Supabase integration
- API routes
- business rules
- permissions
- OpenAPI updates

Recommended model:

- GPT Codex class
- Claude Sonnet class for review or complex reasoning

---

## 4. Frontend Agent

Purpose:

- Next.js pages
- forms
- dashboards
- client mode
- contractor mode
- admin mode

Recommended model:

- GPT Codex mini class for simple UI
- GPT Codex class for complex flows

---

## 5. Test Agent

Purpose:

- Vitest tests
- Playwright tests
- black-box tests
- deterministic datasets
- regression tests

Recommended model:

- GPT Codex class
- GPT Codex mini class for repetitive test generation

---

## 6. Review Agent

Purpose:

- audit code
- detect missing tests
- detect permission bugs
- detect security issues
- check OpenAPI consistency

Recommended model:

- Claude Sonnet class
- Claude Opus class for security-critical reviews

---

## 7. Fixer Agent

Purpose:

- read failing logs
- fix only the broken part
- keep patches small
- rerun tests

Recommended model:

- GPT Codex mini class for simple failures
- GPT Codex class for complex failures

---

## 8. Documentation Agent

Purpose:

- update README
- update phase docs
- update API docs
- keep AGENTS.md accurate

Recommended model:

- cheap fast model
- Claude Haiku class or GPT mini class

---

# Development loop

Every task should follow this loop:

1. Planner creates task.
2. Architect validates design when needed.
3. Backend or Frontend agent implements.
4. Test agent writes tests.
5. Runner executes tests.
6. Fixer fixes failures.
7. Review agent audits.
8. Documentation agent updates docs.
9. Human approves merge.

---

# Token optimization rules

- Send only relevant files to each agent.
- Prefer phase docs over full repository context.
- Use summaries between agents.
- Keep patches small.
- Avoid asking expensive models to do repetitive work.
- Use cheap models for formatting, docs, simple tests, and small fixes.
- Use strong models for architecture, security, state machines, and hard bugs.

---

# Required project files for agents

Agents should always check:

- README.md
- AGENTS.md
- docs/architecture/tech-stack.md
- docs/product/decisions.md
- docs/product/user-action-map.md
- docs/testing/user-action-test-matrix.md
- docs/planning/phases/README.md

Then they should read only the relevant phase folder.

---

# Quality gates

A task is not complete unless:

- implementation works
- tests pass
- Playwright tests pass when relevant
- OpenAPI is updated when API changes
- permissions are checked server-side
- docs are updated when behavior changes
- no unrelated files are changed

---

# Human approval

Agents can implement, test, and fix.

Human approval is required before merging important changes.
