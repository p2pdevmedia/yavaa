import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPanel } from '@/components/dashboard/dashboard-panel';
import { buildSignInPath, getAuthSessionState } from '@/lib/auth';
import { resolveAppUser } from '@/lib/app-user';
import { listBookingsForActor } from '@/lib/bookings';
import { listNotificationsForUser } from '@/lib/notifications';
import { serializeNotificationsForDashboard } from '@/lib/dashboard-notifications';
import { getDashboardAdminData } from '@/lib/dashboard-admin';
import { serializeBookingsForDashboard } from '@/lib/dashboard-workspace';
import { getPrismaClient } from '@/lib/prisma';
import { listPublicCatalogCategories } from '@/lib/public-catalog';
import { isDatabaseUnavailableError } from '@/lib/public-db-fallback';

function DatabaseUnavailableState({ email }: { email: string | null }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Base de datos no disponible</CardTitle>
          <CardDescription>
            La sesión está activa, pero Yavaa no puede verificar permisos ni cargar datos operativos ahora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p className="font-mono text-foreground">{email ?? 'Sesión autenticada'}</p>
          <p>Volvé a intentar en unos minutos. Ninguna acción protegida se habilita sin validar la base.</p>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  if (!authState.authenticated) {
    redirect(buildSignInPath('/dashboard') as Route);
  }

  let appUser: Awaited<ReturnType<typeof resolveAppUser>> | null = null;
  let categories: Awaited<ReturnType<typeof listPublicCatalogCategories>> = [];
  let bookings: Awaited<ReturnType<typeof listBookingsForActor>> = [];
  let notifications: Awaited<ReturnType<typeof listNotificationsForUser>> = [];
  let adminData: Awaited<ReturnType<typeof getDashboardAdminData>> = null;

  try {
    appUser = authState.user ? await resolveAppUser(authState.user) : null;
    categories = await listPublicCatalogCategories();
    const prisma = getPrismaClient();
    bookings = appUser?.permissionContext ? await listBookingsForActor(prisma, appUser.permissionContext) : [];
    notifications = appUser?.user ? await listNotificationsForUser(prisma, appUser.user.id, 5) : [];
    adminData = appUser?.permissionContext ? await getDashboardAdminData(prisma, appUser.permissionContext) : null;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return <DatabaseUnavailableState email={authState.user?.email ?? null} />;
    }

    throw error;
  }

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
        bookings={serializeBookingsForDashboard(bookings)}
        notifications={serializeNotificationsForDashboard(notifications)}
        adminData={adminData}
      />
    </main>
  );
}
