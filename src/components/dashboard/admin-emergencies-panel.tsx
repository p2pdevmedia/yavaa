import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAdminData } from '@/lib/dashboard-admin';

type AdminEmergenciesPanelProps = {
  emergencies: DashboardAdminData['emergencies'];
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'sin fecha';
  }

  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

function formatEmergencyStatus(status: DashboardAdminData['emergencies'][number]['status']): string {
  const labels: Record<DashboardAdminData['emergencies'][number]['status'], string> = {
    OPEN: 'Abierta',
    DISPATCHING: 'Buscando trabajador',
    ACCEPTED: 'Aceptada',
    CANCELLED_BY_CLIENT: 'Cancelada',
    RESOLVED_BY_CLIENT: 'Resuelta',
    REASSIGNMENT_NEEDED: 'Reasignar',
    EXPIRED: 'Expirada'
  };

  return labels[status];
}

export function AdminEmergenciesPanel({ emergencies }: AdminEmergenciesPanelProps) {
  const activeCount = emergencies.filter((emergency) =>
    ['OPEN', 'DISPATCHING', 'REASSIGNMENT_NEEDED'].includes(emergency.status)
  ).length;

  return (
    <section className="space-y-6" aria-labelledby="admin-emergencies-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
        <h2 id="admin-emergencies-title" className="font-display text-3xl text-foreground">
          Urgencias y emergencias
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vista completa para seguimiento operativo de solicitudes urgentes.
        </p>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Solicitudes</CardTitle>
          <CardDescription>
            {emergencies.length} urgencias visibles para operación. {activeCount} requieren seguimiento activo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {emergencies.length > 0 ? (
            emergencies.map((emergency) => (
              <article key={emergency.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{emergency.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {emergency.clientName} · {emergency.address.label}, {emergency.address.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatEmergencyStatus(emergency.status)}</Badge>
                    <Badge variant="outline">{emergency.category.name}</Badge>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <span>Creada: {formatDate(emergency.createdAt)}</span>
                  <span>Vence: {formatDate(emergency.expiresAt)}</span>
                  <span>Ronda: {emergency.dispatchRound}</span>
                  <span>Candidatos: {emergency.candidateCount}</span>
                </div>

                {emergency.assignedContractorName ? (
                  <p className="mt-2 text-sm text-foreground">Trabajador: {emergency.assignedContractorName}</p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Todavía no hay urgencias registradas.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
