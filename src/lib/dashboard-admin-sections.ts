import type { Route } from 'next';

export type DashboardAdminSection = {
  id: string;
  label: string;
  href: Route;
};

export const dashboardAdminSections: DashboardAdminSection[] = [
  { id: 'usuarios', label: 'Usuarios', href: '/dashboard/admin/usuarios' as Route },
  { id: 'categorias', label: 'Categorías', href: '/dashboard/admin/categorias' as Route },
  { id: 'bookings', label: 'Bookings', href: '/dashboard/admin/bookings' as Route },
  { id: 'urgencias', label: 'Urgencias', href: '/dashboard/admin/urgencias' as Route }
];
