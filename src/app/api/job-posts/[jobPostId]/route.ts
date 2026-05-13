import { NextRequest, NextResponse } from 'next/server';

import {
  serializeJobPost,
  updateAuthenticatedClientJobPost,
  type UpdateJobPostResult
} from '@/lib/job-posts';
import { resolveRequestAuth } from '@/lib/request-auth';

type JobPostRouteContext = {
  params: Promise<{
    jobPostId: string;
  }>;
};

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

export async function PATCH(request: NextRequest, context: JobPostRouteContext): Promise<NextResponse> {
  const [{ jobPostId }, auth, body] = await Promise.all([
    context.params,
    resolveRequestAuth(request),
    readJson(request)
  ]);

  if (body === null) {
    return jsonResponse(
      {
        ok: false,
        message: 'El cuerpo del pedido no es JSON válido.'
      },
      400
    );
  }

  const result: UpdateJobPostResult = await updateAuthenticatedClientJobPost(auth, jobPostId, body);

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
      jobPost: serializeJobPost(result.jobPost)
    },
    result.status
  );
}
