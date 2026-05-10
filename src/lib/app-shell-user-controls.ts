import { cookies } from 'next/headers';

import { getAuthSessionState } from '@/lib/auth';
import { serializeNotificationsForDashboard, type DashboardNotification } from '@/lib/dashboard-notifications';
import { listNotificationsForUser } from '@/lib/notifications';
import { resolveAppUser } from '@/lib/app-user';
import { getPrismaClient } from '@/lib/prisma';
import { isDatabaseUnavailableError } from '@/lib/public-db-fallback';
import type { AppRoleSlug } from '@/lib/permissions';

export type AppShellUserControlsState = {
  user: {
    email: string;
    displayName: string | null;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
    roles: AppRoleSlug[];
    hasContractorProfile: boolean;
  };
  email: string | null;
  notifications: DashboardNotification[];
};

export async function getAppShellUserControlsState(): Promise<AppShellUserControlsState | null> {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  if (!authState.authenticated || !authState.user) {
    return null;
  }

  try {
    const appUser = await resolveAppUser(authState.user);

    if (!appUser?.user) {
      return null;
    }

    const prisma = getPrismaClient();
    const notifications = await listNotificationsForUser(prisma, appUser.user.id, 20);

    return {
      user: {
        email: appUser.user.email,
        displayName: appUser.user.displayName,
        profile: appUser.user.profile
          ? {
              firstName: appUser.user.profile.firstName,
              lastName: appUser.user.profile.lastName,
              avatarUrl: appUser.user.profile.avatarUrl
            }
          : null,
        roles: appUser.user.roles,
        hasContractorProfile: Boolean(appUser.user.contractorProfile)
      },
      email: authState.user.email ?? null,
      notifications: serializeNotificationsForDashboard(notifications)
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return null;
    }

    throw error;
  }
}
