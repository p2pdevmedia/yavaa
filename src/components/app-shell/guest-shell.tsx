import type { ReactNode } from 'react';

import { BottomNativeBar } from '@/components/app-shell/bottom-native-bar';

export function GuestShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      {children}
      <BottomNativeBar mode="guest" />
    </div>
  );
}
