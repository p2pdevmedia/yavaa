import { NextRequest, NextResponse } from 'next/server';

import { acceptJobOffer, rejectJobOffer } from '@/lib/job-offers';
import { resolveRequestAuth } from '@/lib/request-auth';

type JobOfferRouteContext = {
  params: Promise<{
    offerId: string;
  }>;
};

type OfferAction = 'accept' | 'reject';

type JsonParseResult =
  | {
      ok: true;
      body: unknown;
    }
  | {
      ok: false;
    };

async function readJson(request: NextRequest): Promise<JsonParseResult> {
  try {
    return {
      ok: true,
      body: await request.json()
    };
  } catch {
    return {
      ok: false
    };
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

function parseOfferAction(body: unknown): OfferAction | null {
  if (!body || typeof body !== 'object' || !('action' in body)) {
    return null;
  }

  const action = body.action;

  return action === 'accept' || action === 'reject' ? action : null;
}

export async function PATCH(request: NextRequest, context: JobOfferRouteContext): Promise<NextResponse> {
  const [{ offerId }, auth, json] = await Promise.all([
    context.params,
    resolveRequestAuth(request),
    readJson(request)
  ]);

  if (!json.ok) {
    return jsonResponse(
      {
        ok: false,
        message: 'El cuerpo del pedido no es JSON válido.'
      },
      400
    );
  }

  const action = parseOfferAction(json.body);

  if (!action) {
    return jsonResponse(
      {
        ok: false,
        message: 'Elegí una acción válida para la oferta.'
      },
      422
    );
  }

  const result = action === 'accept' ? await acceptJobOffer(auth, offerId) : await rejectJobOffer(auth, offerId);

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
