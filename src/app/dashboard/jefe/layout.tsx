import type { ReactNode } from 'react';

import { JefeShell } from '@/components/app-shell/jefe-shell';

export default function DashboardJefeLayout({ children }: { children: ReactNode }) {
  return <JefeShell>{children}</JefeShell>;
}
