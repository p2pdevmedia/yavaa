import type { ReactNode } from 'react';

import { BottomNativeBar } from '@/components/app-shell/bottom-native-bar';

type TrabajadorShellProps = {
  children: ReactNode;
  isAdmin?: boolean;
};

export function TrabajadorShell({ children, isAdmin = false }: TrabajadorShellProps) {
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {children}
      <BottomNativeBar mode="trabajador" isAdmin={isAdmin} />
    </div>
  );
}
