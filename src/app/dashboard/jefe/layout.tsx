import type { ReactNode } from 'react';

import { JefeShell } from '@/components/app-shell/jefe-shell';
import { getCurrentUserCanSeeAdminNavigation } from '@/lib/app-shell-user';

export default async function DashboardJefeLayout({ children }: { children: ReactNode }) {
  const isAdmin = await getCurrentUserCanSeeAdminNavigation();

  return <JefeShell isAdmin={isAdmin}>{children}</JefeShell>;
}
