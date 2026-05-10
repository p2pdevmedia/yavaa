import {
  DashboardViewPageFallback,
  DashboardViewPageShell,
  getDashboardViewPageState
} from '@/app/dashboard/dashboard-view-page';
import { DashboardPanelClient } from '@/components/dashboard/dashboard-panel-client';

export default async function DashboardBookingsPage() {
  const state = await getDashboardViewPageState({ view: 'bookings', nextPath: '/dashboard/bookings' });

  if (state.kind !== 'ready') {
    return <DashboardViewPageFallback state={state} />;
  }

  return (
    <DashboardViewPageShell>
      <DashboardPanelClient {...state.panelProps} />
    </DashboardViewPageShell>
  );
}
