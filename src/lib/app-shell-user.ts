import { cookies } from 'next/headers';

import { resolveAppUser } from '@/lib/app-user';
import { getAuthSessionState } from '@/lib/auth';
import { canManageUsers } from '@/lib/permissions';
import { isDatabaseUnavailableError } from '@/lib/public-db-fallback';

export async function getCurrentUserCanSeeAdminNavigation(): Promise<boolean> {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  if (!authState.authenticated || !authState.user) {
    return false;
  }

  try {
    const appUser = await resolveAppUser(authState.user);

    return appUser.permissionContext ? canManageUsers(appUser.permissionContext) : false;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return false;
    }

    throw error;
  }
}
