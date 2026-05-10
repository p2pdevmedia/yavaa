import type { ReactNode } from 'react';

import { TrabajadorShell } from '@/components/app-shell/trabajador-shell';

export default function DashboardTrabajadorLayout({ children }: { children: ReactNode }) {
  return <TrabajadorShell>{children}</TrabajadorShell>;
}
