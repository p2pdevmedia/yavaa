import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPanel } from '@/components/dashboard/dashboard-panel';
import { buildSignInPath, getAuthSessionState } from '@/lib/auth';
import { resolveAppUser } from '@/lib/app-user';
import { listPublicCatalogCategories } from '@/lib/public-catalog';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  if (!authState.authenticated) {
    redirect(buildSignInPath('/dashboard') as Route);
  }

  const appUser = authState.user ? await resolveAppUser(authState.user) : null;
  const categories = await listPublicCatalogCategories();

  if (!appUser?.user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Área protegida</CardTitle>
            <CardDescription>
              La sesión está activa, pero todavía no hay un usuario local de Yavaa vinculado a esta identidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p className="font-mono text-foreground">{authState.user?.email ?? 'Sesión autenticada'}</p>
            <p>Cuando vinculemos el usuario local, vas a ver el panel de perfil y direcciones acá mismo.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPanel
        initialUser={appUser.user}
        email={authState.user?.email ?? null}
        configured={authState.configured}
        categories={categories}
      />
    </main>
  );
}
