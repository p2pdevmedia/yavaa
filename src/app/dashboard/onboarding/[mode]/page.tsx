import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { JefeWizard } from '@/components/onboarding/jefe-wizard';
import { WorkerWizard } from '@/components/onboarding/worker-wizard';
import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getDashboardHomePath } from '@/lib/dashboard-routes';
import { hasCompletedOnboarding, isOnboardingMode } from '@/lib/onboarding';
import { canCompleteOnboarding } from '@/lib/permissions';

type OnboardingModePageProps = {
  params: Promise<{
    mode: string;
  }>;
  searchParams?: Promise<{
    editar?: string | string[];
  }>;
};

export default async function OnboardingModePage({ params, searchParams }: OnboardingModePageProps) {
  const { mode } = await params;
  const resolvedSearchParams = await searchParams;
  const editar = Array.isArray(resolvedSearchParams?.editar)
    ? resolvedSearchParams.editar[0]
    : resolvedSearchParams?.editar;
  const isEditingProfile = editar === '1';

  if (!isOnboardingMode(mode)) {
    notFound();
  }

  const context = await getDashboardPageContext(`/dashboard/onboarding/${mode}${isEditingProfile ? '?editar=1' : ''}`);

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (!canCompleteOnboarding(context.appUser.permissionContext, mode)) {
    notFound();
  }

  if (hasCompletedOnboarding(context.appUser.user.profile, mode) && !isEditingProfile) {
    redirect(getDashboardHomePath(mode) as Route);
  }

  if (mode === 'trabajador') {
    return <WorkerWizard initialProfile={context.appUser.user.profile} />;
  }

  if (mode === 'jefe') {
    return <JefeWizard initialProfile={context.appUser.user.profile} />;
  }

  return (
    <YavaaPageShell width="sm" className="flex min-h-screen items-center py-6">
      <section className="w-full space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Onboarding</p>
        <h1 className="font-display text-3xl font-bold tracking-normal">
          {mode === 'jefe' ? 'Wizard jefe' : 'Wizard trabajador'}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Esta ruta protegida ya queda conectada para la siguiente etapa del wizard.
        </p>
        <Button className="w-full" disabled>
          Próxima etapa
        </Button>
      </section>
    </YavaaPageShell>
  );
}
