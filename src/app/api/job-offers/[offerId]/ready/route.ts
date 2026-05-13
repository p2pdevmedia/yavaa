import { NextRequest, NextResponse } from 'next/server';

import { markJobOfferReady } from '@/lib/job-offers';
import { resolveRequestAuth } from '@/lib/request-auth';

type JobOfferReadyRouteContext = {
  params: Promise<{
    offerId: string;
  }>;
};

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

export async function POST(request: NextRequest, context: JobOfferReadyRouteContext): Promise<NextResponse> {
  const [{ offerId }, auth] = await Promise.all([context.params, resolveRequestAuth(request)]);
  const result = await markJobOfferReady(auth, offerId);

  if (!result.ok) {
    return errorResponse(result);
  }

  return jsonResponse(
    {
      ok: true,
      jobPost: result.jobPost
    },
    result.status
  );
}
