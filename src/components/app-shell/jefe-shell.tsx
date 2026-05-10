import type { ReactNode } from 'react';

import { BottomNativeBar } from '@/components/app-shell/bottom-native-bar';

export function JefeShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {children}
      <BottomNativeBar mode="jefe" />
    </div>
  );
}
