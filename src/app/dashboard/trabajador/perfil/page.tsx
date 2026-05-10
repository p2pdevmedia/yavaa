import {
  DashboardViewPageFallback,
  DashboardViewPageShell,
  getDashboardViewPageState
} from '@/app/dashboard/dashboard-view-page';
import { DashboardPanelClient } from '@/components/dashboard/dashboard-panel-client';

export default async function TrabajadorProfilePage() {
  const state = await getDashboardViewPageState({ view: 'perfil', nextPath: '/dashboard/trabajador/perfil' });

  if (state.kind !== 'ready') {
    return <DashboardViewPageFallback state={state} />;
  }

  return (
    <DashboardViewPageShell>
      <DashboardPanelClient {...state.panelProps} initialMode="contractor" />
    </DashboardViewPageShell>
  );
}
