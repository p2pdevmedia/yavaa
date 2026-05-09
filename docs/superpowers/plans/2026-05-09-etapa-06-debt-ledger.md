# Etapa 06.1 Debt Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable commission debt tracking, per-user debt limits, and server-side debt blocking for booking creation and contractor acceptance.

**Architecture:** Store commission debt and debt limits in Prisma/Postgres, keep balance calculation in `src/lib/debts.ts`, expose user/admin APIs, and call the debt guard from booking business logic before state-changing actions. The debt block is calculated from `OPEN` debts and does not mutate `User.status`.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, PostgreSQL, Zod, Vitest, OpenAPI.

---

## File Structure

- Modify: `prisma/schema.prisma`
  - Add `CommissionDebtStatus`, `CommissionDebtSourceType`, `CommissionDebt`, and `UserDebtLimit`.
  - Add `User` relations for debts, created debts, configured limits, and own limit.
- Create: `prisma/migrations/00000000000010_phase_06_debt_ledger/migration.sql`
  - Create enums, tables, indexes, and foreign keys.
- Modify: `tests/database.test.ts`
  - Include `commission_debts` and `user_debt_limits` in expected seeded table discovery.
- Modify: `src/lib/permissions.ts`
  - Add `canManageDebt`.
- Modify: `tests/permissions.test.ts`
  - Cover admin/support debt management permissions.
- Create: `src/lib/debts.ts`
  - Own/admin schemas, serializers, balance summary, list/create debt, set limit, and debt guard.
- Create: `tests/debts.test.ts`
  - Unit tests for debt summary, permissions, audit logs, and limit updates.
- Modify: `src/lib/bookings.ts`
  - Block debt-limited clients in `createScheduledBooking`.
  - Block debt-limited contractors only on `accept`.
- Modify: `tests/bookings.test.ts`
  - Mock debt guard and assert blocked booking creation/acceptance.
- Create: `src/app/api/me/debt-summary/route.ts`
  - Authenticated self-service debt summary endpoint.
- Create: `src/app/api/admin/debts/route.ts`
  - Admin list/create debt endpoint.
- Create: `src/app/api/admin/users/[userId]/debt-limit/route.ts`
  - Admin set debt limit endpoint.
- Modify: `src/lib/openapi.ts`
  - Add schemas and paths for the three debt APIs.
- Modify: `tests/openapi.test.ts`
  - Assert new paths exist.
- Modify: `docs/planning/phases/etapa-06-deuda-reputacion-y-validaciones/README.md`
  - Mark 06.1 as started or implemented when code is complete.

---

### Task 1: Schema and Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/00000000000010_phase_06_debt_ledger/migration.sql`
- Modify: `tests/database.test.ts`

- [ ] **Step 1: Write the failing database table expectation**

Update `tests/database.test.ts` so the query includes the new tables:

```ts
AND table_name IN (
  'users',
  'profiles',
  'roles',
  'user_roles',
  'audit_logs',
  'bookings',
  'booking_files',
  'booking_messages',
  'notifications',
  'commission_debts',
  'user_debt_limits',
  'emergency_request_candidates',
  'emergency_requests',
  'markets',
  'categories',
  'addresses',
  'work_zones',
  'contractor_profiles',
  'contractor_categories',
  'contractor_work_zones'
)
```

Update the expected sorted array:

```ts
expect(rows.map((row) => row.table_name)).toEqual([
  'addresses',
  'audit_logs',
  'booking_files',
  'booking_messages',
  'bookings',
  'categories',
  'commission_debts',
  'contractor_categories',
  'contractor_profiles',
  'contractor_work_zones',
  'emergency_request_candidates',
  'emergency_requests',
  'markets',
  'notifications',
  'profiles',
  'roles',
  'user_debt_limits',
  'user_roles',
  'users',
  'work_zones'
]);
```

- [ ] **Step 2: Run the database test to verify it fails**

Run:

```bash
npm run test -- tests/database.test.ts
```

Expected: skipped when `DATABASE_URL` is absent, or FAIL because `commission_debts` and `user_debt_limits` do not exist yet.

- [ ] **Step 3: Add Prisma schema models**

Add enums near existing enums in `prisma/schema.prisma`:

```prisma
enum CommissionDebtStatus {
  OPEN
  PAID
  CANCELLED
}

enum CommissionDebtSourceType {
  ADMIN_ADJUSTMENT
  BOOKING_COMMISSION
}
```

Add relations to `model User`:

```prisma
commissionDebts             CommissionDebt[] @relation("DebtUser")
commissionDebtsCreated      CommissionDebt[] @relation("DebtCreator")
debtLimit                   UserDebtLimit?   @relation("DebtLimitUser")
debtLimitsSet               UserDebtLimit[]  @relation("DebtLimitSetter")
```

Add models after `AuditLog`:

```prisma
model CommissionDebt {
  id              String                   @id @default(uuid()) @db.Uuid
  userId          String                   @map("user_id") @db.Uuid
  sourceType      CommissionDebtSourceType @default(ADMIN_ADJUSTMENT) @map("source_type")
  sourceId        String?                  @map("source_id")
  amountCents     Int                      @map("amount_cents")
  currency        String                   @default("ARS")
  status          CommissionDebtStatus     @default(OPEN)
  reason          String
  createdByUserId String?                  @map("created_by_user_id") @db.Uuid
  createdAt       DateTime                 @default(now()) @map("created_at")
  updatedAt       DateTime                 @updatedAt @map("updated_at")

  user          User  @relation("DebtUser", fields: [userId], references: [id], onDelete: Cascade)
  createdByUser User? @relation("DebtCreator", fields: [createdByUserId], references: [id], onDelete: SetNull)

  @@index([userId, status])
  @@index([createdByUserId])
  @@index([sourceType, sourceId])
  @@index([createdAt])
  @@map("commission_debts")
}

model UserDebtLimit {
  userId      String   @id @map("user_id") @db.Uuid
  limitCents  Int      @map("limit_cents")
  currency    String   @default("ARS")
  setByUserId String   @map("set_by_user_id") @db.Uuid
  reason      String
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user      User @relation("DebtLimitUser", fields: [userId], references: [id], onDelete: Cascade)
  setByUser User @relation("DebtLimitSetter", fields: [setByUserId], references: [id], onDelete: Restrict)

  @@index([setByUserId])
  @@map("user_debt_limits")
}
```

- [ ] **Step 4: Add migration SQL**

Create `prisma/migrations/00000000000010_phase_06_debt_ledger/migration.sql`:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionDebtStatus') THEN
    CREATE TYPE "CommissionDebtStatus" AS ENUM ('OPEN', 'PAID', 'CANCELLED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionDebtSourceType') THEN
    CREATE TYPE "CommissionDebtSourceType" AS ENUM ('ADMIN_ADJUSTMENT', 'BOOKING_COMMISSION');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "commission_debts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "source_type" "CommissionDebtSourceType" NOT NULL DEFAULT 'ADMIN_ADJUSTMENT',
  "source_id" text,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'ARS',
  "status" "CommissionDebtStatus" NOT NULL DEFAULT 'OPEN',
  "reason" text NOT NULL,
  "created_by_user_id" uuid,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commission_debts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_debt_limits" (
  "user_id" uuid NOT NULL,
  "limit_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'ARS',
  "set_by_user_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_debt_limits_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX IF NOT EXISTS "commission_debts_user_id_status_idx"
  ON "commission_debts"("user_id", "status");

CREATE INDEX IF NOT EXISTS "commission_debts_created_by_user_id_idx"
  ON "commission_debts"("created_by_user_id");

CREATE INDEX IF NOT EXISTS "commission_debts_source_type_source_id_idx"
  ON "commission_debts"("source_type", "source_id");

CREATE INDEX IF NOT EXISTS "commission_debts_created_at_idx"
  ON "commission_debts"("created_at");

CREATE INDEX IF NOT EXISTS "user_debt_limits_set_by_user_id_idx"
  ON "user_debt_limits"("set_by_user_id");

ALTER TABLE "commission_debts"
ADD CONSTRAINT "commission_debts_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "commission_debts"
ADD CONSTRAINT "commission_debts_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id")
REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "user_debt_limits"
ADD CONSTRAINT "user_debt_limits_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "user_debt_limits"
ADD CONSTRAINT "user_debt_limits_set_by_user_id_fkey"
FOREIGN KEY ("set_by_user_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
```

- [ ] **Step 5: Generate Prisma client**

Run:

```bash
npm run db:generate
```

Expected: Prisma client generated successfully.

- [ ] **Step 6: Run database test**

Run:

```bash
npm run test -- tests/database.test.ts
```

Expected: PASS or skipped when no `DATABASE_URL` is configured.

---

### Task 2: Debt Permissions

**Files:**
- Modify: `src/lib/permissions.ts`
- Modify: `tests/permissions.test.ts`

- [ ] **Step 1: Write the failing permission test**

In `tests/permissions.test.ts`, import `canManageDebt` with the existing permission helpers and add:

```ts
it('allows only active admins to manage debt', () => {
  expect(canManageDebt(activeAdmin)).toBe(true);
  expect(canManageDebt(activeSupport)).toBe(false);
  expect(canManageDebt(activeClient)).toBe(false);
  expect(canManageDebt(suspendedAdmin)).toBe(false);
});
```

- [ ] **Step 2: Run the permission test to verify it fails**

Run:

```bash
npm run test -- tests/permissions.test.ts
```

Expected: FAIL because `canManageDebt` is not exported.

- [ ] **Step 3: Implement permission helper**

Add to `src/lib/permissions.ts`:

```ts
export function canManageDebt(context: PermissionContext): boolean {
  return isActiveContext(context) && hasRole(context, 'admin');
}
```

- [ ] **Step 4: Run permission test**

Run:

```bash
npm run test -- tests/permissions.test.ts
```

Expected: PASS.

---

### Task 3: Debt Business Logic

**Files:**
- Create: `tests/debts.test.ts`
- Create: `src/lib/debts.ts`

- [ ] **Step 1: Write failing debt summary tests**

Create `tests/debts.test.ts` with:

```ts
import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_DEBT_LIMIT_CENTS,
  createDebtForAdmin,
  getDebtSummaryForUser,
  listDebtsForAdmin,
  setDebtLimitForAdmin,
  throwIfDebtBlocked,
  type DebtActor
} from '@/lib/debts';
import { recordAuditLog } from '@/lib/audit';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const activeClient: DebtActor = {
  userId: '11111111-1111-4111-8111-111111111111',
  status: UserStatus.ACTIVE,
  roles: ['client']
};

const activeAdmin: DebtActor = {
  userId: '33333333-3333-4333-8333-333333333333',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

const activeSupport: DebtActor = {
  userId: '44444444-4444-4444-8444-444444444444',
  status: UserStatus.ACTIVE,
  roles: ['support']
};

function buildDebtPrismaMock() {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: activeClient.userId,
        email: 'client@yavaa.test',
        displayName: 'Client One',
        status: UserStatus.ACTIVE
      })
    },
    commissionDebt: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { amountCents: 12500 }, _count: { id: 2 } }),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn()
    },
    userDebtLimit: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn()
    }
  };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('debt helpers', () => {
  it('summarizes open debt with the default limit', async () => {
    const prisma = buildDebtPrismaMock();

    const summary = await getDebtSummaryForUser(prisma as never, activeClient.userId);

    expect(prisma.commissionDebt.aggregate).toHaveBeenCalledWith({
      where: {
        userId: activeClient.userId,
        status: 'OPEN',
        currency: 'ARS'
      },
      _sum: { amountCents: true },
      _count: { id: true }
    });
    expect(summary).toEqual({
      userId: activeClient.userId,
      balanceCents: 12500,
      limitCents: DEFAULT_DEBT_LIMIT_CENTS,
      currency: 'ARS',
      isDebtBlocked: true,
      openDebtCount: 2
    });
  });

  it('uses explicit user debt limit when present', async () => {
    const prisma = buildDebtPrismaMock();
    vi.mocked(prisma.userDebtLimit.findUnique).mockResolvedValueOnce({
      userId: activeClient.userId,
      limitCents: 20000,
      currency: 'ARS'
    } as never);

    const summary = await getDebtSummaryForUser(prisma as never, activeClient.userId);

    expect(summary.limitCents).toBe(20000);
    expect(summary.isDebtBlocked).toBe(false);
  });

  it('throws debt-blocked when balance is above limit', async () => {
    const prisma = buildDebtPrismaMock();

    await expect(throwIfDebtBlocked(prisma as never, activeClient.userId)).rejects.toThrow('debt-blocked');
  });

  it('lists debts only for active admins', async () => {
    const prisma = buildDebtPrismaMock();

    await listDebtsForAdmin(prisma as never, activeAdmin, { status: 'OPEN' });

    expect(prisma.commissionDebt.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'OPEN' },
      orderBy: [{ createdAt: 'desc' }]
    }));

    await expect(listDebtsForAdmin(prisma as never, activeSupport, {})).rejects.toThrow('forbidden');
  });

  it('creates manual debt with audit log for active admins', async () => {
    const prisma = buildDebtPrismaMock();
    vi.mocked(prisma.commissionDebt.create).mockResolvedValueOnce({
      id: 'debt_001',
      userId: activeClient.userId,
      sourceType: 'ADMIN_ADJUSTMENT',
      sourceId: null,
      amountCents: 15000,
      currency: 'ARS',
      status: 'OPEN',
      reason: 'Initial commission adjustment.',
      createdByUserId: activeAdmin.userId,
      createdAt: new Date('2026-05-09T10:00:00.000Z'),
      updatedAt: new Date('2026-05-09T10:00:00.000Z'),
      user: {
        id: activeClient.userId,
        email: 'client@yavaa.test',
        displayName: 'Client One'
      },
      createdByUser: {
        id: activeAdmin.userId,
        email: 'admin@yavaa.test',
        displayName: 'Admin One'
      }
    } as never);

    const debt = await createDebtForAdmin(prisma as never, activeAdmin, {
      userId: activeClient.userId,
      amountCents: 15000,
      currency: 'ARS',
      reason: 'Initial commission adjustment.'
    });

    expect(debt.id).toBe('debt_001');
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'debt.created',
      entityType: 'commission_debt',
      entityId: 'debt_001',
      metadata: {
        userId: activeClient.userId,
        amountCents: 15000,
        currency: 'ARS',
        reason: 'Initial commission adjustment.'
      }
    });
  });

  it('sets debt limit with audit log for active admins', async () => {
    const prisma = buildDebtPrismaMock();
    vi.mocked(prisma.userDebtLimit.upsert).mockResolvedValueOnce({
      userId: activeClient.userId,
      limitCents: 5000,
      currency: 'ARS',
      setByUserId: activeAdmin.userId,
      reason: 'Lower risk threshold.',
      createdAt: new Date('2026-05-09T10:00:00.000Z'),
      updatedAt: new Date('2026-05-09T10:00:00.000Z')
    } as never);

    const limit = await setDebtLimitForAdmin(prisma as never, activeAdmin, activeClient.userId, {
      limitCents: 5000,
      currency: 'ARS',
      reason: 'Lower risk threshold.'
    });

    expect(limit.limitCents).toBe(5000);
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'debt_limit.updated',
      entityType: 'user',
      entityId: activeClient.userId,
      metadata: {
        limitCents: 5000,
        currency: 'ARS',
        reason: 'Lower risk threshold.'
      }
    });
  });
});
```

- [ ] **Step 2: Run debt tests to verify they fail**

Run:

```bash
npm run test -- tests/debts.test.ts
```

Expected: FAIL because `src/lib/debts.ts` does not exist.

- [ ] **Step 3: Implement debt helpers**

Create `src/lib/debts.ts`:

```ts
import { UserStatus, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { canManageDebt, type PermissionContext } from '@/lib/permissions';

export const DEFAULT_DEBT_LIMIT_CENTS = 10000;
export const DEBT_CURRENCY = 'ARS';

export type DebtActor = PermissionContext;

export const debtStatusSchema = z.enum(['OPEN', 'PAID', 'CANCELLED']);

export const adminDebtListFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  status: debtStatusSchema.optional()
});

export const adminCreateDebtSchema = z.object({
  userId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.literal(DEBT_CURRENCY),
  reason: z.string().trim().min(8).max(1000)
});

export const adminDebtLimitSchema = z.object({
  limitCents: z.number().int().min(0),
  currency: z.literal(DEBT_CURRENCY),
  reason: z.string().trim().min(8).max(1000)
});

export type DebtSummary = {
  userId: string;
  balanceCents: number;
  limitCents: number;
  currency: typeof DEBT_CURRENCY;
  isDebtBlocked: boolean;
  openDebtCount: number;
};

export type AdminDebtRecord = {
  id: string;
  userId: string;
  sourceType: 'ADMIN_ADJUSTMENT' | 'BOOKING_COMMISSION';
  sourceId: string | null;
  amountCents: number;
  currency: string;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  reason: string;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  createdByUser: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
};

type DebtRow = Omit<AdminDebtRecord, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

type DebtLimitRow = {
  userId: string;
  limitCents: number;
  currency: string;
  setByUserId: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DebtLimitRecord = {
  userId: string;
  limitCents: number;
  currency: string;
  setByUserId: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

const adminDebtSelect = {
  id: true,
  userId: true,
  sourceType: true,
  sourceId: true,
  amountCents: true,
  currency: true,
  status: true,
  reason: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      displayName: true
    }
  },
  createdByUser: {
    select: {
      id: true,
      email: true,
      displayName: true
    }
  }
} as const;

function assertCanManageDebt(actor: DebtActor): void {
  if (!canManageDebt(actor)) {
    throw new Error('forbidden');
  }
}

function serializeDebt(row: DebtRow): AdminDebtRecord {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function serializeDebtLimit(row: DebtLimitRow): DebtLimitRecord {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function getDebtSummaryForUser(prisma: PrismaClient, userId: string): Promise<DebtSummary> {
  const [aggregate, limit] = await Promise.all([
    prisma.commissionDebt.aggregate({
      where: {
        userId,
        status: 'OPEN',
        currency: DEBT_CURRENCY
      },
      _sum: { amountCents: true },
      _count: { id: true }
    }),
    prisma.userDebtLimit.findUnique({
      where: { userId },
      select: {
        userId: true,
        limitCents: true,
        currency: true
      }
    })
  ]);

  const balanceCents = aggregate._sum.amountCents ?? 0;
  const limitCents = limit?.currency === DEBT_CURRENCY ? limit.limitCents : DEFAULT_DEBT_LIMIT_CENTS;

  return {
    userId,
    balanceCents,
    limitCents,
    currency: DEBT_CURRENCY,
    isDebtBlocked: balanceCents > limitCents,
    openDebtCount: aggregate._count.id
  };
}

export async function getOwnDebtSummary(prisma: PrismaClient, actor: DebtActor): Promise<DebtSummary> {
  if (actor.status !== UserStatus.ACTIVE) {
    throw new Error('forbidden');
  }

  return getDebtSummaryForUser(prisma, actor.userId);
}

export async function throwIfDebtBlocked(prisma: PrismaClient, userId: string): Promise<void> {
  const summary = await getDebtSummaryForUser(prisma, userId);

  if (summary.isDebtBlocked) {
    throw new Error('debt-blocked');
  }
}

export async function listDebtsForAdmin(
  prisma: PrismaClient,
  actor: DebtActor,
  filters: z.infer<typeof adminDebtListFiltersSchema>
): Promise<AdminDebtRecord[]> {
  assertCanManageDebt(actor);
  const parsed = adminDebtListFiltersSchema.parse(filters);

  const rows = (await prisma.commissionDebt.findMany({
    where: {
      ...(parsed.userId ? { userId: parsed.userId } : {}),
      ...(parsed.status ? { status: parsed.status } : {})
    },
    orderBy: [{ createdAt: 'desc' }],
    select: adminDebtSelect
  })) as DebtRow[];

  return rows.map(serializeDebt);
}

export async function createDebtForAdmin(
  prisma: PrismaClient,
  actor: DebtActor,
  input: z.infer<typeof adminCreateDebtSchema>
): Promise<AdminDebtRecord> {
  assertCanManageDebt(actor);
  const parsed = adminCreateDebtSchema.parse(input);

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true }
  });

  if (!targetUser) {
    throw new Error('user-not-found');
  }

  const debt = (await prisma.commissionDebt.create({
    data: {
      userId: parsed.userId,
      sourceType: 'ADMIN_ADJUSTMENT',
      amountCents: parsed.amountCents,
      currency: parsed.currency,
      status: 'OPEN',
      reason: parsed.reason,
      createdByUserId: actor.userId
    },
    select: adminDebtSelect
  })) as DebtRow;

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'debt.created',
    entityType: 'commission_debt',
    entityId: debt.id,
    metadata: {
      userId: parsed.userId,
      amountCents: parsed.amountCents,
      currency: parsed.currency,
      reason: parsed.reason
    }
  });

  return serializeDebt(debt);
}

export async function setDebtLimitForAdmin(
  prisma: PrismaClient,
  actor: DebtActor,
  userId: string,
  input: z.infer<typeof adminDebtLimitSchema>
): Promise<DebtLimitRecord> {
  assertCanManageDebt(actor);
  const parsed = adminDebtLimitSchema.parse(input);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!targetUser) {
    throw new Error('user-not-found');
  }

  const limit = (await prisma.userDebtLimit.upsert({
    where: { userId },
    create: {
      userId,
      limitCents: parsed.limitCents,
      currency: parsed.currency,
      setByUserId: actor.userId,
      reason: parsed.reason
    },
    update: {
      limitCents: parsed.limitCents,
      currency: parsed.currency,
      setByUserId: actor.userId,
      reason: parsed.reason
    }
  })) as DebtLimitRow;

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'debt_limit.updated',
    entityType: 'user',
    entityId: userId,
    metadata: {
      limitCents: parsed.limitCents,
      currency: parsed.currency,
      reason: parsed.reason
    }
  });

  return serializeDebtLimit(limit);
}
```

- [ ] **Step 4: Run debt tests**

Run:

```bash
npm run test -- tests/debts.test.ts
```

Expected: PASS.

---

### Task 4: Booking Debt Guards

**Files:**
- Modify: `src/lib/bookings.ts`
- Modify: `tests/bookings.test.ts`

- [ ] **Step 1: Write failing booking tests**

In `tests/bookings.test.ts`, add a mock:

```ts
import { throwIfDebtBlocked } from '@/lib/debts';

vi.mock('@/lib/debts', () => ({
  throwIfDebtBlocked: vi.fn()
}));
```

Add `vi.mocked(throwIfDebtBlocked).mockResolvedValue(undefined);` in `afterEach` or in each non-blocking test setup before the action.

Add tests:

```ts
it('blocks clients with debt from creating new bookings', async () => {
  const { prisma, tx } = buildMockPrisma();
  vi.mocked(throwIfDebtBlocked).mockRejectedValueOnce(new Error('debt-blocked'));

  await expect(
    createScheduledBooking(prisma as never, clientActor, {
      contractorProfileId: '55555555-5555-4555-8555-555555555555',
      categoryId: '88888888-8888-4888-8888-888888888888',
      addressId: '66666666-6666-4666-8666-666666666666',
      scheduledFor: new Date('2026-05-10T10:00:00.000Z'),
      description: 'Fix a leaking faucet'
    })
  ).rejects.toThrow('debt-blocked');

  expect(tx.booking.create).not.toHaveBeenCalled();
});

it('blocks contractors with debt from accepting new bookings', async () => {
  const { prisma, tx } = buildMockPrisma();
  vi.mocked(throwIfDebtBlocked).mockRejectedValueOnce(new Error('debt-blocked'));

  await expect(
    actOnBooking(prisma as never, contractorActor, '44444444-4444-4444-8444-444444444444', 'accept')
  ).rejects.toThrow('debt-blocked');

  expect(tx.booking.update).not.toHaveBeenCalled();
});

it('does not check contractor debt for rejecting a booking', async () => {
  const { prisma } = buildMockPrisma();

  await actOnBooking(prisma as never, contractorActor, '44444444-4444-4444-8444-444444444444', 'reject');

  expect(throwIfDebtBlocked).not.toHaveBeenCalledWith(prisma, contractorActor.userId);
});
```

- [ ] **Step 2: Run booking tests to verify they fail**

Run:

```bash
npm run test -- tests/bookings.test.ts
```

Expected: FAIL because booking logic does not call `throwIfDebtBlocked`.

- [ ] **Step 3: Add debt guard to booking logic**

Add import in `src/lib/bookings.ts`:

```ts
import { throwIfDebtBlocked } from '@/lib/debts';
```

In `createScheduledBooking`, after parsing input and before loading address/contractor/category:

```ts
await throwIfDebtBlocked(prisma, actor.userId);
```

In `actOnBooking`, inside the `action === 'accept'` branch after contractor permission and before state validation/update data:

```ts
await throwIfDebtBlocked(prisma, actor.userId);
```

- [ ] **Step 4: Run booking tests**

Run:

```bash
npm run test -- tests/bookings.test.ts
```

Expected: PASS.

---

### Task 5: API Routes

**Files:**
- Create: `src/app/api/me/debt-summary/route.ts`
- Create: `src/app/api/admin/debts/route.ts`
- Create: `src/app/api/admin/users/[userId]/debt-limit/route.ts`

- [ ] **Step 1: Implement self debt summary route**

Create `src/app/api/me/debt-summary/route.ts`:

```ts
import { type NextRequest } from 'next/server';

import { getOwnDebtSummary } from '@/lib/debts';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active users can view debt summary.'
      },
      { status: 403 }
    );
  }

  try {
    const summary = await getOwnDebtSummary(getPrismaClient(), auth.permissionContext);

    return jsonResponse({ summary }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'forbidden') {
      return jsonResponse(
        {
          error: 'forbidden',
          message: 'Only active users can view debt summary.'
        },
        { status: 403 }
      );
    }

    throw error;
  }
}
```

- [ ] **Step 2: Implement admin debts route**

Create `src/app/api/admin/debts/route.ts`:

```ts
import { type NextRequest } from 'next/server';

import { adminCreateDebtSchema, adminDebtListFiltersSchema, createDebtForAdmin, listDebtsForAdmin } from '@/lib/debts';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

function mapDebtError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return { status: 403, body: { error: 'forbidden', message: 'Only active admins can manage debt.' } };
    }

    if (error.message === 'user-not-found') {
      return { status: 404, body: { error: 'not-found', message: 'User not found.' } };
    }
  }

  return { status: 500, body: { error: 'internal-error', message: 'We could not manage debt.' } };
}

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse({ error: 'forbidden', message: 'Only active admins can manage debt.' }, { status: 403 });
  }

  const parsedFilters = adminDebtListFiltersSchema.safeParse({
    userId: request.nextUrl.searchParams.get('userId') ?? undefined,
    status: request.nextUrl.searchParams.get('status') ?? undefined
  });

  if (!parsedFilters.success) {
    return jsonResponse({ error: 'invalid-request', issues: parsedFilters.error.flatten() }, { status: 400 });
  }

  try {
    const debts = await listDebtsForAdmin(getPrismaClient(), auth.permissionContext, parsedFilters.data);

    return jsonResponse({ debts }, { status: 200 });
  } catch (error) {
    const mapped = mapDebtError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse({ error: 'forbidden', message: 'Only active admins can manage debt.' }, { status: 403 });
  }

  const parsedBody = adminCreateDebtSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return jsonResponse({ error: 'invalid-request', issues: parsedBody.error.flatten() }, { status: 400 });
  }

  try {
    const debt = await createDebtForAdmin(getPrismaClient(), auth.permissionContext, parsedBody.data);

    return jsonResponse({ debt }, { status: 201 });
  } catch (error) {
    const mapped = mapDebtError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
```

- [ ] **Step 3: Implement admin debt limit route**

Create `src/app/api/admin/users/[userId]/debt-limit/route.ts`:

```ts
import { type NextRequest } from 'next/server';

import { adminDebtLimitSchema, setDebtLimitForAdmin } from '@/lib/debts';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

function mapDebtLimitError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return { status: 403, body: { error: 'forbidden', message: 'Only active admins can manage debt.' } };
    }

    if (error.message === 'user-not-found') {
      return { status: 404, body: { error: 'not-found', message: 'User not found.' } };
    }
  }

  return { status: 500, body: { error: 'internal-error', message: 'We could not update the debt limit.' } };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse({ error: 'forbidden', message: 'Only active admins can manage debt.' }, { status: 403 });
  }

  const parsedBody = adminDebtLimitSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return jsonResponse({ error: 'invalid-request', issues: parsedBody.error.flatten() }, { status: 400 });
  }

  const { userId } = await params;

  try {
    const debtLimit = await setDebtLimitForAdmin(getPrismaClient(), auth.permissionContext, userId, parsedBody.data);

    return jsonResponse({ debtLimit }, { status: 200 });
  } catch (error) {
    const mapped = mapDebtLimitError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
```

- [ ] **Step 4: Run typecheck for route signatures**

Run:

```bash
npm run typecheck
```

Expected: PASS.

---

### Task 6: OpenAPI Contract

**Files:**
- Modify: `src/lib/openapi.ts`
- Modify: `tests/openapi.test.ts`
- Regenerate: `public/openapi.json`

- [ ] **Step 1: Write failing OpenAPI path assertions**

Add to `tests/openapi.test.ts`:

```ts
expect(document.paths['/api/me/debt-summary']).toBeDefined();
expect(document.paths['/api/admin/debts']).toBeDefined();
expect(document.paths['/api/admin/users/{userId}/debt-limit']).toBeDefined();
```

- [ ] **Step 2: Run OpenAPI test to verify it fails**

Run:

```bash
npm run test -- tests/openapi.test.ts
```

Expected: FAIL because the new paths are missing.

- [ ] **Step 3: Add OpenAPI schemas**

In `src/lib/openapi.ts`, near other shared schemas, add:

```ts
const debtSummarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['userId', 'balanceCents', 'limitCents', 'currency', 'isDebtBlocked', 'openDebtCount'],
  properties: {
    userId: { type: 'string' },
    balanceCents: { type: 'integer' },
    limitCents: { type: 'integer' },
    currency: { type: 'string', enum: ['ARS'] },
    isDebtBlocked: { type: 'boolean' },
    openDebtCount: { type: 'integer' }
  }
} as const;

const adminDebtRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'userId', 'sourceType', 'sourceId', 'amountCents', 'currency', 'status', 'reason', 'createdByUserId', 'createdAt', 'updatedAt', 'user', 'createdByUser'],
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    sourceType: { type: 'string', enum: ['ADMIN_ADJUSTMENT', 'BOOKING_COMMISSION'] },
    sourceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    amountCents: { type: 'integer' },
    currency: { type: 'string', enum: ['ARS'] },
    status: { type: 'string', enum: ['OPEN', 'PAID', 'CANCELLED'] },
    reason: { type: 'string' },
    createdByUserId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    user: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'email', 'displayName'],
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        displayName: { anyOf: [{ type: 'string' }, { type: 'null' }] }
      }
    },
    createdByUser: {
      anyOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'email', 'displayName'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            displayName: { anyOf: [{ type: 'string' }, { type: 'null' }] }
          }
        },
        { type: 'null' }
      ]
    }
  }
} as const;

const adminCreateDebtRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['userId', 'amountCents', 'currency', 'reason'],
  properties: {
    userId: { type: 'string' },
    amountCents: { type: 'integer', minimum: 1 },
    currency: { type: 'string', enum: ['ARS'] },
    reason: { type: 'string', minLength: 8, maxLength: 1000 }
  }
} as const;

const adminDebtLimitRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['limitCents', 'currency', 'reason'],
  properties: {
    limitCents: { type: 'integer', minimum: 0 },
    currency: { type: 'string', enum: ['ARS'] },
    reason: { type: 'string', minLength: 8, maxLength: 1000 }
  }
} as const;
```

- [ ] **Step 4: Add OpenAPI paths**

In the `paths` object in `src/lib/openapi.ts`, add:

```ts
'/api/me/debt-summary': {
  get: {
    tags: ['Debt'],
    summary: 'Get own debt summary',
    operationId: 'getOwnDebtSummary',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Current debt summary.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['summary'],
              properties: {
                summary: debtSummarySchema
              }
            }
          }
        }
      },
      '401': { description: 'Authentication required.' },
      '403': { description: 'Only active users can view debt summary.' }
    }
  }
},
'/api/admin/debts': {
  get: {
    tags: ['Admin'],
    summary: 'List debts for admin',
    operationId: 'listAdminDebts',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'userId', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['OPEN', 'PAID', 'CANCELLED'] } }
    ],
    responses: {
      '200': {
        description: 'Debt records.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['debts'],
              properties: {
                debts: { type: 'array', items: adminDebtRecordSchema }
              }
            }
          }
        }
      },
      '401': { description: 'Authentication required.' },
      '403': { description: 'Only active admins can manage debt.' }
    }
  },
  post: {
    tags: ['Admin'],
    summary: 'Create manual debt for admin',
    operationId: 'createAdminDebt',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: adminCreateDebtRequestSchema
        }
      }
    },
    responses: {
      '201': {
        description: 'Debt created.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['debt'],
              properties: {
                debt: adminDebtRecordSchema
              }
            }
          }
        }
      },
      '400': { description: 'Invalid debt payload.' },
      '401': { description: 'Authentication required.' },
      '403': { description: 'Only active admins can manage debt.' },
      '404': { description: 'User not found.' }
    }
  }
},
'/api/admin/users/{userId}/debt-limit': {
  put: {
    tags: ['Admin'],
    summary: 'Set user debt limit',
    operationId: 'setUserDebtLimit',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: adminDebtLimitRequestSchema
        }
      }
    },
    responses: {
      '200': { description: 'Debt limit updated.' },
      '400': { description: 'Invalid debt limit payload.' },
      '401': { description: 'Authentication required.' },
      '403': { description: 'Only active admins can manage debt.' },
      '404': { description: 'User not found.' }
    }
  }
},
```

Remove the leading `+` characters when applying the snippet.

- [ ] **Step 5: Run OpenAPI tests and regenerate JSON**

Run:

```bash
npm run test -- tests/openapi.test.ts
npm run openapi:generate
```

Expected: test PASS and `public/openapi.json` updated.

---

### Task 7: Phase Documentation and Full Verification

**Files:**
- Modify: `docs/planning/phases/etapa-06-deuda-reputacion-y-validaciones/README.md`

- [ ] **Step 1: Update phase 06 status**

Append to the phase README:

```md
## Subetapas

### Etapa 06.1 - Debt ledger y bloqueo por deuda

Objetivo:

- registrar deuda de comision;
- calcular balance pendiente;
- configurar limite de deuda por usuario;
- bloquear acciones sensibles cuando el usuario supera el limite;
- mantener audit log de acciones admin sobre deuda.

Criterio de salida:

- el usuario puede consultar su resumen de deuda;
- admin puede listar y crear deuda manual inicial;
- admin puede configurar limite de deuda;
- clientes bloqueados por deuda no pueden crear nuevos bookings;
- contractors bloqueados por deuda no pueden aceptar nuevos bookings;
- OpenAPI y tests unitarios cubren el contrato.

## Estado

- Etapa iniciada.
- Etapa 06.1 implementada a nivel API, datos, bloqueo server-side, audit log, OpenAPI y tests unitarios.
```

If the README already has `## Estado`, merge this text instead of duplicating the heading.

- [ ] **Step 2: Run focused verification**

Run:

```bash
npm run test -- tests/debts.test.ts tests/bookings.test.ts tests/permissions.test.ts tests/openapi.test.ts tests/database.test.ts
```

Expected: PASS, with `tests/database.test.ts` skipped if `DATABASE_URL` is absent.

- [ ] **Step 3: Run repository verification**

Run:

```bash
npm run lint
npm run typecheck
npm run test
```

Expected: PASS.

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git status --short
git diff --check
```

Expected: only etapa 06.1 files changed, and no whitespace errors.

---

## Self-Review

- Spec coverage: The plan covers durable debt storage, debt summary, limit configuration, admin debt creation/listing, booking blocks, OpenAPI, tests, and phase docs.
- Placeholder scan: No task contains TBD/TODO/fill-in instructions. The OpenAPI snippet explicitly says to remove diff markers because they are shown only for insertion context.
- Type consistency: Main names are `CommissionDebt`, `UserDebtLimit`, `getDebtSummaryForUser`, `getOwnDebtSummary`, `throwIfDebtBlocked`, `createDebtForAdmin`, `setDebtLimitForAdmin`, `canManageDebt`, and `debt-blocked`.
