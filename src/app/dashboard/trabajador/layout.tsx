import type { ReactNode } from 'react';

import { TrabajadorShell } from '@/components/app-shell/trabajador-shell';
import { getCurrentUserCanSeeAdminNavigation } from '@/lib/app-shell-user';

export default async function DashboardTrabajadorLayout({ children }: { children: ReactNode }) {
  const isAdmin = await getCurrentUserCanSeeAdminNavigation();

  return <TrabajadorShell isAdmin={isAdmin}>{children}</TrabajadorShell>;
}
