import type { Route } from 'next';

export type DashboardView = 'perfil' | 'direcciones' | 'urgencias' | 'notificaciones' | 'bookings' | 'admin';

export type DashboardNavigationItem = {
  href: Route;
  label: string;
  view: DashboardView;
};

export const dashboardDefaultPath = '/dashboard/perfil' as Route;

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  { href: '/dashboard/perfil' as Route, label: 'Perfil', view: 'perfil' },
  { href: '/dashboard/direcciones' as Route, label: 'Direcciones', view: 'direcciones' },
  { href: '/dashboard/urgencias' as Route, label: 'Urgencias', view: 'urgencias' },
  { href: '/dashboard/notificaciones' as Route, label: 'Notificaciones', view: 'notificaciones' },
  { href: '/dashboard/bookings' as Route, label: 'Bookings', view: 'bookings' },
  { href: '/dashboard/admin' as Route, label: 'Admin', view: 'admin' }
];
