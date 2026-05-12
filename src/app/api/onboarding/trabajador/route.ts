import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/http';
import { completeWorkerOnboarding } from '@/lib/onboarding-service';
import { resolveRequestAuth } from '@/lib/request-auth';

export async function POST(request: NextRequest) {
  const auth = await resolveRequestAuth(request);
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: 'El cuerpo del pedido no es JSON válido.'
      },
      {
        status: 400
      }
    );
  }

  const result = await completeWorkerOnboarding(auth, body);

  if (!result.ok) {
    return jsonResponse(
      {
        ok: false,
        message: result.message,
        ...('fieldErrors' in result ? { fieldErrors: result.fieldErrors } : {})
      },
      {
        status: result.status
      }
    );
  }

  return jsonResponse(
    {
      ok: true,
      nextPath: result.nextPath
    },
    {
      status: result.status
    }
  );
}
