import {
  DashboardViewPageFallback,
  DashboardViewPageShell,
  getDashboardViewPageState
} from '@/app/dashboard/dashboard-view-page';
import { DashboardPanelClient } from '@/components/dashboard/dashboard-panel-client';

export default async function JefeEmergenciesPage() {
  const state = await getDashboardViewPageState({ view: 'urgencias', nextPath: '/dashboard/jefe/urgencias' });

  if (state.kind !== 'ready') {
    return <DashboardViewPageFallback state={state} />;
  }

  return (
    <DashboardViewPageShell>
      <DashboardPanelClient {...state.panelProps} initialMode="client" />
    </DashboardViewPageShell>
  );
}
