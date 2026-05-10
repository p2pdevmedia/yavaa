'use client';

import { Ban, Check, RotateCcw, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { dashboardAdminSections } from '@/lib/dashboard-admin-sections';
import type { DashboardAdminData } from '@/lib/dashboard-admin';

type UserStatus = DashboardAdminData['users'][number]['status'];
type CategoryStatus = DashboardAdminData['categories'][number]['status'];
type ContractorStatus = DashboardAdminData['contractorProfiles'][number]['approvalStatus'];

type CategoryDraft = {
  slug: string;
  name: string;
  group: string;
  status: CategoryStatus;
};

type AdminPanelProps = {
  initialData: DashboardAdminData;
};

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

export function AdminPanel({ initialData }: AdminPanelProps) {
  const [users, setUsers] = useState(initialData.users);
  const [contractorProfiles, setContractorProfiles] = useState(initialData.contractorProfiles);
  const [categories, setCategories] = useState(initialData.categories);
  const [bookings, setBookings] = useState(initialData.bookings);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>({
    slug: '',
    name: '',
    group: '',
    status: 'PENDING_REVIEW'
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function clearFeedback() {
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function updateUserStatus(userId: string, nextStatus: UserStatus) {
    clearFeedback();
    const reason =
      nextStatus === 'ACTIVE'
        ? null
        : window.prompt('Motivo operativo')?.trim() ?? '';

    if (nextStatus !== 'ACTIVE' && (reason ?? '').length < 8) {
      setErrorMessage('El motivo debe tener al menos 8 caracteres.');
      return;
    }

    if (!window.confirm(`Confirmar cambio de usuario a ${nextStatus}`)) {
      return;
    }

    setBusyKey(`user:${userId}`);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          reason
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos actualizar el usuario.'));
        return;
      }

      const updatedUser = (payload as { user?: DashboardAdminData['users'][number] } | null)?.user;

      if (updatedUser) {
        setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      }

      setStatusMessage('Usuario actualizado.');
    } catch {
      setErrorMessage('No pudimos actualizar el usuario.');
    } finally {
      setBusyKey(null);
    }
  }

  async function reviewContractor(contractorProfileId: string, approvalStatus: Extract<ContractorStatus, 'APPROVED' | 'REJECTED'>) {
    clearFeedback();
    const reviewNotes = window.prompt('Nota de revisión')?.trim() ?? null;

    if (!window.confirm(`Confirmar contractor ${approvalStatus}`)) {
      return;
    }

    setBusyKey(`contractor:${contractorProfileId}`);

    try {
      const response = await fetch(`/api/admin/contractors/${contractorProfileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus,
          reviewNotes
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos revisar el contractor.'));
        return;
      }

      const reviewed = (payload as {
        contractorProfile?: Pick<
          DashboardAdminData['contractorProfiles'][number],
          'id' | 'approvalStatus' | 'reviewNotes' | 'reviewedAt' | 'reviewedByUserId'
        >;
      } | null)?.contractorProfile;

      if (reviewed) {
        setContractorProfiles((current) =>
          current.map((profile) => (profile.id === reviewed.id ? { ...profile, ...reviewed } : profile))
        );
      }

      setStatusMessage('Contractor revisado.');
    } catch {
      setErrorMessage('No pudimos revisar el contractor.');
    } finally {
      setBusyKey(null);
    }
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setBusyKey('category:create');

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: categoryDraft.slug,
          name: categoryDraft.name,
          group: categoryDraft.group || null,
          status: categoryDraft.status
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos guardar la categoría.'));
        return;
      }

      const category = (payload as { category?: DashboardAdminData['categories'][number] } | null)?.category;

      if (category) {
        setCategories((current) => {
          const exists = current.some((item) => item.id === category.id);
          return exists
            ? current.map((item) => (item.id === category.id ? category : item))
            : [...current, category].sort((left, right) => left.name.localeCompare(right.name));
        });
        setCategoryDraft({ slug: '', name: '', group: '', status: 'PENDING_REVIEW' });
      }

      setStatusMessage('Categoría guardada.');
    } catch {
      setErrorMessage('No pudimos guardar la categoría.');
    } finally {
      setBusyKey(null);
    }
  }

  async function updateCategoryStatus(category: DashboardAdminData['categories'][number], status: CategoryStatus) {
    clearFeedback();

    if (!window.confirm(`Confirmar categoría ${category.slug} como ${status}`)) {
      return;
    }

    setBusyKey(`category:${category.id}`);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: category.slug,
          name: category.name,
          group: category.group,
          status
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos actualizar la categoría.'));
        return;
      }

      const updatedCategory = (payload as { category?: DashboardAdminData['categories'][number] } | null)?.category;

      if (updatedCategory) {
        setCategories((current) =>
          current.map((item) => (item.id === updatedCategory.id ? updatedCategory : item))
        );
      }

      setStatusMessage('Categoría actualizada.');
    } catch {
      setErrorMessage('No pudimos actualizar la categoría.');
    } finally {
      setBusyKey(null);
    }
  }

  async function cancelBooking(bookingId: string) {
    clearFeedback();
    const reason = window.prompt('Motivo de cancelación')?.trim() ?? '';

    if (reason.length < 8) {
      setErrorMessage('El motivo debe tener al menos 8 caracteres.');
      return;
    }

    if (!window.confirm('Confirmar cancelación admin del booking')) {
      return;
    }

    setBusyKey(`booking:${bookingId}`);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/correction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos corregir el booking.'));
        return;
      }

      const booking = (payload as { booking?: DashboardAdminData['bookings'][number] } | null)?.booking;

      if (booking) {
        setBookings((current) => current.map((item) => (item.id === booking.id ? booking : item)));
      }

      setStatusMessage('Booking corregido.');
    } catch {
      setErrorMessage('No pudimos corregir el booking.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="admin-panel-title">
      <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
          <h2 id="admin-panel-title" className="font-display text-3xl text-foreground">
            Operación del marketplace
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{users.length} usuarios</Badge>
          <Badge variant="secondary">{contractorProfiles.length} contractors</Badge>
          <Badge variant="secondary">{categories.length} categorías</Badge>
          <Badge variant="secondary">{bookings.length} bookings</Badge>
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

      <nav
        aria-label="Secciones de administración"
        className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto border-b border-border/70 bg-background/90 px-1 py-3 backdrop-blur"
      >
        {dashboardAdminSections.map((section) => (
          <a
            key={section.id}
            href={section.href}
            className="rounded-lg border border-border/70 bg-card/90 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="usuarios" className="scroll-mt-24 border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Usuarios</CardTitle>
            <CardDescription>Estados operativos y roles principales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{user.displayName ?? user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.status === 'ACTIVE' ? 'secondary' : 'outline'}>{user.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role.slug} variant="outline">
                      {role.slug}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyKey === `user:${user.id}` || user.status === 'ACTIVE'}
                    onClick={() => updateUserStatus(user.id, 'ACTIVE')}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    Activar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyKey === `user:${user.id}` || user.status === 'SUSPENDED'}
                    onClick={() => updateUserStatus(user.id, 'SUSPENDED')}
                  >
                    <Ban size={16} aria-hidden="true" />
                    Suspender
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyKey === `user:${user.id}` || user.status === 'BLOCKED'}
                    onClick={() => updateUserStatus(user.id, 'BLOCKED')}
                  >
                    <Ban size={16} aria-hidden="true" />
                    Bloquear
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card id="contractors" className="scroll-mt-24 border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Contractors</CardTitle>
            <CardDescription>Revisión operativa de perfiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contractorProfiles.map((profile) => (
              <div key={profile.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{profile.user.displayName ?? profile.user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.categories.map((category) => category.name).join(', ') || 'Sin categorías'}
                    </p>
                  </div>
                  <Badge variant={profile.approvalStatus === 'APPROVED' ? 'secondary' : 'outline'}>
                    {profile.approvalStatus}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Enviado: {formatDate(profile.submittedAt)} · Usuario {profile.user.status}
                </p>
                {profile.reviewNotes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{profile.reviewNotes}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyKey === `contractor:${profile.id}` || profile.approvalStatus !== 'PENDING_REVIEW'}
                    onClick={() => reviewContractor(profile.id, 'APPROVED')}
                  >
                    <Check size={16} aria-hidden="true" />
                    Aprobar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyKey === `contractor:${profile.id}` || profile.approvalStatus !== 'PENDING_REVIEW'}
                    onClick={() => reviewContractor(profile.id, 'REJECTED')}
                  >
                    <Ban size={16} aria-hidden="true" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="categorias" className="scroll-mt-24 border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Categorías</CardTitle>
            <CardDescription>Catálogo moderado del marketplace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-4" onSubmit={submitCategory}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-category-slug">Slug</Label>
                  <Input
                    id="admin-category-slug"
                    value={categoryDraft.slug}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="pet-care"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-category-name">Nombre</Label>
                  <Input
                    id="admin-category-name"
                    value={categoryDraft.name}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Pet Care"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-category-group">Grupo</Label>
                  <Input
                    id="admin-category-group"
                    value={categoryDraft.group}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, group: event.target.value }))}
                    placeholder="home services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-category-status">Estado</Label>
                  <select
                    id="admin-category-status"
                    className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    value={categoryDraft.status}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({
                        ...current,
                        status: event.target.value as CategoryStatus
                      }))
                    }
                  >
                    <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={busyKey === 'category:create'}>
                <Save size={16} aria-hidden="true" />
                Guardar categoría
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{category.status}</Badge>
                      {category.isInitial ? <Badge variant="secondary">Inicial</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['ACTIVE', 'PENDING_REVIEW', 'INACTIVE'] as const).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyKey === `category:${category.id}` || category.status === status}
                        onClick={() => updateCategoryStatus(category, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card id="bookings" className="scroll-mt-24 border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Bookings conflictivos</CardTitle>
            <CardDescription>Correcciones operativas con trazabilidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{booking.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.client.displayName ?? booking.client.email} ·{' '}
                      {booking.contractorProfile.user.displayName ?? booking.contractorProfile.user.email}
                    </p>
                  </div>
                  <Badge variant={booking.status === 'ACCEPTED' ? 'secondary' : 'outline'}>{booking.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {booking.category.name} · {formatDate(booking.scheduledFor)}
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      busyKey === `booking:${booking.id}` ||
                      !['PENDING_ACCEPTANCE', 'ACCEPTED', 'RESCHEDULE_REQUESTED'].includes(booking.status)
                    }
                    onClick={() => cancelBooking(booking.id)}
                  >
                    <Ban size={16} aria-hidden="true" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
