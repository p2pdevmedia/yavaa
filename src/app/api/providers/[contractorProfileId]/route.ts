import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/http';
import { getPublicProviderProfile } from '@/lib/public-discovery';

type RouteContext = {
  params: Promise<{
    contractorProfileId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { contractorProfileId } = await params;
  const provider = await getPublicProviderProfile(contractorProfileId);

  if (!provider) {
    return jsonResponse(
      {
        provider: null
      },
      { status: 404 }
    );
  }

  return jsonResponse(
    {
      provider
    },
    { status: 200 }
  );
}
