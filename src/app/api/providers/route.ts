import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/http';
import { listPublicProviders } from '@/lib/public-discovery';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  return jsonResponse(
    await listPublicProviders({
      category: url.searchParams.get('category'),
      market: url.searchParams.get('market')
    }),
    { status: 200 }
  );
}
