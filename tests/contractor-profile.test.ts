import { describe, expect, it, vi } from 'vitest';

import { ensureContractorRoleForUser } from '@/lib/contractor-profile';

describe('contractor profile helpers', () => {
  it('grants the contractor role idempotently when a user enters contractor mode', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'role_contractor' });
    const upsert = vi.fn().mockResolvedValue({
      userId: 'user_001',
      roleId: 'role_contractor'
    });

    await ensureContractorRoleForUser(
      {
        role: { findUnique },
        userRole: { upsert }
      } as never,
      'user_001'
    );

    expect(findUnique).toHaveBeenCalledWith({
      where: { slug: 'contractor' },
      select: { id: true }
    });
    expect(upsert).toHaveBeenCalledWith({
      where: {
        userId_roleId: {
          userId: 'user_001',
          roleId: 'role_contractor'
        }
      },
      update: {},
      create: {
        userId: 'user_001',
        roleId: 'role_contractor'
      }
    });
  });

  it('fails explicitly when the contractor role is missing', async () => {
    await expect(
      ensureContractorRoleForUser(
        {
          role: { findUnique: vi.fn().mockResolvedValue(null) },
          userRole: { upsert: vi.fn() }
        } as never,
        'user_001'
      )
    ).rejects.toThrow('contractor-role-not-found');
  });
});
