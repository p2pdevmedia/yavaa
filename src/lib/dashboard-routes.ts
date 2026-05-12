import type { Route } from 'next';

export type DashboardMode = 'jefe' | 'trabajador';

export const dashboardDefaultPath = '/dashboard/seleccionar-modo' as Route;

export function getModeSelectionPath(mode: DashboardMode): Route {
  return `/dashboard/seleccionar-modo?perfil=${mode}` as Route;
}
