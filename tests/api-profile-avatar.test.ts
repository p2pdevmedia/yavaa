import { get, put } from '@vercel/blob';
import { UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/profile/avatar/route';
import { resolveRequestAuth } from '@/lib/request-auth';
import type { RequestAuthState } from '@/lib/request-auth';

vi.mock('@vercel/blob', () => ({
  get: vi.fn(),
  put: vi.fn()
}));

vi.mock('@/lib/request-auth', () => ({
  resolveRequestAuth: vi.fn()
}));

const getMock = vi.mocked(get);
const putMock = vi.mocked(put);
const resolveRequestAuthMock = vi.mocked(resolveRequestAuth);

const activeAuth = {
  authenticated: true,
  configured: true,
  reason: null,
  identity: {
    id: 'auth_001',
    email: 'jefe@yavaa.test'
  },
  matchedBy: 'supabase_auth_id',
  appUser: {
    id: 'user_001',
    email: 'jefe@yavaa.test',
    supabaseAuthId: 'auth_001',
    displayName: null,
    status: UserStatus.ACTIVE,
    roles: ['jefe'],
    profile: null
  },
  permissionContext: {
    userId: 'user_001',
    status: UserStatus.ACTIVE,
    roles: ['jefe']
  }
} satisfies RequestAuthState;

function createUploadRequest(file: File | string) {
  const formData = new FormData();
  formData.set('file', file);

  return new NextRequest('http://localhost/api/profile/avatar', {
    method: 'POST',
    body: formData
  });
}

function createReadRequest(pathname: string) {
  return new NextRequest(`http://localhost/api/profile/avatar?pathname=${encodeURIComponent(pathname)}`);
}

describe('profile avatar API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test');
  });

  it('requires authentication before uploading a private profile photo', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      authenticated: false,
      configured: true,
      reason: 'missing-token',
      identity: null,
      appUser: null,
      matchedBy: null,
      permissionContext: null
    });

    const response = await POST(createUploadRequest(new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Iniciá sesión para subir tu foto.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('rejects non-image profile photo uploads before touching Vercel Blob', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeAuth);

    const response = await POST(createUploadRequest(new File(['avatar'], 'avatar.txt', { type: 'text/plain' })));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Subí una foto JPG, PNG o WebP.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('uploads profile photos to Vercel Blob with private access only', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeAuth);
    putMock.mockResolvedValueOnce({
      url: 'https://store.private.blob.vercel-storage.com/profiles/user_001/avatars/avatar-random.jpg',
      downloadUrl: 'https://store.private.blob.vercel-storage.com/profiles/user_001/avatars/avatar-random.jpg?download=1',
      pathname: 'profiles/user_001/avatars/avatar-random.jpg',
      contentType: 'image/jpeg',
      contentDisposition: 'attachment; filename="avatar-random.jpg"',
      etag: '"etag"'
    });

    const file = new File(['avatar'], 'Avatar Final.JPG', { type: 'image/jpeg' });
    const response = await POST(createUploadRequest(file));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      pathname: 'profiles/user_001/avatars/avatar-random.jpg',
      previewSrc: '/api/profile/avatar?pathname=profiles%2Fuser_001%2Favatars%2Favatar-random.jpg'
    });
    expect(putMock).toHaveBeenCalledWith(
      'profiles/user_001/avatars/avatar-final.jpg',
      expect.any(File),
      expect.objectContaining({
        access: 'private',
        addRandomSuffix: true,
        contentType: 'image/jpeg'
      })
    );
  });

  it('streams only the current user private avatar blobs', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeAuth);
    getMock.mockResolvedValueOnce({
      statusCode: 200,
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('avatar'));
          controller.close();
        }
      }),
      headers: new Headers(),
      blob: {
        url: 'https://store.private.blob.vercel-storage.com/profiles/user_001/avatars/avatar.jpg',
        downloadUrl: 'https://store.private.blob.vercel-storage.com/profiles/user_001/avatars/avatar.jpg?download=1',
        pathname: 'profiles/user_001/avatars/avatar.jpg',
        contentType: 'image/jpeg',
        contentDisposition: 'attachment; filename="avatar.jpg"',
        cacheControl: 'public, max-age=31536000',
        etag: '"etag"',
        size: 6,
        uploadedAt: new Date('2026-05-12T00:00:00.000Z')
      }
    });

    const response = await GET(createReadRequest('profiles/user_001/avatars/avatar.jpg'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(getMock).toHaveBeenCalledWith('profiles/user_001/avatars/avatar.jpg', {
      access: 'private'
    });
  });

  it('rejects private avatar reads outside the current user prefix', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeAuth);

    const response = await GET(createReadRequest('profiles/user_002/avatars/avatar.jpg'));

    expect(response.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });
});
