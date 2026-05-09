import { CategoryStatus, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { canManageCategoryCatalog, type PermissionContext } from '@/lib/permissions';

export type AdminCategoryActor = PermissionContext;

export const adminCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  group: z.string().trim().max(120).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_REVIEW']).optional()
});

export const adminCategoryListFiltersSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_REVIEW']).optional()
});

export type AdminCategorySummary = {
  id: string;
  slug: string;
  name: string;
  group: string | null;
  status: CategoryStatus;
  isInitial: boolean;
};

type CategoryRow = AdminCategorySummary;

const adminCategorySelect = {
  id: true,
  slug: true,
  name: true,
  group: true,
  status: true,
  isInitial: true
} as const;

function assertCanManageCategories(actor: AdminCategoryActor): void {
  if (!canManageCategoryCatalog(actor)) {
    throw new Error('forbidden');
  }
}

export async function listCategoriesForAdmin(
  prisma: PrismaClient,
  actor: AdminCategoryActor,
  filters: z.infer<typeof adminCategoryListFiltersSchema>
): Promise<AdminCategorySummary[]> {
  assertCanManageCategories(actor);

  const parsed = adminCategoryListFiltersSchema.parse(filters);
  const rows = (await prisma.category.findMany({
    where: parsed.status
      ? {
          status: parsed.status as CategoryStatus
        }
      : undefined,
    select: adminCategorySelect,
    orderBy: [
      { isInitial: 'desc' },
      { name: 'asc' }
    ]
  })) as CategoryRow[];

  return rows;
}

export async function upsertCategoryForAdmin(
  prisma: PrismaClient,
  actor: AdminCategoryActor,
  input: z.infer<typeof adminCategorySchema>
): Promise<AdminCategorySummary> {
  assertCanManageCategories(actor);

  const parsed = adminCategorySchema.parse(input);
  const nextStatus = (parsed.status ?? CategoryStatus.PENDING_REVIEW) as CategoryStatus;
  const existingCategory = await prisma.category.findUnique({
    where: {
      slug: parsed.slug
    },
    select: {
      id: true,
      slug: true,
      status: true,
      isInitial: true
    }
  });

  if (existingCategory?.isInitial && nextStatus === CategoryStatus.INACTIVE) {
    throw new Error('initial-category-pause-forbidden');
  }

  const category = (await prisma.category.upsert({
    where: {
      slug: parsed.slug
    },
    update: {
      name: parsed.name,
      group: parsed.group ?? null,
      status: nextStatus
    },
    create: {
      slug: parsed.slug,
      name: parsed.name,
      group: parsed.group ?? null,
      status: nextStatus,
      isInitial: false
    },
    select: adminCategorySelect
  })) as CategoryRow;

  await recordAuditLog({
    actorUserId: actor.userId,
    action: existingCategory ? 'category.updated' : 'category.created',
    entityType: 'category',
    entityId: category.id,
    metadata: {
      slug: category.slug,
      previousStatus: existingCategory?.status ?? null,
      nextStatus: category.status,
      isInitial: category.isInitial
    }
  });

  return category;
}
