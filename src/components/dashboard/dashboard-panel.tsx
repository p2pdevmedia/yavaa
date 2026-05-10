'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { Route } from 'next';
import { Bell } from 'lucide-react';

import { AdminPanel } from '@/components/dashboard/admin-panel';
import { BookingWorkspace } from '@/components/dashboard/booking-workspace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { dashboardProfilePath, type DashboardView } from '@/lib/dashboard-routes';
import type { DashboardNotification } from '@/lib/dashboard-notifications';
import type { DashboardAdminData } from '@/lib/dashboard-admin';
import type { DashboardBooking } from '@/lib/dashboard-workspace';

type DashboardUserStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
type DashboardRoleSlug = 'client' | 'contractor' | 'admin' | 'support';

type DashboardUser = {
  id: string;
  email: string;
  supabaseAuthId: string | null;
  displayName: string | null;
  status: DashboardUserStatus;
  roles: DashboardRoleSlug[];
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    bio: string | null;
  } | null;
  addresses: Array<{
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    notes: string | null;
    type: string;
    isDefault: boolean;
    market: {
      id: string;
      slug: string;
      city: string;
      province: string;
      country: string;
    } | null;
  }>;
  contractorProfile: {
    id: string;
    approvalStatus: string;
    acceptsEmergencies: boolean;
    dniNumber: string | null;
    dniFrontUrl: string | null;
    dniBackUrl: string | null;
    profilePhotoUrl: string | null;
    reviewNotes: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewedByUserId: string | null;
    addressId: string | null;
    categories: Array<{
      category: {
        id: string;
        slug: string;
        name: string;
        group: string | null;
      };
      isPrimary: boolean;
    }>;
    workZones: Array<{
      workZone: {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        market: {
          id: string;
          slug: string;
          city: string;
          province: string;
          country: string;
        };
      };
    }>;
  } | null;
};

type DashboardCategory = {
  id: string;
  slug: string;
  name: string;
  group: string | null;
  isInitial: boolean;
};

type UserEnvelope = {
  appUser: DashboardUser | null;
};

export type DashboardPanelProps = {
  view: DashboardView;
  initialUser: DashboardUser;
  email: string | null;
  categories: DashboardCategory[];
  bookings: DashboardBooking[];
  notifications: DashboardNotification[];
  adminData: DashboardAdminData | null;
};

type ProfileDraft = {
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  phone: string;
  bio: string;
};

type AddressDraft = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
  type: 'HOME' | 'WORK' | 'OTHER';
};

type EmergencyDraft = {
  categoryId: string;
  addressId: string;
  description: string;
};

type DashboardMode = 'client' | 'contractor';

function toStringOrEmpty(value: string | null | undefined): string {
  return value ?? '';
}

function buildProfileDraft(user: DashboardUser): ProfileDraft {
  return {
    displayName: toStringOrEmpty(user.displayName),
    firstName: toStringOrEmpty(user.profile?.firstName),
    lastName: toStringOrEmpty(user.profile?.lastName),
    avatarUrl: toStringOrEmpty(user.profile?.avatarUrl),
    phone: toStringOrEmpty(user.profile?.phone),
    bio: toStringOrEmpty(user.profile?.bio)
  };
}

function buildAddressDraft(user: DashboardUser): AddressDraft {
  const fallbackAddress = user.addresses[0];

  return {
    label: '',
    line1: '',
    line2: '',
    city: fallbackAddress?.city ?? '',
    province: fallbackAddress?.province ?? '',
    postalCode: fallbackAddress?.postalCode ?? '',
    notes: '',
    type: 'HOME'
  };
}

function buildEmergencyDraft(user: DashboardUser, categories: DashboardCategory[]): EmergencyDraft {
  return {
    categoryId: categories[0]?.id ?? '',
    addressId: user.addresses[0]?.id ?? '',
    description: ''
  };
}

function formatName(user: DashboardUser): string {
  const namePieces = [user.profile?.firstName, user.profile?.lastName].filter(
    (value): value is string => Boolean(value)
  );
  return namePieces.length > 0 ? namePieces.join(' ') : user.displayName ?? user.email;
}

function formatUtcDateTime(value: string): string {
  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

function isAdminUser(user: DashboardUser): boolean {
  return user.roles.includes('admin');
}

function hasContractorMode(user: DashboardUser): boolean {
  return user.roles.includes('contractor') || Boolean(user.contractorProfile);
}

function getInitialDashboardMode(user: DashboardUser): DashboardMode {
  return hasContractorMode(user) ? 'contractor' : 'client';
}

function getUserInitials(user: DashboardUser): string {
  const namePieces = [user.profile?.firstName, user.profile?.lastName].filter(
    (value): value is string => Boolean(value)
  );

  if (namePieces.length >= 2) {
    return `${namePieces[0][0]}${namePieces[1][0]}`.toUpperCase();
  }

  return formatName(user).slice(0, 2).toUpperCase();
}

export function DashboardPanel({
  view,
  initialUser,
  email,
  categories,
  bookings,
  notifications,
  adminData
}: DashboardPanelProps) {
  const [user, setUser] = useState(initialUser);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => buildProfileDraft(initialUser));
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(() => buildAddressDraft(initialUser));
  const [emergencyDraft, setEmergencyDraft] = useState<EmergencyDraft>(() =>
    buildEmergencyDraft(initialUser, categories)
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressStatus, setAddressStatus] = useState<string | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [isSavingEmergencyAvailability, setIsSavingEmergencyAvailability] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSwitchingContractorMode, setIsSwitchingContractorMode] = useState(false);
  const [acceptsEmergencies, setAcceptsEmergencies] = useState(
    initialUser.contractorProfile?.acceptsEmergencies ?? false
  );
  const [activeMode, setActiveMode] = useState<DashboardMode>(() => getInitialDashboardMode(initialUser));
  const [modeError, setModeError] = useState<string | null>(null);
  const [modeStatus, setModeStatus] = useState<string | null>(null);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);

  async function parseEnvelope(response: Response): Promise<UserEnvelope | null> {
    try {
      return (await response.json()) as UserEnvelope;
    } catch {
      return null;
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileStatus(null);
    setIsSavingProfile(true);

    try {
      const response = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: profileDraft.displayName || null,
          firstName: profileDraft.firstName || null,
          lastName: profileDraft.lastName || null,
          avatarUrl: profileDraft.avatarUrl || null,
          phone: profileDraft.phone || null,
          bio: profileDraft.bio || null
        })
      });

      const payload = await parseEnvelope(response);

      if (!response.ok) {
        setProfileError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos guardar el perfil.'
        );
        return;
      }

      if (payload?.appUser) {
        setUser(payload.appUser);
        setProfileDraft(buildProfileDraft(payload.appUser));
        setAddressDraft(buildAddressDraft(payload.appUser));
      }

      setProfileStatus('Perfil actualizado.');
    } catch {
      setProfileError('No pudimos guardar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddressError(null);
    setAddressStatus(null);
    setIsSavingAddress(true);

    try {
      const response = await fetch('/api/me/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: addressDraft.label,
          line1: addressDraft.line1,
          line2: addressDraft.line2 || null,
          city: addressDraft.city,
          province: addressDraft.province,
          postalCode: addressDraft.postalCode || null,
          notes: addressDraft.notes || null,
          type: addressDraft.type,
          isDefault: true
        })
      });

      const payload = await parseEnvelope(response);

      if (!response.ok) {
        setAddressError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos crear la dirección.'
        );
        return;
      }

      const nextAppUser = payload?.appUser;

      if (nextAppUser) {
        setUser(nextAppUser);
        setProfileDraft(buildProfileDraft(nextAppUser));
        setAddressDraft(buildAddressDraft(nextAppUser));
        setEmergencyDraft((current) => ({
          ...current,
          addressId: nextAppUser.addresses[0]?.id ?? current.addressId
        }));
      } else {
        setAddressDraft(buildAddressDraft(user));
      }

      setAddressStatus('Dirección agregada.');
    } catch {
      setAddressError('No pudimos crear la dirección.');
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleEmergencySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmergencyError(null);
    setEmergencyStatus(null);
    setIsSavingEmergency(true);

    try {
      const response = await fetch('/api/emergencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: emergencyDraft.categoryId,
          addressId: emergencyDraft.addressId,
          description: emergencyDraft.description
        })
      });

      const payload = await parseEnvelope(response);

      if (!response.ok) {
        setEmergencyError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos crear la urgencia.'
        );
        return;
      }

      setEmergencyStatus('Urgencia creada y enviada a contractors elegibles.');
      setEmergencyDraft((current) => ({
        ...current,
        description: ''
      }));
    } catch {
      setEmergencyError('No pudimos crear la urgencia.');
    } finally {
      setIsSavingEmergency(false);
    }
  }

  async function handleEmergencyAvailabilityToggle() {
    setEmergencyError(null);
    setEmergencyStatus(null);
    setIsSavingEmergencyAvailability(true);

    try {
      const response = await fetch('/api/me/contractor-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acceptsEmergencies: !acceptsEmergencies
        })
      });

      const payload = await parseEnvelope(response);

      if (!response.ok) {
        setEmergencyError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos actualizar la disponibilidad para urgencias.'
        );
        return;
      }

      if (payload?.appUser?.contractorProfile) {
        setUser(payload.appUser);
        setAcceptsEmergencies(payload.appUser.contractorProfile.acceptsEmergencies);
      } else {
        setAcceptsEmergencies((current) => !current);
      }

      setEmergencyStatus('Disponibilidad de urgencias actualizada.');
    } catch {
      setEmergencyError('No pudimos actualizar la disponibilidad para urgencias.');
    } finally {
      setIsSavingEmergencyAvailability(false);
    }
  }

  async function handleContractorModeSelect() {
    setModeError(null);
    setModeStatus(null);

    if (hasContractorMode(user)) {
      setActiveMode('contractor');
      setModeStatus('Modo contratista activo.');
      return;
    }

    setIsSwitchingContractorMode(true);

    try {
      const response = await fetch('/api/me/contractor-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acceptsEmergencies: false
        })
      });

      const payload = await parseEnvelope(response);

      if (!response.ok) {
        setModeError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos activar el modo contratista.'
        );
        return;
      }

      if (payload?.appUser) {
        setUser(payload.appUser);
        setProfileDraft(buildProfileDraft(payload.appUser));
        setAddressDraft(buildAddressDraft(payload.appUser));
        setAcceptsEmergencies(payload.appUser.contractorProfile?.acceptsEmergencies ?? false);
      }

      setActiveMode('contractor');
      setModeStatus('Modo contratista activado. Tu perfil quedó en borrador.');
    } catch {
      setModeError('No pudimos activar el modo contratista.');
    } finally {
      setIsSwitchingContractorMode(false);
    }
  }

  const primaryAddress = user.addresses.find((address) => address.isDefault) ?? user.addresses[0] ?? null;
  const unreadNotificationCount = notifications.filter((notification) => !notification.isRead).length;
  const userInitials = getUserInitials(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{user.status}</Badge>
            {user.roles.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
          <h2 className="font-display text-3xl text-foreground">{formatName(user)}</h2>
          <p className="text-sm text-muted-foreground">{email ?? user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              aria-label="Abrir notificaciones"
              aria-expanded={notificationPopoverOpen}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => setNotificationPopoverOpen((current) => !current)}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.68rem] font-semibold text-primary-foreground">
                  {unreadNotificationCount}
                </span>
              ) : null}
            </button>

            {notificationPopoverOpen ? (
              <div className="absolute right-0 top-14 z-20 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border/80 bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Campana</p>
                    <h3 className="font-display text-xl font-semibold text-foreground">Notificaciones</h3>
                  </div>
                  <Badge variant={unreadNotificationCount > 0 ? 'default' : 'secondary'}>
                    {unreadNotificationCount > 0 ? `${unreadNotificationCount} nuevas` : 'Al día'}
                  </Badge>
                </div>

                <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <article key={notification.id} className="rounded-lg border border-border/70 bg-background/45 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={notification.isRead ? 'outline' : 'secondary'}>
                            {notification.typeLabel}
                          </Badge>
                          {!notification.isRead ? <Badge variant="default">Nueva</Badge> : null}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{notification.title}</p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatUtcDateTime(notification.createdAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {notification.bookingId ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={'/dashboard/bookings' as Route}>Ver booking</Link>
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant="outline">
                              <Link href={dashboardProfilePath}>Abrir perfil</Link>
                            </Button>
                          )}
                          <span className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                            {notification.isRead ? 'Leída' : 'Sin leer'}
                          </span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                      No hay notificaciones por ahora.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href={dashboardProfilePath}
            aria-label="Abrir perfil"
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted font-display text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {user.profile?.avatarUrl ? (
              <span
                aria-hidden="true"
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${user.profile.avatarUrl})` }}
              />
            ) : (
              userInitials
            )}
          </Link>

          <div className="rounded-lg border border-border/70 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Direcciones</p>
            <p className="font-mono text-foreground">{user.addresses.length}</p>
          </div>
          <div className="rounded-lg border border-border/70 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Contractor</p>
            <p className="font-mono text-foreground">{user.contractorProfile?.approvalStatus ?? 'none'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Urgencias: {user.contractorProfile?.acceptsEmergencies ? 'activa' : 'inactiva'}
            </p>
          </div>
        </div>
      </div>

      {!isAdminUser(user) ? (
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Modo de uso</CardTitle>
            <CardDescription>Podés operar como cliente o activar tu perfil contratista sin aprobación previa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Modo activo del dashboard">
              <Button
                type="button"
                variant={activeMode === 'client' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveMode('client');
                  setModeError(null);
                  setModeStatus('Modo cliente activo.');
                }}
              >
                Modo cliente
              </Button>
              <Button
                type="button"
                variant={activeMode === 'contractor' ? 'default' : 'outline'}
                onClick={handleContractorModeSelect}
                disabled={isSwitchingContractorMode}
              >
                {isSwitchingContractorMode ? 'Activando...' : 'Modo contratista'}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {activeMode === 'contractor'
                ? `Perfil contratista: ${user.contractorProfile?.approvalStatus ?? 'DRAFT'}`
                : 'Modo cliente activo para buscar servicios, crear urgencias y manejar tus bookings.'}
            </p>

            {modeError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {modeError}
              </p>
            ) : null}

            {modeStatus ? (
              <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {modeStatus}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {view === 'admin' ? (
        adminData ? (
          <AdminPanel initialData={adminData} />
        ) : (
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
        )
      ) : null}

      {view === 'perfil' ? (
      <div className="grid gap-6">
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Perfil personal</CardTitle>
            <CardDescription>Actualiza tu nombre visible y datos básicos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Nombre visible</Label>
                  <Input
                    id="display-name"
                    value={profileDraft.displayName}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, displayName: event.target.value }))
                    }
                    placeholder="Tu nombre visible"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileDraft.phone}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+54 ..."
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input
                    id="first-name"
                    value={profileDraft.firstName}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, firstName: event.target.value }))
                    }
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input
                    id="last-name"
                    value={profileDraft.lastName}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, lastName: event.target.value }))
                    }
                    placeholder="Apellido"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar-url">Avatar URL</Label>
                <Input
                  id="avatar-url"
                  value={profileDraft.avatarUrl}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, avatarUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileDraft.bio}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, bio: event.target.value }))}
                  placeholder="Contá algo breve sobre vos"
                />
              </div>

              {profileError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {profileError}
                </p>
              ) : null}

              {profileStatus ? (
                <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {profileStatus}
                </p>
              ) : null}

              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? 'Guardando...' : 'Guardar perfil'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      ) : null}

      {view === 'perfil' ? (
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Direcciones guardadas</CardTitle>
            <CardDescription>Vemos tus direcciones guardadas y podés agregar una nueva.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {user.addresses.length > 0 ? (
                user.addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{address.label}</p>
                      {address.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                      <Badge variant="outline">{address.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''} · {address.city}, {address.province}
                      {address.postalCode ? ` · CP ${address.postalCode}` : ''}
                    </p>
                    {address.market ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Mercado: {address.market.city}, {address.market.province}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  Aún no hay direcciones guardadas.
                </p>
              )}
            </div>

            {primaryAddress ? (
              <>
                <Separator />
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dirección principal</p>
                <p className="text-sm text-foreground">
                  {primaryAddress.line1}
                  {primaryAddress.line2 ? `, ${primaryAddress.line2}` : ''} · {primaryAddress.city},{' '}
                  {primaryAddress.province}
                </p>
              </>
            ) : null}

            <Separator />

            <form className="space-y-4" onSubmit={handleAddressSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address-label">Etiqueta</Label>
                  <Input
                    id="address-label"
                    value={addressDraft.label}
                    onChange={(event) => setAddressDraft((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Casa, trabajo, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-type">Tipo</Label>
                  <select
                    id="address-type"
                    className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    value={addressDraft.type}
                    onChange={(event) =>
                      setAddressDraft((current) => ({
                        ...current,
                        type: event.target.value as AddressDraft['type']
                      }))
                    }
                  >
                    <option value="HOME">HOME</option>
                    <option value="WORK">WORK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="line1">Dirección</Label>
                <Input
                  id="line1"
                  value={addressDraft.line1}
                  onChange={(event) => setAddressDraft((current) => ({ ...current, line1: event.target.value }))}
                  placeholder="Calle y número"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={addressDraft.city}
                    onChange={(event) => setAddressDraft((current) => ({ ...current, city: event.target.value }))}
                    placeholder="San Martin de los Andes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input
                    id="province"
                    value={addressDraft.province}
                    onChange={(event) => setAddressDraft((current) => ({ ...current, province: event.target.value }))}
                    placeholder="Neuquen"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postal-code">Código postal</Label>
                  <Input
                    id="postal-code"
                    value={addressDraft.postalCode}
                    onChange={(event) =>
                      setAddressDraft((current) => ({ ...current, postalCode: event.target.value }))
                    }
                    placeholder="8370"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="line2">Piso/depto</Label>
                  <Input
                    id="line2"
                    value={addressDraft.line2}
                    onChange={(event) => setAddressDraft((current) => ({ ...current, line2: event.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address-notes">Notas</Label>
                <Textarea
                  id="address-notes"
                  value={addressDraft.notes}
                  onChange={(event) => setAddressDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Indicaciones adicionales"
                />
              </div>

              {addressError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {addressError}
                </p>
              ) : null}

              {addressStatus ? (
                <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {addressStatus}
                </p>
              ) : null}

              <Button type="submit" disabled={isSavingAddress}>
                {isSavingAddress ? 'Guardando...' : 'Agregar dirección'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {view === 'urgencias' ? (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Urgencias</CardTitle>
          <CardDescription>Dispará una solicitud urgente o marcate como disponible para responderlas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleEmergencySubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency-category">Categoría</Label>
                <select
                  id="emergency-category"
                  className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  value={emergencyDraft.categoryId}
                  onChange={(event) =>
                    setEmergencyDraft((current) => ({ ...current, categoryId: event.target.value }))
                  }
                  disabled={categories.length === 0}
                >
                  {categories.length === 0 ? <option value="">Sin categorías</option> : null}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-address">Dirección</Label>
                <select
                  id="emergency-address"
                  className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  value={emergencyDraft.addressId}
                  onChange={(event) =>
                    setEmergencyDraft((current) => ({ ...current, addressId: event.target.value }))
                  }
                  disabled={user.addresses.length === 0}
                >
                  {user.addresses.length === 0 ? <option value="">Sin direcciones</option> : null}
                  {user.addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} - {address.city}, {address.province}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-description">Descripción</Label>
              <Textarea
                id="emergency-description"
                value={emergencyDraft.description}
                onChange={(event) =>
                  setEmergencyDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Contá brevemente qué está pasando"
              />
            </div>

            {emergencyError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {emergencyError}
              </p>
            ) : null}

            {emergencyStatus ? (
              <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {emergencyStatus}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSavingEmergency || categories.length === 0 || user.addresses.length === 0}
            >
              {isSavingEmergency ? 'Enviando...' : 'Crear urgencia'}
            </Button>
          </form>

          {(user.roles.includes('contractor') || user.contractorProfile) ? (
            <>
              <Separator />
              <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Disponibilidad para urgencias</p>
                  <p className="text-sm text-muted-foreground">
                    {acceptsEmergencies
                      ? 'Tu perfil aparece en dispatch de urgencias.'
                      : 'Tu perfil no aparece en dispatch de urgencias.'}
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={handleEmergencyAvailabilityToggle}>
                  {isSavingEmergencyAvailability
                    ? 'Guardando...'
                    : acceptsEmergencies
                      ? 'Desactivar urgencias'
                      : 'Activar urgencias'}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
      ) : null}

      {view === 'perfil' ? (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Contractor y acceso</CardTitle>
          <CardDescription>Esto refleja los datos que ya expone la API protegida de etapa 02.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Estado contractor</p>
            <p className="mt-1 font-mono text-foreground">{user.contractorProfile?.approvalStatus ?? 'no aplica'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Supabase auth ID</p>
            <p className="mt-1 font-mono text-foreground">{user.supabaseAuthId ?? 'sin vincular'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Dirección principal</p>
            <p className="mt-1 text-foreground">
              {primaryAddress ? `${primaryAddress.city}, ${primaryAddress.province}` : 'No definida'}
            </p>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {view === 'bookings' ? <BookingWorkspace bookings={bookings} /> : null}
    </div>
  );
}
