import { get, put } from '@vercel/blob';
import { UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/job-posts/photos/route';
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

const activeJefeAuth = {
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
    profile: {
      firstName: 'Martin',
      lastName: 'Ruiz',
      avatarUrl: null,
      phone: null,
      bio: null,
      onboardingRole: null,
      workerOnboardingCompletedAt: null,
      jefeOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z'),
      identityVerificationStatus: 'NOT_STARTED',
      dniNumber: null,
      workerCategories: [],
      workerHourlyRateCents: null,
      addressText: 'Salta Capital',
      locationLatitude: null,
      locationLongitude: null
    }
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

  return new NextRequest('http://localhost/api/job-posts/photos', {
    method: 'POST',
    body: formData
  });
}

function createReadRequest(pathname: string) {
  return new NextRequest(`http://localhost/api/job-posts/photos?pathname=${encodeURIComponent(pathname)}`);
}

describe('job post photos API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test');
  });

  it('requires authentication before uploading a private job photo', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      authenticated: false,
      configured: true,
      reason: 'missing-token',
      identity: null,
      appUser: null,
      matchedBy: null,
      permissionContext: null
    });

    const response = await POST(createUploadRequest(new File(['photo'], 'pared.jpg', { type: 'image/jpeg' })));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Iniciá sesión para subir fotos del trabajo.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('uploads job photos to Vercel Blob with private access only', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);
    putMock.mockResolvedValueOnce({
      url: 'https://store.private.blob.vercel-storage.com/jobs/user_001/photos/pared-final-random.jpg',
      downloadUrl: 'https://store.private.blob.vercel-storage.com/jobs/user_001/photos/pared-final-random.jpg?download=1',
      pathname: 'jobs/user_001/photos/pared-final-random.jpg',
      contentType: 'image/jpeg',
      contentDisposition: 'attachment; filename="pared-final-random.jpg"',
      etag: '"etag"'
    });

    const response = await POST(createUploadRequest(new File(['photo'], 'Pared Final.JPG', { type: 'image/jpeg' })));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      pathname: 'jobs/user_001/photos/pared-final-random.jpg',
      previewSrc: '/api/job-posts/photos?pathname=jobs%2Fuser_001%2Fphotos%2Fpared-final-random.jpg'
    });
    expect(putMock).toHaveBeenCalledWith(
      'jobs/user_001/photos/pared-final.jpg',
      expect.any(File),
      expect.objectContaining({
        access: 'private',
        addRandomSuffix: true,
        contentType: 'image/jpeg'
      })
    );
  });

  it('streams only private job photos owned by the current user', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);
    getMock.mockResolvedValueOnce({
      statusCode: 200,
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('photo'));
          controller.close();
        }
      }),
      headers: new Headers(),
      blob: {
        url: 'https://store.private.blob.vercel-storage.com/jobs/user_001/photos/pared.jpg',
        downloadUrl: 'https://store.private.blob.vercel-storage.com/jobs/user_001/photos/pared.jpg?download=1',
        pathname: 'jobs/user_001/photos/pared.jpg',
        contentType: 'image/jpeg',
        contentDisposition: 'attachment; filename="pared.jpg"',
        cacheControl: 'public, max-age=31536000',
        etag: '"etag"',
        size: 5,
        uploadedAt: new Date('2026-05-12T00:00:00.000Z')
      }
    });

    const response = await GET(createReadRequest('jobs/user_001/photos/pared.jpg'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(getMock).toHaveBeenCalledWith('jobs/user_001/photos/pared.jpg', {
      access: 'private'
    });
  });

  it('rejects private job photo reads outside the current user prefix', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);

    const response = await GET(createReadRequest('jobs/user_002/photos/pared.jpg'));

    expect(response.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });
});
