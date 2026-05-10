import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { getModeSelectionPath } from '@/lib/dashboard-routes';

export default async function SelectModePage() {
  const context = await getDashboardPageContext('/dashboard/seleccionar-modo');

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  const jefeModePath = getModeSelectionPath('jefe', context.appUser.user);
  const trabajadorModePath = getModeSelectionPath('trabajador', context.appUser.user);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <YavaaPageShell width="md" className="flex min-h-screen items-center py-10">
        <section className="w-full space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Yavaa</p>
            <h1 className="font-display text-4xl font-semibold tracking-normal">Que modo queres usar?</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Elegi Jefe para pedir y organizar trabajos, o Trabajador para ofrecer servicios y navegar urgencias.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/70 bg-card/95 shadow-soft">
              <CardHeader>
                <CardTitle>Jefe</CardTitle>
                <CardDescription>Publicar urgencias, guardar casas y encontrar trabajadores.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={jefeModePath}>Entrar como Jefe</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-soft">
              <CardHeader>
                <CardTitle>Trabajador</CardTitle>
                <CardDescription>Navegar urgencias, ver clientes y completar tu perfil laboral.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href={trabajadorModePath}>Entrar como Trabajador</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </YavaaPageShell>
    </main>
  );
}
