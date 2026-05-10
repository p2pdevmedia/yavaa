import { type NextRequest } from 'next/server';
import { get as getBlob } from '@vercel/blob';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canManageOwnProfile } from '@/lib/permissions';
import { uploadProfilePhotoToBlob, validateProfilePhotoFile } from '@/lib/profile-photo-storage';
import { resolveRequestAuth } from '@/lib/request-auth';
import { resolveAppUser } from '@/lib/app-user';

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).nullable().optional(),
  firstName: z.string().trim().min(1).max(120).nullable().optional(),
  lastName: z.string().trim().min(1).max(120).nullable().optional(),
  phone: z.string().trim().min(5).max(40).nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional()
});

function isMutableValue<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function formValueToNullableString(value: FormDataEntryValue | null): string | null | undefined {
  if (value === null || value instanceof File) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function parseProfileUpdateRequest(request: NextRequest): Promise<
  | {
      success: true;
      data: z.infer<typeof profileUpdateSchema>;
      avatarFile?: File;
    }
  | {
      success: false;
      issues: unknown;
    }
> {
  const contentType = (request as { headers?: Headers }).headers?.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    const parsedBody = profileUpdateSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return {
        success: false,
        issues: parsedBody.error.flatten()
      };
    }

    return {
      success: true,
      data: parsedBody.data
    };
  }

  const formData = await request.formData();
  const avatarValue = formData.get('avatarFile');
  const avatarFile = avatarValue instanceof File && avatarValue.size > 0 ? avatarValue : undefined;
  const parsedBody = profileUpdateSchema.safeParse({
    displayName: formValueToNullableString(formData.get('displayName')),
    firstName: formValueToNullableString(formData.get('firstName')),
    lastName: formValueToNullableString(formData.get('lastName')),
    phone: formValueToNullableString(formData.get('phone')),
    bio: formValueToNullableString(formData.get('bio'))
  });

  if (!parsedBody.success) {
    return {
      success: false,
      issues: parsedBody.error.flatten()
    };
  }

  if (avatarFile) {
    const photoIssue = validateProfilePhotoFile(avatarFile);

    if (photoIssue) {
      return {
        success: false,
        issues: {
          fieldErrors: {
            avatarFile: [photoIssue]
          },
          formErrors: []
        }
      };
    }
  }

  return {
    success: true,
    data: parsedBody.data,
    avatarFile
  };
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
  const parsedBody = await parseProfileUpdateRequest(request);

  if (!parsedBody.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedBody.issues
      },
      { status: 400 }
    );
  }

  const prisma = getPrismaClient();
  const profileData = parsedBody.data;
  const uploadedProfilePhoto = parsedBody.avatarFile
    ? await uploadProfilePhotoToBlob(appUser.id, parsedBody.avatarFile)
    : null;
  const avatarUrl = uploadedProfilePhoto?.storageUrl;

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
        avatarUrl,
        phone: isMutableValue(profileData.phone) ? profileData.phone : undefined,
        bio: isMutableValue(profileData.bio) ? profileData.bio : undefined
      },
      create: {
        userId: appUser.id,
        firstName: profileData.firstName ?? null,
        lastName: profileData.lastName ?? null,
        avatarUrl: avatarUrl ?? null,
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
      updatedFields: uploadedProfilePhoto ? [...Object.keys(profileData), 'avatarUrl'] : Object.keys(profileData)
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

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageOwnProfile(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only view your own profile photo while active.'
      },
      { status: 403 }
    );
  }

  const avatarUrl = auth.appUser.profile?.avatarUrl;

  if (!avatarUrl) {
    return jsonResponse(
      {
        error: 'profile-photo-not-found',
        message: 'The authenticated user does not have a profile photo.'
      },
      { status: 404 }
    );
  }

  const blob = await getBlob(avatarUrl, {
    access: 'private',
    ifNoneMatch: request.headers.get('if-none-match') ?? undefined
  });

  if (!blob) {
    return jsonResponse(
      {
        error: 'profile-photo-not-found',
        message: 'The stored profile photo could not be found.'
      },
      { status: 404 }
    );
  }

  if (blob.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: blob.blob.etag
      }
    });
  }

  return new Response(blob.stream, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=60',
      'Content-Type': blob.blob.contentType,
      ETag: blob.blob.etag
    }
  });
}
