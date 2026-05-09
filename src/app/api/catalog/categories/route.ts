import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { hasDatabaseEnv } from '@/lib/env';

export async function GET() {
  if (!hasDatabaseEnv()) {
    return jsonResponse(
      {
        categories: []
      },
      { status: 200 }
    );
  }

  const prisma = getPrismaClient();
  const categories = await prisma.category.findMany({
    where: {
      status: 'ACTIVE'
    },
    select: {
      id: true,
      slug: true,
      name: true,
      group: true,
      isInitial: true
    },
    orderBy: [
      { isInitial: 'desc' },
      { name: 'asc' }
    ]
  });

  return jsonResponse(
    {
      categories
    },
    { status: 200 }
  );
}
