import { redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { WorkerSearch } from '@/components/workers/worker-search';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { hasRole } from '@/lib/permissions';

export default async function SearchWorkersPage() {
  const context = await getDashboardPageContext('/dashboard/jefe/buscar-trabajadores');

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (!hasRole(context.appUser.permissionContext, 'jefe')) {
    redirect('/dashboard/seleccionar-modo' as Route);
  }

  if (!hasCompletedOnboarding(context.appUser.user.profile, 'jefe')) {
    redirect(getOnboardingPath('jefe') as Route);
  }

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Buscar trabajadores</p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Compará perfiles cercanos</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Filtrá por rubro y revisá precios antes de publicar o coordinar.
          </p>
        </div>
        <WorkerSearch />
      </section>
    </YavaaPageShell>
  );
}
