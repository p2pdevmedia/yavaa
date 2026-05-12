import type { Route } from 'next';

import type { AppUserSummary } from '@/lib/app-user';
import { dashboardDefaultPath, getNextDashboardPathForMode, type DashboardMode } from '@/lib/dashboard-routes';
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

function getModeCompletion(appUser: AppUserSummary, mode: DashboardMode): OnboardingModeStatus {
  const nextPath = getNextDashboardPathForMode(appUser, mode);

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

  const modes = auth.permissionContext.roles.map((mode) => getModeCompletion(auth.appUser as AppUserSummary, mode));

  return {
    authenticated: true,
    linkedUser: true,
    nextPath: modes[0]?.nextPath ?? dashboardDefaultPath,
    modes
  };
}
