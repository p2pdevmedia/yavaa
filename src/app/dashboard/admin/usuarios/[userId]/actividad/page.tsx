import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';

import {
  DashboardViewPageFallback,
  DashboardViewPageShell
} from '@/app/dashboard/dashboard-view-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getUserForAdmin,
  listUserAuditLogsForAdmin,
  type AdminUserAuditLog,
  type AdminUserDetail
} from '@/lib/admin-users';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getPrismaClient } from '@/lib/prisma';

type DashboardAdminUserActivityPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function DashboardAdminUserActivityPage({ params }: DashboardAdminUserActivityPageProps) {
  const { userId } = await params;
  const context = await getDashboardPageContext(`/dashboard/admin/usuarios/${userId}/actividad`);

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

  let pageData: { user: AdminUserDetail; auditLogs: AdminUserAuditLog[] };

  try {
    const prisma = getPrismaClient();
    const [user, auditLogs] = await Promise.all([
      getUserForAdmin(prisma, context.appUser.permissionContext, userId),
      listUserAuditLogsForAdmin(prisma, context.appUser.permissionContext, userId)
    ]);
    pageData = { user, auditLogs };
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

  const { user, auditLogs } = pageData;

  return (
    <DashboardViewPageShell>
      <section className="space-y-6" aria-labelledby="admin-user-audit-title">
        <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Usuario</p>
              <h2 id="admin-user-audit-title" className="font-display text-3xl text-foreground">
                Actividad auditada
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{user.displayName ?? user.email}</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/admin/usuarios/${user.id}` as Route}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver al usuario
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Eventos recientes</CardTitle>
            <CardDescription>{auditLogs.length} eventos auditados asociados al usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{entry.action}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.entityType} {entry.entityId ?? ''}
                  </p>
                  {entry.metadata ? (
                    <pre className="mt-3 overflow-x-auto rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Sin actividad auditada reciente.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardViewPageShell>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'sin fecha';
  }

  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
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
