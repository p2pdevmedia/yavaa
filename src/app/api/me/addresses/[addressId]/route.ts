import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { jsonResponse } from '@/lib/http';
import { canManageAddress } from '@/lib/permissions';
import { getPrismaClient } from '@/lib/prisma';
import { resolveAppUser } from '@/lib/app-user';
import { resolveRequestAuth } from '@/lib/request-auth';

const addressPatchSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  line1: z.string().trim().min(1).max(180).optional(),
  line2: z.string().trim().max(180).nullable().optional(),
  city: z.string().trim().min(1).max(120).optional(),
  province: z.string().trim().min(1).max(120).optional(),
  postalCode: z.string().trim().max(30).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  type: z.enum(['HOME', 'WORK', 'OTHER']).optional(),
  isDefault: z.boolean().optional(),
  marketId: z.string().uuid().nullable().optional()
});

function prismaErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ addressId: string }> }
) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageAddress(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only update your own addresses while active.'
      },
      { status: 403 }
    );
  }

  const parsedBody = addressPatchSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedBody.error.flatten()
      },
      { status: 400 }
    );
  }

  const { addressId } = await context.params;
  const prisma = getPrismaClient();
  const appUser = auth.appUser;
  const existingAddress = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId: appUser.id
    },
    select: {
      id: true
    }
  });

  if (!existingAddress) {
    return jsonResponse(
      {
        error: 'address-not-found',
        message: 'Address not found.'
      },
      { status: 404 }
    );
  }

  const data = parsedBody.data;

  await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: {
          userId: appUser.id,
          NOT: {
            id: addressId
          }
        },
        data: {
          isDefault: false
        }
      });
    }

    await tx.address.update({
      where: {
        id: addressId
      },
      data
    });
  });

  await recordAuditLog({
    actorUserId: appUser.id,
    action: 'address.updated',
    entityType: 'address',
    entityId: addressId,
    metadata: {
      updatedFields: Object.keys(data)
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
    { status: 200 }
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ addressId: string }> }
) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageAddress(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only delete your own addresses while active.'
      },
      { status: 403 }
    );
  }

  const { addressId } = await context.params;
  const prisma = getPrismaClient();
  const appUser = auth.appUser;
  const existingAddress = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId: appUser.id
    },
    select: {
      id: true
    }
  });

  if (!existingAddress) {
    return jsonResponse(
      {
        error: 'address-not-found',
        message: 'Address not found.'
      },
      { status: 404 }
    );
  }

  try {
    await prisma.address.delete({
      where: {
        id: addressId
      }
    });
  } catch (error) {
    if (prismaErrorCode(error) === 'P2003') {
      return jsonResponse(
        {
          error: 'address-in-use',
          message: 'This address is linked to existing work and cannot be deleted.'
        },
        { status: 409 }
      );
    }

    throw error;
  }

  await recordAuditLog({
    actorUserId: appUser.id,
    action: 'address.deleted',
    entityType: 'address',
    entityId: addressId,
    metadata: {}
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
    { status: 200 }
  );
}
