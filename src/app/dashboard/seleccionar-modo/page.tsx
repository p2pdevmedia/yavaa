import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { SignOutButton } from '@/components/auth/sign-out-button';
import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { TypeSelection } from '@/components/onboarding/type-selection';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getNextDashboardPathForMode, type DashboardMode } from '@/lib/dashboard-routes';
import { isOnboardingMode } from '@/lib/onboarding';
import { canSelectProfileMode } from '@/lib/permissions';

type SelectModePageProps = {
  searchParams?: Promise<{
    perfil?: string | string[];
  }>;
};

const modes: Array<{
  slug: DashboardMode;
  title: string;
  description: string;
  eyebrow: string;
}> = [
  {
    slug: 'jefe',
    title: 'Quiero contratar',
    description: 'Publicá trabajos y recibí ofertas de trabajadores cerca de tu zona.',
    eyebrow: 'Cliente'
  },
  {
    slug: 'trabajador',
    title: 'Quiero trabajar',
    description: 'Creá tu perfil, validá tu identidad y recibí oportunidades.',
    eyebrow: 'Trabajador'
  }
];

export default async function SelectModePage({ searchParams }: SelectModePageProps) {
  const context = await getDashboardPageContext('/dashboard/seleccionar-modo');

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  const resolvedSearchParams = (await Promise.resolve(searchParams)) ?? {};
  const selectedProfile = Array.isArray(resolvedSearchParams.perfil)
    ? resolvedSearchParams.perfil[0]
    : resolvedSearchParams.perfil;

  if (selectedProfile && isOnboardingMode(selectedProfile)) {
    if (canSelectProfileMode(context.appUser.permissionContext, selectedProfile)) {
      redirect(getNextDashboardPathForMode(context.appUser.user, selectedProfile) as Route);
    }
  }

  return (
    <YavaaPageShell width="md" className="flex min-h-screen items-center py-6 sm:py-10">
      <section className="w-full space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Yavaa</p>
            <h1 className="font-display text-4xl font-bold tracking-normal">¿Cómo querés usar Yavaa?</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Elegí tu modo inicial. Cada perfil tiene su propio wizard y controles del lado del servidor.
            </p>
          </div>
          <SignOutButton />
        </div>

        {selectedProfile && !isOnboardingMode(selectedProfile) ? (
          <p className="rounded-[18px] border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Ese perfil no existe. Elegí una de las opciones disponibles.
          </p>
        ) : null}

        <TypeSelection
          modes={modes.map((mode) => ({
            ...mode,
            allowed: canSelectProfileMode(context.appUser.permissionContext, mode.slug)
          }))}
        />
      </section>
    </YavaaPageShell>
  );
}
