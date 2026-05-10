import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { resolveAddressMarketId } from '@/lib/address-markets';
import { recordAuditLog } from '@/lib/audit';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canManageAddress } from '@/lib/permissions';
import { resolveRequestAuth } from '@/lib/request-auth';
import { resolveAppUser } from '@/lib/app-user';

const addressSchema = z.object({
  label: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(180),
  line2: z.string().trim().max(180).nullable().optional(),
  city: z.string().trim().min(1).max(120),
  province: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().max(30).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  type: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
  isDefault: z.boolean().optional().default(false),
  marketId: z.string().uuid().nullable().optional()
});

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageAddress(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only read your own addresses while active.'
      },
      { status: 403 }
    );
  }

  return jsonResponse(
    {
      addresses: auth.appUser.addresses
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageAddress(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only create your own addresses while active.'
      },
      { status: 403 }
    );
  }

  const appUser = auth.appUser;
  const parsedBody = addressSchema.safeParse(await request.json());

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
  const marketId = await resolveAddressMarketId(prisma, data);

  const createdAddress = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: {
          userId: appUser.id
        },
        data: {
          isDefault: false
        }
      });
    }

    return tx.address.create({
      data: {
        userId: appUser.id,
        marketId: marketId ?? null,
        label: data.label,
        line1: data.line1,
        line2: data.line2 ?? null,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode ?? null,
        notes: data.notes ?? null,
        type: data.type,
        isDefault: data.isDefault
      },
      select: {
        id: true
      }
    });
  });

  await recordAuditLog({
    actorUserId: appUser.id,
    action: 'address.created',
    entityType: 'address',
    entityId: createdAddress.id,
    metadata: {
      isDefault: data.isDefault,
      type: data.type
    }
  });

  const refreshed = await resolveAppUser(auth.identity);

  return jsonResponse(
    {
      authenticated: true,
      configured: refreshed.configured,
      matchedBy: refreshed.matchedBy,
      identity: refreshed.identity,
      appUser: refreshed.user,
      permissionContext: refreshed.permissionContext
    },
    { status: 201 }
  );
}
