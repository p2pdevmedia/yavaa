'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { Activity, CheckCircle2, Maximize2, Pencil, Save, X, XCircle } from 'lucide-react';
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

type ContractorReviewAction = 'APPROVED' | 'REJECTED';

type ContractorImagePreview = {
  label: string;
  url: string;
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
  const [contractorReviewNotes, setContractorReviewNotes] = useState(user.contractorProfile?.reviewNotes ?? '');
  const [imagePreview, setImagePreview] = useState<ContractorImagePreview | null>(null);
  const [isReviewingContractor, setIsReviewingContractor] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function openImagePreview(preview: ContractorImagePreview) {
    setImagePreview(preview);
  }

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

  async function submitContractorReview(approvalStatus: ContractorReviewAction) {
    if (!currentUser.contractorProfile) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsReviewingContractor(true);

    try {
      const response = await fetch(`/api/admin/contractors/${currentUser.contractorProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus,
          reviewNotes: contractorReviewNotes.trim() || null
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos verificar el contratista.'));
        return;
      }

      const reviewedProfile = (payload as { contractorProfile?: Partial<NonNullable<AdminUserDetailData['contractorProfile']>> } | null)
        ?.contractorProfile;

      if (reviewedProfile) {
        setCurrentUser((current) =>
          current.contractorProfile
            ? {
                ...current,
                contractorProfile: {
                  ...current.contractorProfile,
                  ...reviewedProfile
                }
              }
            : current
        );
        setContractorReviewNotes(reviewedProfile.reviewNotes ?? '');
      }

      setStatusMessage(
        approvalStatus === 'APPROVED' ? 'Contratista aprobado.' : 'Contratista rechazado.'
      );
    } catch {
      setErrorMessage('No pudimos verificar el contratista.');
    } finally {
      setIsReviewingContractor(false);
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

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display text-2xl">Verificación de contratista</CardTitle>
              <CardDescription>Revisión operativa del perfil laboral y documentación cargada.</CardDescription>
            </div>
            {currentUser.contractorProfile ? (
              <Badge
                variant={currentUser.contractorProfile.approvalStatus === 'APPROVED' ? 'secondary' : 'outline'}
              >
                {currentUser.contractorProfile.approvalStatus}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser.contractorProfile ? (
            <>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">DNI</p>
                  <p className="mt-1 font-medium text-foreground">
                    {currentUser.contractorProfile.dniNumber ?? 'sin DNI'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Enviado</p>
                  <p className="mt-1 font-medium text-foreground">
                    {formatDate(currentUser.contractorProfile.submittedAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Revisado</p>
                  <p className="mt-1 font-medium text-foreground">
                    {formatDate(currentUser.contractorProfile.reviewedAt)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                {currentUser.contractorProfile.profilePhotoUrl ? (
                  <ContractorDocumentThumbnail
                    label="Foto de perfil"
                    url={currentUser.contractorProfile.profilePhotoUrl}
                    onOpen={openImagePreview}
                  />
                ) : null}
                {currentUser.contractorProfile.dniFrontUrl ? (
                  <ContractorDocumentThumbnail
                    label="DNI frente"
                    url={currentUser.contractorProfile.dniFrontUrl}
                    onOpen={openImagePreview}
                  />
                ) : null}
                {currentUser.contractorProfile.dniBackUrl ? (
                  <ContractorDocumentThumbnail
                    label="DNI dorso"
                    url={currentUser.contractorProfile.dniBackUrl}
                    onOpen={openImagePreview}
                  />
                ) : null}
              </div>

              {['DRAFT', 'PENDING_REVIEW', 'APPROVED'].includes(currentUser.contractorProfile.approvalStatus) ? (
                <div className="space-y-3">
                  {currentUser.contractorProfile.approvalStatus === 'DRAFT' ? (
                    <p className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      Este perfil está en borrador. Revisá que tenga datos suficientes antes de aprobarlo.
                    </p>
                  ) : null}
                  {currentUser.contractorProfile.approvalStatus === 'APPROVED' ? (
                    <p className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      Este contratista está aprobado. Podés rechazarlo para retirarlo de discovery y pedirle que
                      vuelva a enviar los datos.
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="admin-contractor-review-notes">Notas de revisión</Label>
                    <Textarea
                      id="admin-contractor-review-notes"
                      value={contractorReviewNotes}
                      onChange={(event) => setContractorReviewNotes(event.target.value)}
                      placeholder="Documentación verificada, observaciones o motivo de rechazo"
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.contractorProfile.approvalStatus !== 'APPROVED' ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void submitContractorReview('APPROVED')}
                        disabled={isReviewingContractor}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Aprobar contratista
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => void submitContractorReview('REJECTED')}
                      disabled={isReviewingContractor}
                    >
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      {currentUser.contractorProfile.approvalStatus === 'APPROVED'
                        ? 'Solicitar reenvío de datos'
                        : 'Rechazar contratista'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {currentUser.contractorProfile.approvalStatus === 'APPROVED'
                      ? 'Este contratista ya está verificado.'
                      : 'Este contratista ya fue rechazado.'}
                </p>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Este usuario todavía no tiene perfil laboral para verificar.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityCard title="Bookings como cliente" items={currentUser.bookingsAsClient} />
        <ActivityCard title="Bookings como contractor" items={currentUser.bookingsAsContractor} />
      </div>

      {imagePreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-contractor-image-preview-title"
        >
          <div className="max-h-full w-full max-w-5xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Imagen ampliada</p>
                <h3 id="admin-contractor-image-preview-title" className="font-display text-2xl text-foreground">
                  {imagePreview.label}
                </h3>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setImagePreview(null)}>
                <X className="h-4 w-4" aria-hidden="true" />
                Cerrar
              </Button>
            </div>
            <div className="flex max-h-[78vh] items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-card">
              <Image
                src={imagePreview.url}
                alt={`Imagen ampliada de ${imagePreview.label}`}
                width={1200}
                height={900}
                unoptimized
                className="max-h-[78vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ContractorDocumentThumbnail({
  label,
  url,
  onOpen
}: {
  label: string;
  url: string;
  onOpen: (preview: ContractorImagePreview) => void;
}) {
  return (
    <button
      type="button"
      className="group overflow-hidden rounded-lg border border-border/70 bg-background/60 text-left transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onOpen({ label, url })}
    >
      <span className="block px-3 pb-2 pt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <span className="relative block h-32 overflow-hidden bg-muted">
        <Image
          src={url}
          alt={`Miniatura de ${label}`}
          width={320}
          height={180}
          unoptimized
          className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
        />
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          Ampliar foto
        </span>
      </span>
    </button>
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
