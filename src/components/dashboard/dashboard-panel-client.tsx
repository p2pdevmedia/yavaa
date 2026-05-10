'use client';

import { DashboardPanel, type DashboardPanelProps } from '@/components/dashboard/dashboard-panel';

export function DashboardPanelClient(props: DashboardPanelProps) {
  return <DashboardPanel {...props} />;
}
