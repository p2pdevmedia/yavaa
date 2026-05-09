import { jsonResponse } from '@/lib/http';
import { listPublicCatalogCategories } from '@/lib/public-catalog';

export async function GET() {
  return jsonResponse(
    {
      categories: await listPublicCatalogCategories()
    },
    { status: 200 }
  );
}
