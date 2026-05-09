import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { hasDatabaseEnv } from '@/lib/env';

export async function GET() {
  if (!hasDatabaseEnv()) {
    return jsonResponse(
      {
        markets: []
      },
      { status: 200 }
    );
  }

  const prisma = getPrismaClient();
  const markets = await prisma.market.findMany({
    select: {
      id: true,
      slug: true,
      country: true,
      province: true,
      city: true,
      isPrimary: true,
      workZones: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      }
    },
    orderBy: [
      { isPrimary: 'desc' },
      { city: 'asc' }
    ]
  });

  return jsonResponse(
    {
      markets
    },
    { status: 200 }
  );
}
