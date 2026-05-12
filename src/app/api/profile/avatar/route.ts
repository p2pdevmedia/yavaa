import { get, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

import { hasVercelBlobEnv } from '@/lib/env';
import {
  buildProfileAvatarBlobPath,
  getPrivateProfileAvatarSrc,
  isAllowedProfileAvatarContentType,
  isProfileAvatarBlobPathForUser,
  profileAvatarMaxBytes
} from '@/lib/profile-avatar';
import { resolveRequestAuth, type RequestAuthState } from '@/lib/request-auth';

type AvatarUploadResponse =
  | {
      ok: true;
      pathname: string;
      previewSrc: string;
    }
  | {
      ok: false;
      message: string;
    };

function jsonResponse(response: AvatarUploadResponse, status: number): NextResponse<AvatarUploadResponse> {
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
      response: NextResponse<AvatarUploadResponse>;
    } {
  if (!auth.authenticated) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          message: 'Iniciá sesión para subir tu foto.'
        },
        401
      )
    };
  }

  if (!auth.appUser || !auth.permissionContext) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          message: 'No pudimos encontrar tu usuario de Yavaa.'
        },
        403
      )
    };
  }

  if (auth.permissionContext.status !== 'ACTIVE') {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          message: 'Tu cuenta no está activa.'
        },
        403
      )
    };
  }

  return {
    ok: true,
    userId: auth.appUser.id
  };
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

export async function POST(request: NextRequest): Promise<NextResponse<AvatarUploadResponse>> {
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
        message: 'Subí una foto para continuar.'
      },
      422
    );
  }

  if (file.size > profileAvatarMaxBytes) {
    return jsonResponse(
      {
        ok: false,
        message: 'La foto debe pesar 5 MB o menos.'
      },
      422
    );
  }

  if (!isAllowedProfileAvatarContentType(file.type)) {
    return jsonResponse(
      {
        ok: false,
        message: 'Subí una foto JPG, PNG o WebP.'
      },
      422
    );
  }

  try {
    const blob = await put(buildProfileAvatarBlobPath(auth.userId, file.name, file.type), file, {
      access: 'private',
      addRandomSuffix: true,
      contentType: file.type
    });

    return jsonResponse(
      {
        ok: true,
        pathname: blob.pathname,
        previewSrc: getPrivateProfileAvatarSrc(blob.pathname)
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

  if (!isProfileAvatarBlobPathForUser(pathname, auth.userId)) {
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
