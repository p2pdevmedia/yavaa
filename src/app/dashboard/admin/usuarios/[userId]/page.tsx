import {
  DashboardViewPageFallback,
  DashboardViewPageShell
} from '@/app/dashboard/dashboard-view-page';
import { AdminUserDetail } from '@/components/dashboard/admin-user-detail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserForAdmin } from '@/lib/admin-users';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getPrismaClient } from '@/lib/prisma';

type DashboardAdminUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function DashboardAdminUserDetailPage({ params }: DashboardAdminUserDetailPageProps) {
  const { userId } = await params;
  const context = await getDashboardPageContext(`/dashboard/admin/usuarios/${userId}`);

  if (context.kind === 'database-unavailable') {
    return <DashboardViewPageFallback state={context} />;
  }

  if (context.kind === 'unlinked-user') {
    return (
      <DashboardViewPageFallback
        state={{
          kind: 'unlinked-user',
          email: context.authState.user?.email ?? null
        }}
      />
    );
  }

  let user = null;

  try {
    user = await getUserForAdmin(getPrismaClient(), context.appUser.permissionContext, userId);
  } catch (error) {
    if (error instanceof Error && error.message === 'forbidden') {
      return (
        <DashboardViewPageShell>
          <AdminForbiddenCard />
        </DashboardViewPageShell>
      );
    }

    if (error instanceof Error && error.message === 'user-not-found') {
      return (
        <DashboardViewPageShell>
          <Card className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Usuario no encontrado</CardTitle>
              <CardDescription>No existe un usuario para inspeccionar con ese identificador.</CardDescription>
            </CardHeader>
          </Card>
        </DashboardViewPageShell>
      );
    }

    throw error;
  }

  return (
    <DashboardViewPageShell>
      <AdminUserDetail user={user} />
    </DashboardViewPageShell>
  );
}

function AdminForbiddenCard() {
  return (
    <Card className="border-border/70 bg-card/90 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Administración</CardTitle>
        <CardDescription>Esta vista está reservada para usuarios con permisos administrativos.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Si necesitás operar el marketplace, pedile a un administrador que revise tus roles.
        </p>
      </CardContent>
    </Card>
  );
}
