import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

import { hasVercelBlobEnv } from '@/lib/env';
import { authorizeJobPaymentAccess } from '@/lib/job-offers';
import {
  getJobPaymentReceiptPath,
  isAllowedJobPaymentReceiptContentType,
  jobPaymentReceiptMaxBytes,
  verifyJobPaymentReceiptMagicBytes
} from '@/lib/job-payment-receipts';
import { resolveRequestAuth } from '@/lib/request-auth';

type OfferPaymentReceiptsRouteContext = {
  params: Promise<{
    offerId: string;
  }>;
};

type ReceiptUploadResponse =
  | {
      ok: true;
      pathname: string;
    }
  | {
      ok: false;
      message: string;
    };

function jsonResponse(response: ReceiptUploadResponse, status: number): NextResponse<ReceiptUploadResponse> {
  return NextResponse.json(response, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
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

export async function POST(
  request: NextRequest,
  context: OfferPaymentReceiptsRouteContext
): Promise<NextResponse<ReceiptUploadResponse>> {
  const [{ offerId }, auth] = await Promise.all([context.params, resolveRequestAuth(request)]);
  const access = await authorizeJobPaymentAccess(auth, offerId);

  if (!access.ok) {
    return jsonResponse(
      {
        ok: false,
        message: access.message
      },
      access.status
    );
  }

  if (!hasVercelBlobEnv()) {
    return jsonResponse(
      {
        ok: false,
        message: 'El storage de comprobantes no está configurado.'
      },
      503
    );
  }

  const file = await readFormFile(request);

  if (!file || file.size <= 0) {
    return jsonResponse(
      {
        ok: false,
        message: 'Subí un comprobante de pago.'
      },
      422
    );
  }

  if (file.size > jobPaymentReceiptMaxBytes) {
    return jsonResponse(
      {
        ok: false,
        message: 'El comprobante debe pesar 8 MB o menos.'
      },
      422
    );
  }

  if (!isAllowedJobPaymentReceiptContentType(file.type)) {
    return jsonResponse(
      {
        ok: false,
        message: 'Subí un comprobante en imagen o PDF.'
      },
      422
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!verifyJobPaymentReceiptMagicBytes(file.type, bytes)) {
    return jsonResponse(
      {
        ok: false,
        message: 'Subí un comprobante válido en imagen o PDF.'
      },
      422
    );
  }

  const validatedFile = new File([bytes], file.name, {
    type: file.type
  });

  try {
    const blob = await put(getJobPaymentReceiptPath(access.userId, offerId, file.name, file.type), validatedFile, {
      access: 'private',
      addRandomSuffix: true,
      contentType: file.type
    });

    return jsonResponse(
      {
        ok: true,
        pathname: blob.pathname
      },
      200
    );
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: 'No pudimos subir el comprobante. Probá de nuevo.'
      },
      503
    );
  }
}
