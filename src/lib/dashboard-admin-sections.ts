export type DashboardAdminSection = {
  id: string;
  label: string;
  href: `#${string}`;
};

export const dashboardAdminSections: DashboardAdminSection[] = [
  { id: 'usuarios', label: 'Usuarios', href: '#usuarios' },
  { id: 'contractors', label: 'Contractors', href: '#contractors' },
  { id: 'categorias', label: 'Categorías', href: '#categorias' },
  { id: 'bookings', label: 'Bookings', href: '#bookings' }
];
