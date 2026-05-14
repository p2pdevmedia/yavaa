# Agent API Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a practical Agent API guide that documents how automation clients use the same Yavaa HTTP endpoints as the web UI.

**Architecture:** This is documentation-only. Keep Supabase Auth as the login provider, explain bearer-token usage against existing Next.js route handlers, and document exact payloads and error shapes from current route/service code. Do not add endpoints, schema changes, or runtime behavior.

**Tech Stack:** Markdown documentation, Next.js App Router API routes, Supabase Auth, TypeScript, Prisma-backed service validation.

---

### Task 1: Write the Agent API Guide

**Files:**
- Create: `docs/api/agent-api.md`
- Reference: `docs/superpowers/specs/2026-05-14-agent-api-documentation-design.md`
- Reference: `src/app/api/session/route.ts`
- Reference: `src/app/api/me/route.ts`
- Reference: `src/app/api/job-posts/route.ts`
- Reference: `src/app/api/onboarding/status/route.ts`
- Reference: `src/app/api/onboarding/jefe/route.ts`
- Reference: `src/app/api/onboarding/trabajador/route.ts`
- Reference: `src/lib/job-posts.ts`
- Reference: `src/lib/onboarding.ts`
- Reference: `src/lib/onboarding-status.ts`
- Reference: `src/lib/request-auth.ts`
- Reference: `src/lib/supabase.ts`

- [x] **Step 1: Create the API docs directory and guide**

Create `docs/api/agent-api.md` with these sections:

```markdown
# Agent API

## Overview

## Requirements

## Authentication

## Authenticated Requests

## Endpoint Reference

## Error Handling

## Agent Flow

## Safety Rules

## Supabase References
```

- [x] **Step 2: Document Supabase login**

Add a JavaScript example using `@supabase/supabase-js`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'user-password'
});

if (error || !data.session) {
  throw new Error(error?.message ?? 'Login failed');
}

const accessToken = data.session.access_token;
```

- [x] **Step 3: Document bearer requests**

Add a `fetch` example against `GET /api/me`:

```ts
const response = await fetch(`${process.env.YAVAA_BASE_URL}/api/me`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json'
  }
});

const body = await response.json();
```

- [x] **Step 4: Document endpoint contracts**

Document these endpoints with method, auth, role, request body, success body, and common error bodies:

```txt
GET /api/session
GET /api/me
GET /api/onboarding/status
POST /api/onboarding/jefe
POST /api/onboarding/trabajador
GET /api/job-posts
POST /api/job-posts
```

Use the exact field names from the current schemas:

```txt
firstName
lastName
addressName
addressText
locationLatitude
locationLongitude
avatarBlobPath
dniNumber
workerCategories
hourlyRatePesos
title
category
description
desiredTime
photoPathnames
```

- [x] **Step 5: Document error handling and retry behavior**

Include the concrete status meanings:

```txt
400 invalid JSON
401 missing or invalid token
403 authenticated but not allowed
422 valid JSON with invalid business fields
```

Show this `fieldErrors` pattern:

```json
{
  "ok": false,
  "message": "Revisá los datos del trabajo.",
  "fieldErrors": {
    "title": ["Usá un título de al menos 3 caracteres."]
  }
}
```

- [x] **Step 6: Run documentation verification**

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: all commands pass.

- [x] **Step 7: Commit**

```bash
git add docs/superpowers/plans/2026-05-14-agent-api-documentation.md docs/api/agent-api.md
git commit -m "docs: add agent api guide"
```
