import { CategoryStatus, UserStatus, type PrismaClient } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  deleteCategoryForAdmin,
  listCategoriesForAdmin,
  updateCategoryForAdmin,
  upsertCategoryForAdmin,
  type AdminCategoryActor
} from '@/lib/admin-categories';
import { recordAuditLog } from '@/lib/audit';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const activeAdmin: AdminCategoryActor = {
  userId: 'admin_001',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

const activeSupport: AdminCategoryActor = {
  userId: 'support_001',
  status: UserStatus.ACTIVE,
  roles: ['support']
};

function buildPrismaMock(overrides: Partial<PrismaClient> = {}): PrismaClient {
  return overrides as PrismaClient;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('admin category operations', () => {
  it('lists categories for active admins and filters by status', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'category_001',
        slug: 'home-services',
        name: 'Home Services',
        group: 'home services',
        status: CategoryStatus.ACTIVE,
        isInitial: true
      }
    ]);

    const categories = await listCategoriesForAdmin(
      buildPrismaMock({
        category: {
          findMany
        }
      } as unknown as PrismaClient),
      activeAdmin,
      {
        status: CategoryStatus.ACTIVE
      }
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: CategoryStatus.ACTIVE
      },
      select: expect.any(Object),
      orderBy: [
        { isInitial: 'desc' },
        { name: 'asc' }
      ]
    });
    expect(categories).toEqual([
      {
        id: 'category_001',
        slug: 'home-services',
        name: 'Home Services',
        group: 'home services',
        status: CategoryStatus.ACTIVE,
        isInitial: true
      }
    ]);
  });

  it('blocks non-admin operational roles from listing categories', async () => {
    await expect(
      listCategoriesForAdmin(buildPrismaMock(), activeSupport, {})
    ).rejects.toThrow('forbidden');
  });

  it('creates new categories as pending review by default and records audit', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const upsert = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care',
      name: 'Pet Care',
      group: 'home services',
      status: CategoryStatus.PENDING_REVIEW,
      isInitial: false
    });

    const category = await upsertCategoryForAdmin(
      buildPrismaMock({
        category: {
          findUnique,
          upsert
        }
      } as unknown as PrismaClient),
      activeAdmin,
      {
        slug: 'pet-care',
        name: 'Pet Care',
        group: 'home services'
      }
    );

    expect(upsert).toHaveBeenCalledWith({
      where: { slug: 'pet-care' },
      update: {
        name: 'Pet Care',
        group: 'home services',
        status: CategoryStatus.PENDING_REVIEW
      },
      create: {
        slug: 'pet-care',
        name: 'Pet Care',
        group: 'home services',
        status: CategoryStatus.PENDING_REVIEW,
        isInitial: false
      },
      select: expect.any(Object)
    });
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'category.created',
      entityType: 'category',
      entityId: 'category_002',
      metadata: {
        slug: 'pet-care',
        previousStatus: null,
        nextStatus: CategoryStatus.PENDING_REVIEW,
        isInitial: false
      }
    });
    expect(category.status).toBe(CategoryStatus.PENDING_REVIEW);
  });

  it('updates non-initial categories and records previous and next state', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care',
      status: CategoryStatus.PENDING_REVIEW,
      isInitial: false
    });
    const upsert = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care',
      name: 'Pet Care',
      group: 'home services',
      status: CategoryStatus.ACTIVE,
      isInitial: false
    });

    await upsertCategoryForAdmin(
      buildPrismaMock({
        category: {
          findUnique,
          upsert
        }
      } as unknown as PrismaClient),
      activeAdmin,
      {
        slug: 'pet-care',
        name: 'Pet Care',
        group: 'home services',
        status: CategoryStatus.ACTIVE
      }
    );

    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'category.updated',
      entityType: 'category',
      entityId: 'category_002',
      metadata: {
        slug: 'pet-care',
        previousStatus: CategoryStatus.PENDING_REVIEW,
        nextStatus: CategoryStatus.ACTIVE,
        isInitial: false
      }
    });
  });

  it('updates categories by id and records an audit log with previous values', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care',
      name: 'Pet Care',
      group: 'home services',
      status: CategoryStatus.PENDING_REVIEW,
      isInitial: false
    });
    const update = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care-pro',
      name: 'Pet Care Pro',
      group: 'wellness',
      status: CategoryStatus.ACTIVE,
      isInitial: false
    });

    const category = await updateCategoryForAdmin(
      buildPrismaMock({
        category: {
          findUnique,
          update
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'category_002',
      {
        slug: 'pet-care-pro',
        name: 'Pet Care Pro',
        group: 'wellness',
        status: CategoryStatus.ACTIVE
      }
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'category_002' },
      data: {
        slug: 'pet-care-pro',
        name: 'Pet Care Pro',
        group: 'wellness',
        status: CategoryStatus.ACTIVE
      },
      select: expect.any(Object)
    });
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'category.updated',
      entityType: 'category',
      entityId: 'category_002',
      metadata: {
        previousSlug: 'pet-care',
        nextSlug: 'pet-care-pro',
        previousStatus: CategoryStatus.PENDING_REVIEW,
        nextStatus: CategoryStatus.ACTIVE,
        isInitial: false
      }
    });
    expect(category.slug).toBe('pet-care-pro');
  });

  it('prevents pausing initial categories', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'category_001',
      slug: 'home-services',
      status: CategoryStatus.ACTIVE,
      isInitial: true
    });

    await expect(
      upsertCategoryForAdmin(
        buildPrismaMock({
          category: {
            findUnique
          }
        } as unknown as PrismaClient),
        activeAdmin,
        {
          slug: 'home-services',
          name: 'Home Services',
          group: 'home services',
          status: CategoryStatus.INACTIVE
        }
      )
    ).rejects.toThrow('initial-category-pause-forbidden');
  });

  it('deletes categories that have no durable references and records audit', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care',
      status: CategoryStatus.INACTIVE,
      isInitial: false,
      _count: {
        contractorCategories: 0,
        bookings: 0,
        emergencyRequests: 0
      }
    });
    const deleteCategory = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care',
      name: 'Pet Care',
      group: 'home services',
      status: CategoryStatus.INACTIVE,
      isInitial: false
    });

    const category = await deleteCategoryForAdmin(
      buildPrismaMock({
        category: {
          findUnique,
          delete: deleteCategory
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'category_002'
    );

    expect(deleteCategory).toHaveBeenCalledWith({
      where: { id: 'category_002' },
      select: expect.any(Object)
    });
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'category.deleted',
      entityType: 'category',
      entityId: 'category_002',
      metadata: {
        slug: 'pet-care',
        status: CategoryStatus.INACTIVE,
        isInitial: false
      }
    });
    expect(category.id).toBe('category_002');
  });

  it('prevents deleting initial categories', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'category_001',
      slug: 'home-services',
      status: CategoryStatus.ACTIVE,
      isInitial: true,
      _count: {
        contractorCategories: 0,
        bookings: 0,
        emergencyRequests: 0
      }
    });

    await expect(
      deleteCategoryForAdmin(
        buildPrismaMock({
          category: {
            findUnique
          }
        } as unknown as PrismaClient),
        activeAdmin,
        'category_001'
      )
    ).rejects.toThrow('initial-category-delete-forbidden');
  });

  it('prevents deleting categories referenced by marketplace activity', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'category_002',
      slug: 'pet-care',
      status: CategoryStatus.ACTIVE,
      isInitial: false,
      _count: {
        contractorCategories: 1,
        bookings: 0,
        emergencyRequests: 0
      }
    });

    await expect(
      deleteCategoryForAdmin(
        buildPrismaMock({
          category: {
            findUnique
          }
        } as unknown as PrismaClient),
        activeAdmin,
        'category_002'
      )
    ).rejects.toThrow('category-in-use');
  });
});
