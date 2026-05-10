import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import { BriefcaseBusiness, Home, House, ShieldCheck, Siren, UserRound, UsersRound } from 'lucide-react';

export type AppShellMode = 'guest' | 'jefe' | 'trabajador';

export type UrgenciesIntent = 'draft-before-auth' | 'publish-emergency' | 'browse-emergencies';

export type AppShellNavigationItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
};

export type AppShellNavigationOptions = {
  isAdmin?: boolean;
};

const adminNavigationItem: AppShellNavigationItem = {
  href: '/dashboard/admin' as Route,
  label: 'ADMIN',
  icon: ShieldCheck
};

const guestNavigationItems: AppShellNavigationItem[] = [
  { href: '/' as Route, label: 'Inicio', icon: Home },
  { href: '/urgencias' as Route, label: 'Urgencias', icon: Siren },
  { href: '/sign-in' as Route, label: 'Perfil', icon: UserRound }
];

const jefeNavigationItems: AppShellNavigationItem[] = [
  { href: '/dashboard/jefe' as Route, label: 'Inicio', icon: Home },
  { href: '/dashboard/jefe/urgencias' as Route, label: 'Urgencias', icon: Siren },
  { href: '/dashboard/jefe/mis-casas' as Route, label: 'Mis Casas', icon: House },
  { href: '/dashboard/jefe/trabajadores' as Route, label: 'Trabajadores', icon: UsersRound },
  { href: '/dashboard/jefe/perfil' as Route, label: 'Perfil', icon: UserRound }
];

const trabajadorNavigationItems: AppShellNavigationItem[] = [
  { href: '/dashboard/trabajador' as Route, label: 'Inicio', icon: Home },
  { href: '/dashboard/trabajador/urgencias' as Route, label: 'Urgencias', icon: Siren },
  { href: '/dashboard/trabajador/mis-clientes' as Route, label: 'Mis Clientes', icon: BriefcaseBusiness },
  { href: '/dashboard/trabajador/perfil' as Route, label: 'Perfil', icon: UserRound }
];

function withAdminNavigationItem(
  items: AppShellNavigationItem[],
  options: AppShellNavigationOptions
): AppShellNavigationItem[] {
  if (!options.isAdmin) {
    return items;
  }

  const profileIndex = items.findIndex((item) => item.label === 'Perfil');

  if (profileIndex === -1) {
    return [...items, adminNavigationItem];
  }

  return [...items.slice(0, profileIndex), adminNavigationItem, ...items.slice(profileIndex)];
}

export function getShellNavigationItems(
  mode: AppShellMode,
  options: AppShellNavigationOptions = {}
): AppShellNavigationItem[] {
  if (mode === 'jefe') {
    return withAdminNavigationItem(jefeNavigationItems, options);
  }

  if (mode === 'trabajador') {
    return withAdminNavigationItem(trabajadorNavigationItems, options);
  }

  return guestNavigationItems;
}

function isNavigationHrefMatch(pathname: string, href: Route): boolean {
  if (pathname === href) {
    return true;
  }

  return href !== '/' && pathname.startsWith(`${href}/`);
}

export function getActiveShellNavigationHref(
  pathname: string | null,
  items: AppShellNavigationItem[]
): Route | null {
  if (!pathname) {
    return null;
  }

  const activeItem = items
    .filter((item) => isNavigationHrefMatch(pathname, item.href))
    .sort((first, second) => second.href.length - first.href.length)[0];

  return activeItem?.href ?? null;
}

export function getDefaultShellPath(mode: AppShellMode): Route {
  if (mode === 'jefe') {
    return '/dashboard/jefe' as Route;
  }

  if (mode === 'trabajador') {
    return '/dashboard/trabajador' as Route;
  }

  return '/' as Route;
}

export function getUrgenciesIntent(mode: AppShellMode): UrgenciesIntent {
  if (mode === 'jefe') {
    return 'publish-emergency';
  }

  if (mode === 'trabajador') {
    return 'browse-emergencies';
  }

  return 'draft-before-auth';
}
