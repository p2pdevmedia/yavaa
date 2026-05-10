import type { ReactNode } from 'react';

import { BottomNativeBar } from '@/components/app-shell/bottom-native-bar';

type JefeShellProps = {
  children: ReactNode;
  isAdmin?: boolean;
};

export function JefeShell({ children, isAdmin = false }: JefeShellProps) {
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {children}
      <BottomNativeBar mode="jefe" isAdmin={isAdmin} />
    </div>
  );
}
