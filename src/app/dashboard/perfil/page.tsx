import {
  DashboardViewPageFallback,
  DashboardViewPageShell,
  getDashboardViewPageState
} from '@/app/dashboard/dashboard-view-page';
import { DashboardPanelClient } from '@/components/dashboard/dashboard-panel-client';

export default async function DashboardProfilePage() {
  const state = await getDashboardViewPageState({ view: 'perfil', nextPath: '/dashboard/perfil' });

  if (state.kind !== 'ready') {
    return <DashboardViewPageFallback state={state} />;
  }

  return (
    <DashboardViewPageShell>
      <DashboardPanelClient {...state.panelProps} />
    </DashboardViewPageShell>
  );
}
