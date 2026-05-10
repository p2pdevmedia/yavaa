import {
  DashboardViewPageFallback,
  DashboardViewPageShell,
  getDashboardViewPageState
} from '@/app/dashboard/dashboard-view-page';
import { AdminCategoriesPanel } from '@/components/dashboard/admin-categories-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardAdminCategoriesPage() {
  const state = await getDashboardViewPageState({ view: 'admin', nextPath: '/dashboard/admin/categorias' });

  if (state.kind !== 'ready') {
    return <DashboardViewPageFallback state={state} />;
  }

  return (
    <DashboardViewPageShell>
      {state.panelProps.adminData ? (
        <AdminCategoriesPanel categories={state.panelProps.adminData.categories} />
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
