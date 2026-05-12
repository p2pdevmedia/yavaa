import { get, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

import { hasVercelBlobEnv } from '@/lib/env';
import {
  buildJobPhotoBlobPath,
  getPrivateJobPhotoSrc,
  isAllowedJobPhotoContentType,
  isJobPhotoBlobPathForUser,
  jobPhotoMaxBytes
} from '@/lib/job-photos';
import { getReadyJefeMarketplaceAuth } from '@/lib/job-posts';
import { resolveRequestAuth, type RequestAuthState } from '@/lib/request-auth';

type JobPhotoUploadResponse =
  | {
      ok: true;
      pathname: string;
      previewSrc: string;
    }
  | {
      ok: false;
      message: string;
    };

function jsonResponse(response: JobPhotoUploadResponse, status: number): NextResponse<JobPhotoUploadResponse> {
  return NextResponse.json(response, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

function getReadyAuth(auth: RequestAuthState):
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      response: NextResponse<JobPhotoUploadResponse>;
    } {
  const readyAuth = getReadyJefeMarketplaceAuth(auth);

  if (!readyAuth.ok) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          message:
            readyAuth.status === 401 ? 'Iniciá sesión para subir fotos del trabajo.' : readyAuth.message
        },
        readyAuth.status
      )
    };
  }

  return readyAuth;
}

async function readFormFile(request: NextRequest): Promise<File | null> {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    return file instanceof File ? file : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<JobPhotoUploadResponse>> {
  const auth = getReadyAuth(await resolveRequestAuth(request));

  if (!auth.ok) {
    return auth.response;
  }

  if (!hasVercelBlobEnv()) {
    return jsonResponse(
      {
        ok: false,
        message: 'El storage de fotos no está configurado.'
      },
      503
    );
  }

  const file = await readFormFile(request);

  if (!file || file.size <= 0) {
    return jsonResponse(
      {
        ok: false,
        message: 'Subí una foto del trabajo.'
      },
      422
    );
  }

  if (file.size > jobPhotoMaxBytes) {
    return jsonResponse(
      {
        ok: false,
        message: 'Cada foto debe pesar 8 MB o menos.'
      },
      422
    );
  }

  if (!isAllowedJobPhotoContentType(file.type)) {
    return jsonResponse(
      {
        ok: false,
        message: 'Subí fotos JPG, PNG o WebP.'
      },
      422
    );
  }

  try {
    const blob = await put(buildJobPhotoBlobPath(auth.userId, file.name, file.type), file, {
      access: 'private',
      addRandomSuffix: true,
      contentType: file.type
    });

    return jsonResponse(
      {
        ok: true,
        pathname: blob.pathname,
        previewSrc: getPrivateJobPhotoSrc(blob.pathname)
      },
      200
    );
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: 'No pudimos subir la foto. Probá de nuevo.'
      },
      503
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = getReadyAuth(await resolveRequestAuth(request));

  if (!auth.ok) {
    return auth.response;
  }

  if (!hasVercelBlobEnv()) {
    return new NextResponse('El storage de fotos no está configurado.', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const pathname = request.nextUrl.searchParams.get('pathname') ?? '';

  if (!isJobPhotoBlobPathForUser(pathname, auth.userId)) {
    return new NextResponse('No tenés permiso para ver esta foto.', {
      status: 403,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const result = await get(pathname, {
    access: 'private'
  });

  if (!result || result.statusCode !== 200) {
    return new NextResponse('Foto no encontrada.', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      'Content-Type': result.blob.contentType,
      'Cache-Control': 'private, max-age=60',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
