import type { ReactNode } from 'react';

import { BottomTabsNav } from '@/components/dashboard/bottom-tabs-nav';

export default function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen pb-28">
      {children}
      <BottomTabsNav />
    </div>
  );
}
