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

export const adminCategoryUpdateSchema = adminCategorySchema;

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

type CategoryWithReferencesRow = AdminCategorySummary & {
  _count: {
    contractorCategories: number;
    bookings: number;
    emergencyRequests: number;
  };
};

const adminCategorySelect = {
  id: true,
  slug: true,
  name: true,
  group: true,
  status: true,
  isInitial: true
} as const;

const adminCategoryWithReferencesSelect = {
  ...adminCategorySelect,
  _count: {
    select: {
      contractorCategories: true,
      bookings: true,
      emergencyRequests: true
    }
  }
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

export async function updateCategoryForAdmin(
  prisma: PrismaClient,
  actor: AdminCategoryActor,
  categoryId: string,
  input: z.infer<typeof adminCategoryUpdateSchema>
): Promise<AdminCategorySummary> {
  assertCanManageCategories(actor);

  const parsed = adminCategoryUpdateSchema.parse(input);
  const nextStatus = (parsed.status ?? CategoryStatus.PENDING_REVIEW) as CategoryStatus;
  const existingCategory = (await prisma.category.findUnique({
    where: {
      id: categoryId
    },
    select: adminCategorySelect
  })) as CategoryRow | null;

  if (!existingCategory) {
    throw new Error('category-not-found');
  }

  if (existingCategory.isInitial && nextStatus === CategoryStatus.INACTIVE) {
    throw new Error('initial-category-pause-forbidden');
  }

  const category = (await prisma.category.update({
    where: {
      id: categoryId
    },
    data: {
      slug: parsed.slug,
      name: parsed.name,
      group: parsed.group ?? null,
      status: nextStatus
    },
    select: adminCategorySelect
  })) as CategoryRow;

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'category.updated',
    entityType: 'category',
    entityId: category.id,
    metadata: {
      previousSlug: existingCategory.slug,
      nextSlug: category.slug,
      previousStatus: existingCategory.status,
      nextStatus: category.status,
      isInitial: category.isInitial
    }
  });

  return category;
}

export async function deleteCategoryForAdmin(
  prisma: PrismaClient,
  actor: AdminCategoryActor,
  categoryId: string
): Promise<AdminCategorySummary> {
  assertCanManageCategories(actor);

  const existingCategory = (await prisma.category.findUnique({
    where: {
      id: categoryId
    },
    select: adminCategoryWithReferencesSelect
  })) as CategoryWithReferencesRow | null;

  if (!existingCategory) {
    throw new Error('category-not-found');
  }

  if (existingCategory.isInitial) {
    throw new Error('initial-category-delete-forbidden');
  }

  const referenceCount =
    existingCategory._count.contractorCategories +
    existingCategory._count.bookings +
    existingCategory._count.emergencyRequests;

  if (referenceCount > 0) {
    throw new Error('category-in-use');
  }

  const category = (await prisma.category.delete({
    where: {
      id: categoryId
    },
    select: adminCategorySelect
  })) as CategoryRow;

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'category.deleted',
    entityType: 'category',
    entityId: category.id,
    metadata: {
      slug: category.slug,
      status: category.status,
      isInitial: category.isInitial
    }
  });

  return category;
}
