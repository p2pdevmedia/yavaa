import type { Route } from 'next';

import type { AppUserSummary } from '@/lib/app-user';
import {
  dashboardDefaultPath,
  getModeSelectionPath,
  getNextDashboardPathForMode,
  type DashboardMode
} from '@/lib/dashboard-routes';
import {
  appRoleSlugs,
  canSelectProfileMode,
  hasRole,
  type PermissionContext
} from '@/lib/permissions';
import type { RequestAuthState } from '@/lib/request-auth';

export type OnboardingModeStatus = {
  mode: DashboardMode;
  completed: boolean;
  nextPath: Route;
};

export type OnboardingStatus =
  | {
      authenticated: false;
      nextPath: Route;
      modes: [];
    }
  | {
      authenticated: true;
      linkedUser: false;
      nextPath: Route;
      modes: [];
    }
  | {
      authenticated: true;
      linkedUser: true;
      nextPath: Route;
      modes: OnboardingModeStatus[];
    };

function getModeCompletion(
  appUser: AppUserSummary,
  permissionContext: PermissionContext,
  mode: DashboardMode
): OnboardingModeStatus {
  const nextPath = hasRole(permissionContext, mode)
    ? getNextDashboardPathForMode(appUser, mode)
    : getModeSelectionPath(mode);

  return {
    mode,
    completed: nextPath === `/dashboard/${mode}`,
    nextPath
  };
}

export function getOnboardingStatus(auth: RequestAuthState): OnboardingStatus {
  if (!auth.authenticated) {
    return {
      authenticated: false,
      nextPath: '/sign-in?next=%2Fdashboard' as Route,
      modes: []
    };
  }

  if (!auth.appUser || !auth.permissionContext) {
    return {
      authenticated: true,
      linkedUser: false,
      nextPath: '/dashboard/seleccionar-modo' as Route,
      modes: []
    };
  }

  const permissionContext = auth.permissionContext;
  const appUser = auth.appUser as AppUserSummary;
  const modes = appRoleSlugs
    .filter((mode) => canSelectProfileMode(permissionContext, mode))
    .map((mode) => getModeCompletion(appUser, permissionContext, mode));
  const assignedMode = appRoleSlugs.find((mode) => hasRole(permissionContext, mode));

  return {
    authenticated: true,
    linkedUser: true,
    nextPath: assignedMode
      ? getModeCompletion(appUser, permissionContext, assignedMode).nextPath
      : dashboardDefaultPath,
    modes
  };
}
