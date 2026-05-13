import { NextRequest, NextResponse } from 'next/server';

import { createJobOffer } from '@/lib/job-offers';
import { resolveRequestAuth } from '@/lib/request-auth';

async function readJson(request: NextRequest): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function jsonResponse<TBody>(body: TBody, status: number): NextResponse<TBody> {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await resolveRequestAuth(request);
  const body = await readJson(request);

  if (body === null) {
    return jsonResponse(
      {
        ok: false,
        message: 'El cuerpo del pedido no es JSON válido.'
      },
      400
    );
  }

  const result = await createJobOffer(auth, body);

  if (!result.ok) {
    const payload =
      result.status === 422
        ? {
            ok: false,
            message: result.message,
            fieldErrors: result.fieldErrors
          }
        : {
            ok: false,
            message: result.message
          };

    return jsonResponse(payload, result.status);
  }

  return jsonResponse(
    {
      ok: true,
      offer: result.offer
    },
    result.status
  );
}
