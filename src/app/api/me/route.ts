import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/http';
import { resolveRequestAuth } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  return jsonResponse(auth, {
    status: auth.authenticated ? 200 : 401
  });
}
