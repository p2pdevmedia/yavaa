import type { ReactNode } from 'react';

import { FloatingUserControls } from '@/components/app-shell/floating-user-controls';
import { getAppShellUserControlsState } from '@/lib/app-shell-user-controls';

export default async function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const userControlsState = await getAppShellUserControlsState();

  return (
    <>
      {userControlsState ? <FloatingUserControls {...userControlsState} /> : null}
      {children}
    </>
  );
}
