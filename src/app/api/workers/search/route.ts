import { NextRequest, NextResponse } from 'next/server';

import { resolveRequestAuth } from '@/lib/request-auth';
import { searchWorkers } from '@/lib/worker-search';

function jsonResponse<TBody>(body: TBody, status: number): NextResponse<TBody> {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const result = await searchWorkers(await resolveRequestAuth(request), {
    category: request.nextUrl.searchParams.get('category'),
    q: request.nextUrl.searchParams.get('q')
  });

  if (!result.ok) {
    return jsonResponse(
      {
        ok: false,
        message: result.message
      },
      result.status
    );
  }

  return jsonResponse(
    {
      ok: true,
      workers: result.workers
    },
    result.status
  );
}
