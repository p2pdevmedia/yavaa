import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canManageOwnProfile } from '@/lib/permissions';
import { resolveRequestAuth } from '@/lib/request-auth';
import { resolveAppUser } from '@/lib/app-user';

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).nullable().optional(),
  firstName: z.string().trim().min(1).max(120).nullable().optional(),
  lastName: z.string().trim().min(1).max(120).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  phone: z.string().trim().min(5).max(40).nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional()
});

function isMutableValue<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export async function PATCH(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageOwnProfile(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only update your own profile while active.'
      },
      { status: 403 }
    );
  }

  if (!auth.appUser) {
    return jsonResponse(
      {
        error: 'app-user-not-linked',
        message: 'The authenticated identity is not linked to a Yavaa user record.'
      },
      { status: 404 }
    );
  }

  const appUser = auth.appUser;
  const parsedBody = profileUpdateSchema.safeParse(await request.json());

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
  const profileData = parsedBody.data;

  await prisma.$transaction(async (tx) => {
    const userUpdate: {
      displayName?: string | null;
    } = {};

    if (isMutableValue(profileData.displayName)) {
      userUpdate.displayName = profileData.displayName;
    }

    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({
        where: {
          id: appUser.id
        },
        data: userUpdate
      });
    }

    await tx.profile.upsert({
      where: {
        userId: appUser.id
      },
      update: {
        firstName: isMutableValue(profileData.firstName) ? profileData.firstName : undefined,
        lastName: isMutableValue(profileData.lastName) ? profileData.lastName : undefined,
        avatarUrl: isMutableValue(profileData.avatarUrl) ? profileData.avatarUrl : undefined,
        phone: isMutableValue(profileData.phone) ? profileData.phone : undefined,
        bio: isMutableValue(profileData.bio) ? profileData.bio : undefined
      },
      create: {
        userId: appUser.id,
        firstName: profileData.firstName ?? null,
        lastName: profileData.lastName ?? null,
        avatarUrl: profileData.avatarUrl ?? null,
        phone: profileData.phone ?? null,
        bio: profileData.bio ?? null
      }
    });
  });

  await recordAuditLog({
    actorUserId: appUser.id,
    action: 'profile.updated',
    entityType: 'profile',
    entityId: appUser.id,
    metadata: {
      updatedFields: Object.keys(profileData)
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
