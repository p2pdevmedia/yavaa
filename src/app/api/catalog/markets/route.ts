import { jsonResponse } from '@/lib/http';
import { listPublicCatalogMarkets } from '@/lib/public-catalog';

export async function GET() {
  return jsonResponse(
    {
      markets: await listPublicCatalogMarkets()
    },
    { status: 200 }
  );
}
