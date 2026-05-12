import {
  IdentityVerificationStatus,
  type OnboardingRole,
  type Prisma,
  type UserStatus
} from '@prisma/client';

import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';
import { appRoleSlugs, type AppRoleSlug, type PermissionContext } from '@/lib/permissions';

export type AppUserIdentity = {
  id: string;
  email: string | null;
};

export type AppUserProfile = {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  onboardingRole: OnboardingRole | null;
  workerOnboardingCompletedAt: Date | null;
  jefeOnboardingCompletedAt: Date | null;
  identityVerificationStatus: IdentityVerificationStatus;
  dniNumber: string | null;
  workerCategories: string[];
  workerHourlyRateCents: number | null;
  addressText: string | null;
  locationLatitude: string | null;
  locationLongitude: string | null;
};

export type AppUserSummary = {
  id: string;
  email: string;
  supabaseAuthId: string | null;
  displayName: string | null;
  status: UserStatus;
  roles: AppRoleSlug[];
  profile: AppUserProfile | null;
};

export type ResolvedAppUser = {
  configured: boolean;
  matchedBy: 'supabase_auth_id' | 'email' | null;
  identity: AppUserIdentity | null;
  user: AppUserSummary | null;
  permissionContext: PermissionContext | null;
};

type AppUserRecordQuery = {
  id: string;
  email: string;
  supabaseAuthId: string | null;
  displayName: string | null;
  status: UserStatus;
  profile: AppUserRecordProfile | null;
  roles: Array<{
    role: {
      slug: string;
      name: string;
    };
  }>;
};

type AppUserRecordProfile = Omit<AppUserProfile, 'locationLatitude' | 'locationLongitude'> & {
  locationLatitude?: Prisma.Decimal | string | null;
  locationLongitude?: Prisma.Decimal | string | null;
};

const appUserSelect = {
  id: true,
  email: true,
  supabaseAuthId: true,
  displayName: true,
  status: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
        avatarUrl: true,
        phone: true,
        bio: true,
        onboardingRole: true,
        workerOnboardingCompletedAt: true,
        jefeOnboardingCompletedAt: true,
        identityVerificationStatus: true,
        dniNumber: true,
        workerCategories: true,
        workerHourlyRateCents: true,
        addressText: true,
        locationLatitude: true,
        locationLongitude: true
    }
  },
  roles: {
    select: {
      role: {
        select: {
          slug: true,
          name: true
        }
      }
    }
  }
} satisfies Record<string, unknown>;

function isAppRoleSlug(role: string): role is AppRoleSlug {
  return (appRoleSlugs as ReadonlyArray<string>).includes(role);
}

function mapPermissionContext(user: AppUserSummary): PermissionContext {
  return {
    userId: user.id,
    status: user.status,
    roles: user.roles
  };
}

function mapAppUserProfile(profile: AppUserRecordProfile | null): AppUserProfile | null {
  if (!profile) {
    return null;
  }

  return {
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    phone: profile.phone ?? null,
    bio: profile.bio ?? null,
    onboardingRole: profile.onboardingRole ?? null,
    workerOnboardingCompletedAt: profile.workerOnboardingCompletedAt ?? null,
    jefeOnboardingCompletedAt: profile.jefeOnboardingCompletedAt ?? null,
    identityVerificationStatus: profile.identityVerificationStatus ?? IdentityVerificationStatus.NOT_STARTED,
    dniNumber: profile.dniNumber ?? null,
    workerCategories: profile.workerCategories ?? [],
    workerHourlyRateCents: profile.workerHourlyRateCents ?? null,
    addressText: profile.addressText ?? null,
    locationLatitude: profile.locationLatitude?.toString() ?? null,
    locationLongitude: profile.locationLongitude?.toString() ?? null
  };
}

function mapAppUserRecord(record: AppUserRecordQuery | null): AppUserSummary | null {
  if (!record) {
    return null;
  }

  const roles = record.roles
    .map((userRole) => userRole.role.slug)
    .filter((slug): slug is AppRoleSlug => isAppRoleSlug(slug));

  return {
    id: record.id,
    email: record.email,
    supabaseAuthId: record.supabaseAuthId,
    displayName: record.displayName,
    status: record.status,
    roles,
    profile: mapAppUserProfile(record.profile)
  };
}

export async function resolveAppUser(identity: AppUserIdentity): Promise<ResolvedAppUser> {
  if (!hasDatabaseEnv()) {
    return {
      configured: false,
      matchedBy: null,
      identity,
      user: null,
      permissionContext: null
    };
  }

  const prisma = getPrismaClient();
  const matchBySupabaseAuthId = await prisma.user.findFirst({
    where: { supabaseAuthId: identity.id },
    select: appUserSelect
  });

  if (matchBySupabaseAuthId) {
    const user = mapAppUserRecord(matchBySupabaseAuthId);

    return {
      configured: true,
      matchedBy: 'supabase_auth_id',
      identity,
      user,
      permissionContext: user ? mapPermissionContext(user) : null
    };
  }

  if (!identity.email) {
    return {
      configured: true,
      matchedBy: null,
      identity,
      user: null,
      permissionContext: null
    };
  }

  const matchByEmail = await prisma.user.findFirst({
    where: { email: identity.email },
    select: appUserSelect
  });

  const user = mapAppUserRecord(matchByEmail);

  return {
    configured: true,
    matchedBy: user ? 'email' : null,
    identity,
    user,
    permissionContext: user ? mapPermissionContext(user) : null
  };
}
