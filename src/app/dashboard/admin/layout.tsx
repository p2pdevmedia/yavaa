import type { ReactNode } from 'react';

import { JefeShell } from '@/components/app-shell/jefe-shell';

export default function DashboardAdminLayout({ children }: { children: ReactNode }) {
  return <JefeShell isAdmin>{children}</JefeShell>;
}
