import { afterEach, describe, expect, it, vi } from 'vitest';

import { ensureUserProfileModeRole } from '@/lib/profile-mode-selection';
import { getPrismaClient } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const getPrismaClientMock = vi.mocked(getPrismaClient);

afterEach(() => {
  vi.resetAllMocks();
});

describe('profile mode selection', () => {
  it('assigns the selected role to the active user when they choose a profile mode', async () => {
    const findUniqueOrThrow = vi.fn().mockResolvedValue({
      id: 'role_trabajador'
    });
    const upsert = vi.fn().mockResolvedValue({});

    getPrismaClientMock.mockReturnValue({
      role: {
        findUniqueOrThrow
      },
      userRole: {
        upsert
      }
    } as never);

    await ensureUserProfileModeRole('user_004', 'trabajador');

    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: {
        slug: 'trabajador'
      },
      select: {
        id: true
      }
    });
    expect(upsert).toHaveBeenCalledWith({
      where: {
        userId_roleId: {
          userId: 'user_004',
          roleId: 'role_trabajador'
        }
      },
      create: {
        userId: 'user_004',
        roleId: 'role_trabajador'
      },
      update: {}
    });
  });
});
