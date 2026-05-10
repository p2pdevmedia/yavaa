'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardAdminSections } from '@/lib/dashboard-admin-sections';
import type { DashboardAdminData } from '@/lib/dashboard-admin';

type AdminPanelProps = {
  initialData: DashboardAdminData;
};

function getSectionCount(sectionId: string, data: DashboardAdminData): number {
  if (sectionId === 'usuarios') {
    return data.users.length;
  }

  if (sectionId === 'contractors') {
    return data.contractorProfiles.length;
  }

  if (sectionId === 'categorias') {
    return data.categories.length;
  }

  if (sectionId === 'bookings') {
    return data.bookings.length;
  }

  if (sectionId === 'urgencias') {
    return data.emergencies.length;
  }

  return 0;
}

function getSectionDescription(sectionId: string): string {
  if (sectionId === 'usuarios') {
    return 'CRUD operativo, estados, roles y vista de inspección por usuario.';
  }

  if (sectionId === 'contractors') {
    return 'Revisión de perfiles de trabajadores y documentación operativa.';
  }

  if (sectionId === 'categorias') {
    return 'Crear, editar, inactivar y borrar categorías cuando no tengan uso histórico.';
  }

  if (sectionId === 'urgencias') {
    return 'Vista operativa de todas las urgencias y emergencias del marketplace.';
  }

  return 'Correcciones operativas sobre reservas conflictivas.';
}

export function AdminPanel({ initialData }: AdminPanelProps) {
  return (
    <section className="space-y-6" aria-labelledby="admin-panel-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
        <h2 id="admin-panel-title" className="font-display text-3xl text-foreground">
          Operación del marketplace
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Cada dominio administrativo tiene su propia página para que operación pueda trabajar sin perder contexto ni
          navegación del dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {dashboardAdminSections.map((section) => (
          <Card key={section.id} className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-2xl">{section.label}</CardTitle>
                  <CardDescription>{getSectionDescription(section.id)}</CardDescription>
                </div>
                <Badge variant="secondary">{getSectionCount(section.id, initialData)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href={section.href}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                Abrir sección
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
