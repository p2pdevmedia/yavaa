import type { Route } from 'next';

import { hasCompletedOnboarding } from '@/lib/onboarding';

export type DashboardMode = 'jefe' | 'trabajador';

export const dashboardDefaultPath = '/dashboard/seleccionar-modo' as Route;

export type DashboardBottomTab = {
  href: Route;
  isActive: (pathname: string) => boolean;
  label: string;
};

export function getModeSelectionPath(mode: DashboardMode): Route {
  return `/dashboard/seleccionar-modo?perfil=${mode}` as Route;
}

export function getOnboardingPath(mode: DashboardMode): Route {
  return `/dashboard/onboarding/${mode}` as Route;
}

export function getDashboardHomePath(mode: DashboardMode): Route {
  return `/dashboard/${mode}` as Route;
}

export function getDashboardModeFromPathname(pathname: string): DashboardMode | null {
  if (pathname === '/dashboard/jefe' || pathname.startsWith('/dashboard/jefe/')) {
    return 'jefe';
  }

  if (pathname === '/dashboard/trabajador' || pathname.startsWith('/dashboard/trabajador/')) {
    return 'trabajador';
  }

  return null;
}

function isExactPath(expectedPath: string): (pathname: string) => boolean {
  return (pathname: string) => pathname === expectedPath;
}

function isPathPrefix(expectedPath: string): (pathname: string) => boolean {
  return (pathname: string) => pathname === expectedPath || pathname.startsWith(`${expectedPath}/`);
}

export function getDashboardBottomTabsForMode(mode: DashboardMode): DashboardBottomTab[] {
  if (mode === 'jefe') {
    return [
      {
        href: '/dashboard/jefe' as Route,
        isActive: isExactPath('/dashboard/jefe'),
        label: 'Inicio'
      },
      {
        href: '/dashboard/jefe/buscar-trabajadores' as Route,
        isActive: (pathname) =>
          isPathPrefix('/dashboard/jefe/buscar-trabajadores')(pathname) ||
          isPathPrefix('/dashboard/jefe/trabajadores')(pathname),
        label: 'Trabajadores'
      },
      {
        href: '/dashboard/jefe/perfil' as Route,
        isActive: isPathPrefix('/dashboard/jefe/perfil'),
        label: 'Perfil'
      }
    ];
  }

  return [
    {
      href: '/dashboard/trabajador' as Route,
      isActive: isExactPath('/dashboard/trabajador'),
      label: 'Inicio'
    },
    {
      href: '/dashboard/trabajador/trabajos' as Route,
      isActive: isPathPrefix('/dashboard/trabajador/trabajos'),
      label: 'Trabajos'
    },
    {
      href: '/dashboard/trabajador/perfil' as Route,
      isActive: isPathPrefix('/dashboard/trabajador/perfil'),
      label: 'Perfil'
    }
  ];
}

export function getNextDashboardPathForMode(
  appUser: { profile: Parameters<typeof hasCompletedOnboarding>[0] },
  mode: DashboardMode
): Route {
  return hasCompletedOnboarding(appUser.profile, mode) ? getDashboardHomePath(mode) : getOnboardingPath(mode);
}
