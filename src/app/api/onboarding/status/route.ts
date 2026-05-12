import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/http';
import { getOnboardingStatus } from '@/lib/onboarding-status';
import { resolveRequestAuth } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);
  const status = getOnboardingStatus(auth);

  return jsonResponse(status, {
    status: auth.authenticated ? 200 : 401
  });
}
