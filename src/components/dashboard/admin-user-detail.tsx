'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Activity, Pencil, Save, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdminUserDetail as AdminUserDetailData } from '@/lib/admin-users';

type AdminUserDetailProps = {
  user: AdminUserDetailData;
};

type AdminUserEditDraft = {
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
};

function buildEditDraft(user: AdminUserDetailData): AdminUserEditDraft {
  return {
    displayName: user.displayName ?? '',
    firstName: user.profile?.firstName ?? '',
    lastName: user.profile?.lastName ?? '',
    phone: user.profile?.phone ?? '',
    bio: user.profile?.bio ?? ''
  };
}

function readError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const message = 'message' in payload ? payload.message : null;
    const error = 'error' in payload ? payload.error : null;

    if (typeof message === 'string') {
      return message;
    }

    if (typeof error === 'string') {
      return error;
    }
  }

  return fallback;
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

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
  const [currentUser, setCurrentUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<AdminUserEditDraft>(() => buildEditDraft(user));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: draft.displayName || null,
          firstName: draft.firstName || null,
          lastName: draft.lastName || null,
          phone: draft.phone || null,
          bio: draft.bio || null
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos actualizar el usuario.'));
        return;
      }

      const updatedUser = (payload as { user?: AdminUserDetailData } | null)?.user;

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setDraft(buildEditDraft(updatedUser));
      }

      setIsEditing(false);
      setStatusMessage('Usuario actualizado.');
    } catch {
      setErrorMessage('No pudimos actualizar el usuario.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="admin-user-detail-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Usuario</p>
            <h2 id="admin-user-detail-title" className="font-display text-3xl text-foreground">
              {displayName(currentUser)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{currentUser.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft(buildEditDraft(currentUser));
                setIsEditing(true);
                setErrorMessage(null);
                setStatusMessage(null);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/admin/usuarios/${currentUser.id}/actividad` as Route}>
                <Activity className="h-4 w-4" aria-hidden="true" />
                Ver actividad auditada
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={'/dashboard/admin/usuarios' as Route}>Volver a usuarios</Link>
            </Button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}

      {isEditing ? (
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Editar usuario</CardTitle>
            <CardDescription>Datos básicos visibles para operación y el perfil del usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitEdit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-user-display-name">Nombre visible</Label>
                  <Input
                    id="admin-user-display-name"
                    value={draft.displayName}
                    onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-phone">Teléfono</Label>
                  <Input
                    id="admin-user-phone"
                    value={draft.phone}
                    onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-user-first-name">Nombre</Label>
                  <Input
                    id="admin-user-first-name"
                    value={draft.firstName}
                    onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-last-name">Apellido</Label>
                  <Input
                    id="admin-user-last-name"
                    value={draft.lastName}
                    onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-user-bio">Bio</Label>
                <Textarea
                  id="admin-user-bio"
                  value={draft.bio}
                  onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                  rows={4}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={isSaving}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Guardar cambios
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Identidad</CardTitle>
            <CardDescription>Datos básicos y roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={currentUser.status === 'ACTIVE' ? 'secondary' : 'outline'}>{currentUser.status}</Badge>
              {currentUser.roles.map((role) => (
                <Badge key={role.slug} variant="outline">
                  {role.slug}
                </Badge>
              ))}
            </div>
            <p>
              <span className="text-muted-foreground">Nombre: </span>
              {[currentUser.profile?.firstName, currentUser.profile?.lastName].filter(Boolean).join(' ') ||
                'sin nombre'}
            </p>
            <p>
              <span className="text-muted-foreground">Teléfono: </span>
              {currentUser.profile?.phone ?? 'sin teléfono'}
            </p>
            <p>
              <span className="text-muted-foreground">Creado: </span>
              {formatDate(currentUser.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Contractor</CardTitle>
            <CardDescription>Perfil de trabajador asociado a este usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {currentUser.contractorProfile ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={currentUser.contractorProfile.approvalStatus === 'APPROVED' ? 'secondary' : 'outline'}
                  >
                    {currentUser.contractorProfile.approvalStatus}
                  </Badge>
                  {currentUser.contractorProfile.acceptsEmergencies ? (
                    <Badge variant="secondary">Urgencias</Badge>
                  ) : null}
                </div>
                <p>
                  <span className="text-muted-foreground">DNI: </span>
                  {currentUser.contractorProfile.dniNumber ?? 'sin DNI'}
                </p>
                <p>
                  <span className="text-muted-foreground">Zona: </span>
                  {currentUser.contractorProfile.workZones.map((zone) => zone.name).join(', ') || 'sin zonas'}
                </p>
                <p>
                  <span className="text-muted-foreground">Categorías: </span>
                  {currentUser.contractorProfile.categories.map((category) => category.name).join(', ') ||
                    'sin categorías'}
                </p>
                <p>
                  <span className="text-muted-foreground">Revisión: </span>
                  {currentUser.contractorProfile.reviewNotes ?? 'sin notas'}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Este usuario todavía no tiene perfil de trabajador.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityCard title="Bookings como cliente" items={currentUser.bookingsAsClient} />
        <ActivityCard title="Bookings como contractor" items={currentUser.bookingsAsContractor} />
      </div>
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
