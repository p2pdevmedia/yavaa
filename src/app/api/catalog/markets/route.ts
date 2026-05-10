import { jsonResponse } from '@/lib/http';
import { listPublicCatalogLocations, listPublicCatalogMarkets } from '@/lib/public-catalog';

export async function GET() {
  const markets = await listPublicCatalogMarkets();

  return jsonResponse(
    {
      markets,
      locations: await listPublicCatalogLocations(markets)
    },
    { status: 200 }
  );
}
