import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canManageCategoryCatalog } from '@/lib/permissions';
import { resolveRequestAuth } from '@/lib/request-auth';
import { hasDatabaseEnv } from '@/lib/env';

const adminCategorySchema = z.object({
  slug: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  group: z.string().trim().max(120).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_REVIEW']).optional()
});

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !canManageCategoryCatalog(auth.permissionContext)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active admins can manage categories.'
      },
      { status: 403 }
    );
  }

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
    select: {
      id: true,
      slug: true,
      name: true,
      group: true,
      status: true,
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

export async function POST(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !canManageCategoryCatalog(auth.permissionContext)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active admins can create or edit categories.'
      },
      { status: 403 }
    );
  }

  const parsedBody = adminCategorySchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedBody.error.flatten()
      },
      { status: 400 }
    );
  }

  const prisma = getPrismaClient();
  const data = parsedBody.data;
  const category = await prisma.category.upsert({
    where: {
      slug: data.slug
    },
    update: {
      name: data.name,
      group: data.group ?? null,
      status: data.status ?? 'PENDING_REVIEW'
    },
    create: {
      slug: data.slug,
      name: data.name,
      group: data.group ?? null,
      status: data.status ?? 'PENDING_REVIEW',
      isInitial: false
    },
    select: {
      id: true,
      slug: true,
      name: true,
      group: true,
      status: true,
      isInitial: true
    }
  });

  await recordAuditLog({
    actorUserId: auth.permissionContext?.userId ?? null,
    action: 'category.upserted',
    entityType: 'category',
    entityId: category.id,
    metadata: {
      slug: category.slug,
      status: category.status
    }
  });

  return jsonResponse(
    {
      category
    },
    { status: 200 }
  );
}
