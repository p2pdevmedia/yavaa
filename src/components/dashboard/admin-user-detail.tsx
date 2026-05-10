import Link from 'next/link';
import type { Route } from 'next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminUserDetail as AdminUserDetailData } from '@/lib/admin-users';

type AdminUserDetailProps = {
  user: AdminUserDetailData;
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'sin fecha';
  }

  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

function displayName(user: AdminUserDetailData): string {
  return user.displayName ?? user.email;
}

export function AdminUserDetail({ user }: AdminUserDetailProps) {
  return (
    <section className="space-y-6" aria-labelledby="admin-user-detail-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Usuario</p>
            <h2 id="admin-user-detail-title" className="font-display text-3xl text-foreground">
              {displayName(user)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={'/dashboard/admin/usuarios' as Route}>Volver a usuarios</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Identidad</CardTitle>
            <CardDescription>Datos básicos y roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={user.status === 'ACTIVE' ? 'secondary' : 'outline'}>{user.status}</Badge>
              {user.roles.map((role) => (
                <Badge key={role.slug} variant="outline">
                  {role.slug}
                </Badge>
              ))}
            </div>
            <p>
              <span className="text-muted-foreground">Nombre: </span>
              {[user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || 'sin nombre'}
            </p>
            <p>
              <span className="text-muted-foreground">Teléfono: </span>
              {user.profile?.phone ?? 'sin teléfono'}
            </p>
            <p>
              <span className="text-muted-foreground">Creado: </span>
              {formatDate(user.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Contractor</CardTitle>
            <CardDescription>Perfil de trabajador asociado a este usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {user.contractorProfile ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={user.contractorProfile.approvalStatus === 'APPROVED' ? 'secondary' : 'outline'}>
                    {user.contractorProfile.approvalStatus}
                  </Badge>
                  {user.contractorProfile.acceptsEmergencies ? <Badge variant="secondary">Urgencias</Badge> : null}
                </div>
                <p>
                  <span className="text-muted-foreground">DNI: </span>
                  {user.contractorProfile.dniNumber ?? 'sin DNI'}
                </p>
                <p>
                  <span className="text-muted-foreground">Zona: </span>
                  {user.contractorProfile.workZones.map((zone) => zone.name).join(', ') || 'sin zonas'}
                </p>
                <p>
                  <span className="text-muted-foreground">Categorías: </span>
                  {user.contractorProfile.categories.map((category) => category.name).join(', ') || 'sin categorías'}
                </p>
                <p>
                  <span className="text-muted-foreground">Revisión: </span>
                  {user.contractorProfile.reviewNotes ?? 'sin notas'}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Este usuario todavía no tiene perfil de trabajador.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityCard title="Bookings como cliente" items={user.bookingsAsClient} />
        <ActivityCard title="Bookings como contractor" items={user.bookingsAsContractor} />
      </div>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Actividad auditada</CardTitle>
          <CardDescription>Últimos eventos asociados al usuario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.auditLogs.length > 0 ? (
            user.auditLogs.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{entry.action}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.entityType} {entry.entityId ?? ''}
                </p>
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
  );
}

function ActivityCard({
  title,
  items
}: {
  title: string;
  items: AdminUserDetailData['bookingsAsClient'];
}) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-2xl">{title}</CardTitle>
        <CardDescription>{items.length} registros recientes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 0 ? (
          items.map((booking) => (
            <div key={booking.id} className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{booking.description}</p>
                  <p className="text-muted-foreground">
                    {booking.category.name} · {booking.counterparty.displayName ?? booking.counterparty.email}
                  </p>
                </div>
                <Badge variant="outline">{booking.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(booking.scheduledFor)}</p>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Sin bookings recientes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
