import type { ReactNode } from 'react';

import { DashboardNavigation } from '@/components/dashboard/dashboard-navigation';

export default function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <DashboardNavigation />
      {children}
    </>
  );
}
