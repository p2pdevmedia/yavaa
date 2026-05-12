import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { buildSignInPath, getAuthSessionState } from '@/lib/auth';
import { resolveAppUser, type AppUserSummary, type ResolvedAppUser } from '@/lib/app-user';
import type { PermissionContext } from '@/lib/permissions';

type DashboardReadyUser = ResolvedAppUser & {
  user: AppUserSummary;
  permissionContext: PermissionContext;
};

type DashboardAuthState = Awaited<ReturnType<typeof getAuthSessionState>>;

export type DashboardPageContext =
  | {
      kind: 'ready';
      appUser: DashboardReadyUser;
      authState: DashboardAuthState;
    }
  | {
      kind: 'database-unavailable';
      email: string | null;
    }
  | {
      kind: 'unlinked-user';
      authState: DashboardAuthState;
    };

function isDatabaseUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /database|connection|connect|ECONNREFUSED|ENOTFOUND|P1001|P1002/i.test(error.message);
}

export async function getDashboardPageContext(nextPath: string): Promise<DashboardPageContext> {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  if (!authState.authenticated) {
    redirect(buildSignInPath(nextPath) as Route);
  }

  try {
    const appUser = authState.user ? await resolveAppUser(authState.user) : null;

    if (!appUser?.user || !appUser.permissionContext) {
      return {
        kind: 'unlinked-user',
        authState
      };
    }

    return {
      kind: 'ready',
      appUser: appUser as DashboardReadyUser,
      authState
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        kind: 'database-unavailable',
        email: authState.user?.email ?? null
      };
    }

    throw error;
  }
}
