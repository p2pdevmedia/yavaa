import {
  DashboardViewPageFallback,
  DashboardViewPageShell,
  getDashboardViewPageState
} from '@/app/dashboard/dashboard-view-page';
import { AdminUsersPanel } from '@/components/dashboard/admin-users-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardAdminUsersPage() {
  const state = await getDashboardViewPageState({ view: 'admin', nextPath: '/dashboard/admin/usuarios' });

  if (state.kind !== 'ready') {
    return <DashboardViewPageFallback state={state} />;
  }

  return (
    <DashboardViewPageShell>
      {state.panelProps.adminData ? (
        <AdminUsersPanel users={state.panelProps.adminData.users} />
      ) : (
        <AdminForbiddenCard />
      )}
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
