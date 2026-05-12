import Link from 'next/link';

import { SignOutButton } from '@/components/auth/sign-out-button';
import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getModeSelectionPath, type DashboardMode } from '@/lib/dashboard-routes';
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
}> = [
  {
    slug: 'jefe',
    title: 'Jefe',
    description: 'Perfil para organizar y pedir trabajo.'
  },
  {
    slug: 'trabajador',
    title: 'Trabajador',
    description: 'Perfil para ofrecer trabajo y responder como prestador.'
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

  return (
    <YavaaPageShell width="md" className="flex min-h-screen items-center py-10">
      <section className="w-full space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Yavaa</p>
            <h1 className="font-display text-4xl font-semibold tracking-normal">Elegí tu perfil</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Seleccioná cómo querés entrar en esta sesión.
            </p>
          </div>
          <SignOutButton />
        </div>

        {selectedProfile === 'jefe' || selectedProfile === 'trabajador' ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Perfil seleccionado: <span className="font-semibold text-foreground">{selectedProfile}</span>
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {modes.map((mode) => {
            const allowed = canSelectProfileMode(context.appUser.permissionContext, mode.slug);

            return (
              <Card key={mode.slug} className="border-border/70 bg-card/95 shadow-soft">
                <CardHeader>
                  <CardTitle>{mode.title}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {allowed ? (
                    <Button asChild className="w-full" variant={mode.slug === 'jefe' ? 'default' : 'outline'}>
                      <Link href={getModeSelectionPath(mode.slug)}>Entrar como {mode.title}</Link>
                    </Button>
                  ) : (
                    <Button className="w-full" disabled variant={mode.slug === 'jefe' ? 'default' : 'outline'}>
                      Rol {mode.title} no asignado
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </YavaaPageShell>
  );
}
