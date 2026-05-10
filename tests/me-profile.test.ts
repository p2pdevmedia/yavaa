import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from '@/app/api/me/profile/route';
import { recordAuditLog } from '@/lib/audit';
import { resolveAppUser } from '@/lib/app-user';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

vi.mock('@/lib/app-user', () => ({
  resolveAppUser: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

vi.mock('@/lib/request-auth', () => ({
  resolveRequestAuth: vi.fn()
}));

const mockedRecordAuditLog = vi.mocked(recordAuditLog);
const mockedResolveAppUser = vi.mocked(resolveAppUser);
const mockedGetPrismaClient = vi.mocked(getPrismaClient);
const mockedResolveRequestAuth = vi.mocked(resolveRequestAuth);

afterEach(() => {
  vi.resetAllMocks();
});

describe('me profile API', () => {
  it('updates the linked active app user even when the Supabase auth id differs from the app user id', async () => {
    const appUser = {
      id: 'user_001',
      email: 'client@yavaa.test',
      supabaseAuthId: 'auth_001',
      displayName: 'Client User',
      status: UserStatus.ACTIVE,
      roles: ['client'],
      profile: null,
      addresses: [],
      contractorProfile: null
    };

    mockedResolveRequestAuth.mockResolvedValue({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_001',
        email: 'client@yavaa.test'
      },
      appUser,
      matchedBy: 'supabase_auth_id',
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client']
      }
    } as never);

    mockedResolveAppUser.mockResolvedValue({
      configured: true,
      matchedBy: 'supabase_auth_id',
      identity: {
        id: 'auth_001',
        email: 'client@yavaa.test'
      },
      user: {
        ...appUser,
        displayName: 'Client Updated'
      },
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client']
      }
    } as never);

    const tx = {
      user: {
        update: vi.fn().mockResolvedValue({})
      },
      profile: {
        upsert: vi.fn().mockResolvedValue({})
      }
    };

    mockedGetPrismaClient.mockReturnValue({
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx))
    } as never);

    const response = await PATCH({
      json: vi.fn().mockResolvedValue({
        displayName: 'Client Updated',
        firstName: 'Client'
      })
    } as never);

    expect(response.status).toBe(200);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user_001' },
      data: { displayName: 'Client Updated' }
    });
    expect(tx.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user_001' },
      update: {
        firstName: 'Client',
        lastName: undefined,
        avatarUrl: undefined,
        phone: undefined,
        bio: undefined
      },
      create: {
        userId: 'user_001',
        firstName: 'Client',
        lastName: null,
        avatarUrl: null,
        phone: null,
        bio: null
      }
    });
    expect(mockedRecordAuditLog).toHaveBeenCalledWith({
      actorUserId: 'user_001',
      action: 'profile.updated',
      entityType: 'profile',
      entityId: 'user_001',
      metadata: {
        updatedFields: ['displayName', 'firstName']
      }
    });
  });
});
