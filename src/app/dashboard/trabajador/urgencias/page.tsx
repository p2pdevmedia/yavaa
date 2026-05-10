import {
  DashboardViewPageFallback,
  DashboardViewPageShell,
  getDashboardViewPageState
} from '@/app/dashboard/dashboard-view-page';
import { DashboardPanelClient } from '@/components/dashboard/dashboard-panel-client';

export default async function TrabajadorEmergenciesPage() {
  const state = await getDashboardViewPageState({
    view: 'urgencias',
    nextPath: '/dashboard/trabajador/urgencias',
    mode: 'contractor'
  });

  if (state.kind !== 'ready') {
    return <DashboardViewPageFallback state={state} />;
  }

  return (
    <DashboardViewPageShell>
      <DashboardPanelClient {...state.panelProps} initialMode="contractor" />
    </DashboardViewPageShell>
  );
}
