import { NextRequest, NextResponse } from 'next/server';

import { createJobPayment, listJobPayments } from '@/lib/job-offers';
import { resolveRequestAuth } from '@/lib/request-auth';

type OfferPaymentsRouteContext = {
  params: Promise<{
    offerId: string;
  }>;
};

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

function errorResponse(
  result:
    | {
        ok: false;
        status: 401 | 403 | 404 | 409;
        message: string;
      }
    | {
        ok: false;
        status: 422;
        message: string;
        fieldErrors: Partial<Record<string, string[]>>;
      }
) {
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

export async function GET(request: NextRequest, context: OfferPaymentsRouteContext): Promise<NextResponse> {
  const [{ offerId }, auth] = await Promise.all([context.params, resolveRequestAuth(request)]);
  const result = await listJobPayments(auth, offerId);

  if (!result.ok) {
    return errorResponse(result);
  }

  return jsonResponse(
    {
      ok: true,
      payments: result.payments
    },
    result.status
  );
}

export async function POST(request: NextRequest, context: OfferPaymentsRouteContext): Promise<NextResponse> {
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

  const result = await createJobPayment(auth, offerId, json.body);

  if (!result.ok) {
    return errorResponse(result);
  }

  return jsonResponse(
    {
      ok: true,
      payment: result.payment
    },
    result.status
  );
}
