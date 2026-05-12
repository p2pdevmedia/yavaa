import { redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { PublishJobForm } from '@/components/jobs/publish-job-form';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { hasRole } from '@/lib/permissions';

export default async function PublishJobPage() {
  const context = await getDashboardPageContext('/dashboard/jefe/publicar-trabajo');

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
    <YavaaPageShell width="sm" className="py-5">
      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Publicar trabajo</p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Contá qué necesitás</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Un pedido corto alcanza para empezar a recibir opciones.
          </p>
        </div>
        <PublishJobForm initialAddress={context.appUser.user.profile?.addressText} />
      </section>
    </YavaaPageShell>
  );
}
