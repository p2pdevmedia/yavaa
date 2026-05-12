import type { Route } from 'next';

import { hasCompletedOnboarding } from '@/lib/onboarding';

export type DashboardMode = 'jefe' | 'trabajador';

export const dashboardDefaultPath = '/dashboard/seleccionar-modo' as Route;

export function getModeSelectionPath(mode: DashboardMode): Route {
  return `/dashboard/seleccionar-modo?perfil=${mode}` as Route;
}

export function getOnboardingPath(mode: DashboardMode): Route {
  return `/dashboard/onboarding/${mode}` as Route;
}

export function getDashboardHomePath(mode: DashboardMode): Route {
  return `/dashboard/${mode}` as Route;
}

export function getNextDashboardPathForMode(
  appUser: { profile: Parameters<typeof hasCompletedOnboarding>[0] },
  mode: DashboardMode
): Route {
  return hasCompletedOnboarding(appUser.profile, mode) ? getDashboardHomePath(mode) : getOnboardingPath(mode);
}
