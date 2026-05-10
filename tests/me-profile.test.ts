import { UserStatus } from '@prisma/client';
import { get, put } from '@vercel/blob';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET, PATCH } from '@/app/api/me/profile/route';
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

vi.mock('@vercel/blob', () => ({
  get: vi.fn(),
  put: vi.fn().mockResolvedValue({
    url: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg'
  })
}));

const mockedRecordAuditLog = vi.mocked(recordAuditLog);
const mockedResolveAppUser = vi.mocked(resolveAppUser);
const mockedGetPrismaClient = vi.mocked(getPrismaClient);
const mockedResolveRequestAuth = vi.mocked(resolveRequestAuth);
const mockedGetBlob = vi.mocked(get);
const mockedPut = vi.mocked(put);

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

  it('uploads profile photos to private blob storage before saving the profile avatar', async () => {
    mockedPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg'
    } as never);

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
        profile: {
          firstName: 'Client',
          lastName: null,
          avatarUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
          phone: null,
          bio: null
        }
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

    const formData = new FormData();
    formData.set('firstName', 'Client');
    formData.set('avatarFile', new File(['photo'], 'Mi foto.JPG', { type: 'image/jpeg' }));

    const response = await PATCH({
      headers: new Headers({ 'content-type': 'multipart/form-data; boundary=test' }),
      formData: vi.fn().mockResolvedValue(formData)
    } as never);

    expect(response.status).toBe(200);
    expect(mockedPut).toHaveBeenCalledWith(expect.stringMatching(/^profiles\/user_001\/[0-9a-f-]{36}-mi-foto\.jpg$/), expect.any(File), {
      access: 'private'
    });
    expect(tx.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user_001' },
      update: {
        firstName: 'Client',
        lastName: undefined,
        avatarUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
        phone: undefined,
        bio: undefined
      },
      create: {
        userId: 'user_001',
        firstName: 'Client',
        lastName: null,
        avatarUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
        phone: null,
        bio: null
      }
    });
  });

  it('serves the authenticated user profile photo from private blob storage', async () => {
    const appUser = {
      id: 'user_001',
      email: 'client@yavaa.test',
      supabaseAuthId: 'auth_001',
      displayName: 'Client User',
      status: UserStatus.ACTIVE,
      roles: ['client'],
      profile: {
        firstName: 'Client',
        lastName: null,
        avatarUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
        phone: null,
        bio: null
      },
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
    mockedGetBlob.mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('photo'));
          controller.close();
        }
      }),
      headers: new Headers({ etag: 'photo-etag' }),
      blob: {
        url: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
        downloadUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg?download=1',
        pathname: 'profiles/user_001/avatar.jpg',
        contentDisposition: 'inline',
        cacheControl: 'public, max-age=0',
        uploadedAt: new Date('2026-05-10T00:00:00.000Z'),
        etag: 'photo-etag',
        contentType: 'image/jpeg',
        size: 5
      }
    } as never);

    const response = await GET({ headers: new Headers() } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(mockedGetBlob).toHaveBeenCalledWith('https://blob.vercel-storage.com/profiles/user_001/avatar.jpg', {
      access: 'private',
      ifNoneMatch: undefined
    });
  });
});
