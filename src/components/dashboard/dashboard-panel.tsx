'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Pencil, RefreshCcw, Trash2, X } from 'lucide-react';

import { AdminPanel } from '@/components/dashboard/admin-panel';
import { BookingWorkspace } from '@/components/dashboard/booking-workspace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { DashboardView } from '@/lib/dashboard-routes';
import type { DashboardAdminData } from '@/lib/dashboard-admin';
import type { DashboardBooking, DashboardEmergency } from '@/lib/dashboard-workspace';
import type { PublicCatalogLocation, PublicCatalogMarket } from '@/lib/public-catalog';

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
  initialMode?: DashboardMode;
  categories: DashboardCategory[];
  bookings: DashboardBooking[];
  emergencies: DashboardEmergency[];
  adminData: DashboardAdminData | null;
  addressMarkets: PublicCatalogMarket[];
  addressLocations: PublicCatalogLocation[];
};

type ProfileDraft = {
  displayName: string;
  firstName: string;
  lastName: string;
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

type ContractorProfileDraft = {
  dniNumber: string;
  addressId: string;
  acceptsEmergencies: boolean;
};

type EmergencyEnvelope = {
  request?: EmergencyApiRequest;
};

type EmergencyApiRequest = Omit<DashboardEmergency, 'assignedContractorName' | 'candidateCount' | 'clientName'> & {
  clientName?: string;
  assignedContractorName?: string | null;
  candidateCount?: number;
  candidates?: unknown[];
  assignedContractorProfile?: {
    user?: {
      displayName?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

type DashboardMode = 'client' | 'contractor';

function toStringOrEmpty(value: string | null | undefined): string {
  return value ?? '';
}

function normalizeLocationName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getProvinceOptions(locations: PublicCatalogLocation[]): string[] {
  return Array.from(new Set(locations.map((location) => location.provinceName))).sort((left, right) =>
    left.localeCompare(right, 'es')
  );
}

function getCityOptions(locations: PublicCatalogLocation[], provinceName: string): PublicCatalogLocation[] {
  const normalizedProvince = normalizeLocationName(provinceName);

  return locations
    .filter((location) => normalizeLocationName(location.provinceName) === normalizedProvince)
    .sort((left, right) => left.cityName.localeCompare(right.cityName, 'es'));
}

function buildProfileDraft(user: DashboardUser): ProfileDraft {
  return {
    displayName: toStringOrEmpty(user.displayName),
    firstName: toStringOrEmpty(user.profile?.firstName),
    lastName: toStringOrEmpty(user.profile?.lastName),
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

function buildContractorProfileDraft(user: DashboardUser): ContractorProfileDraft {
  const contractorProfile = user.contractorProfile;

  return {
    dniNumber: toStringOrEmpty(contractorProfile?.dniNumber),
    addressId: toStringOrEmpty(contractorProfile?.addressId ?? user.addresses[0]?.id),
    acceptsEmergencies: contractorProfile?.acceptsEmergencies ?? false
  };
}

function formatUtcDateTime(value: string): string {
  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

function formatEmergencyStatus(status: DashboardEmergency['status']): string {
  const labels: Record<DashboardEmergency['status'], string> = {
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

function isAvailableContractorEmergency(emergency: DashboardEmergency): boolean {
  return ['OPEN', 'DISPATCHING', 'REASSIGNMENT_NEEDED'].includes(emergency.status);
}

function canEditClientEmergency(emergency: DashboardEmergency): boolean {
  return ['OPEN', 'DISPATCHING', 'REASSIGNMENT_NEEDED'].includes(emergency.status);
}

function canResolveClientEmergency(emergency: DashboardEmergency): boolean {
  return !['CANCELLED_BY_CLIENT', 'RESOLVED_BY_CLIENT', 'EXPIRED'].includes(emergency.status);
}

function canRepublishClientEmergency(emergency: DashboardEmergency): boolean {
  return emergency.status === 'EXPIRED';
}

function toDashboardEmergencyFromApi(request: EmergencyApiRequest): DashboardEmergency {
  return {
    id: request.id,
    status: request.status,
    dispatchRound: request.dispatchRound,
    expiresAt: request.expiresAt,
    description: request.description,
    acceptedAt: request.acceptedAt,
    cancelledAt: request.cancelledAt,
    resolvedAt: request.resolvedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    clientName: request.clientName ?? 'Cliente',
    category: request.category,
    address: request.address,
    assignedContractorName:
      request.assignedContractorName ??
      request.assignedContractorProfile?.user?.displayName ??
      request.assignedContractorProfile?.user?.email ??
      null,
    candidateCount: request.candidateCount ?? request.candidates?.length ?? 0
  };
}

function hasContractorMode(user: DashboardUser): boolean {
  return user.roles.includes('contractor') || Boolean(user.contractorProfile);
}

function getInitialDashboardMode(user: DashboardUser): DashboardMode {
  return hasContractorMode(user) ? 'contractor' : 'client';
}

export function DashboardPanel({
  view,
  initialUser,
  initialMode,
  categories,
  bookings,
  emergencies: initialEmergencies,
  adminData,
  addressMarkets,
  addressLocations
}: DashboardPanelProps) {
  const [user, setUser] = useState(initialUser);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => buildProfileDraft(initialUser));
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoInputKey, setProfilePhotoInputKey] = useState(0);
  const [contractorProfilePhotoFile, setContractorProfilePhotoFile] = useState<File | null>(null);
  const [contractorDniFrontFile, setContractorDniFrontFile] = useState<File | null>(null);
  const [contractorDniBackFile, setContractorDniBackFile] = useState<File | null>(null);
  const [contractorFileInputKey, setContractorFileInputKey] = useState(0);
  const [contractorProfileDraft, setContractorProfileDraft] = useState<ContractorProfileDraft>(() =>
    buildContractorProfileDraft(initialUser)
  );
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(() => buildAddressDraft(initialUser));
  const [emergencyDraft, setEmergencyDraft] = useState<EmergencyDraft>(() =>
    buildEmergencyDraft(initialUser, categories)
  );
  const [emergencyEditDrafts, setEmergencyEditDrafts] = useState<Record<string, EmergencyDraft>>({});
  const [emergencies, setEmergencies] = useState<DashboardEmergency[]>(initialEmergencies);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressStatus, setAddressStatus] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(initialUser.addresses.length === 0);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [editingEmergencyId, setEditingEmergencyId] = useState<string | null>(null);
  const [mutatingEmergencyId, setMutatingEmergencyId] = useState<string | null>(null);
  const [isSavingEmergencyAvailability, setIsSavingEmergencyAvailability] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingContractorProfile, setIsSavingContractorProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [acceptsEmergencies, setAcceptsEmergencies] = useState(
    initialUser.contractorProfile?.acceptsEmergencies ?? false
  );
  const activeMode = initialMode ?? getInitialDashboardMode(initialUser);
  const [contractorProfileError, setContractorProfileError] = useState<string | null>(null);
  const [contractorProfileStatus, setContractorProfileStatus] = useState<string | null>(null);

  async function parseEnvelope<TEnvelope = UserEnvelope>(response: Response): Promise<TEnvelope | null> {
    try {
      return (await response.json()) as TEnvelope;
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
      const formData = new FormData();
      formData.set('displayName', profileDraft.displayName);
      formData.set('firstName', profileDraft.firstName);
      formData.set('lastName', profileDraft.lastName);
      formData.set('phone', profileDraft.phone);
      formData.set('bio', profileDraft.bio);

      if (profilePhotoFile) {
        formData.set('avatarFile', profilePhotoFile);
      }

      const response = await fetch('/api/me/profile', {
        method: 'PATCH',
        body: formData
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
        setContractorProfileDraft(buildContractorProfileDraft(payload.appUser));
        setAddressDraft(buildAddressDraft(payload.appUser));
      }

      setProfilePhotoFile(null);
      setProfilePhotoInputKey((current) => current + 1);
      setProfileStatus('Perfil actualizado.');
    } catch {
      setProfileError('No pudimos guardar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function saveContractorProfile(submitForReview: boolean) {
    setContractorProfileError(null);
    setContractorProfileStatus(null);
    setIsSavingContractorProfile(true);

    try {
      const formData = new FormData();
      formData.set('dniNumber', contractorProfileDraft.dniNumber);
      formData.set('addressId', contractorProfileDraft.addressId);
      formData.set('acceptsEmergencies', String(contractorProfileDraft.acceptsEmergencies));
      formData.set('submitForReview', String(submitForReview));

      if (contractorProfilePhotoFile) {
        formData.set('profilePhotoFile', contractorProfilePhotoFile);
      }

      if (contractorDniFrontFile) {
        formData.set('dniFrontFile', contractorDniFrontFile);
      }

      if (contractorDniBackFile) {
        formData.set('dniBackFile', contractorDniBackFile);
      }

      const response = await fetch('/api/me/contractor-profile', {
        method: 'PATCH',
        body: formData
      });

      const payload = await parseEnvelope(response);

      if (!response.ok) {
        setContractorProfileError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos guardar los datos de trabajador.'
        );
        return;
      }

      if (payload?.appUser) {
        setUser(payload.appUser);
        setProfileDraft(buildProfileDraft(payload.appUser));
        setContractorProfileDraft(buildContractorProfileDraft(payload.appUser));
        setAddressDraft(buildAddressDraft(payload.appUser));
        setAcceptsEmergencies(payload.appUser.contractorProfile?.acceptsEmergencies ?? false);
      }

      setContractorProfilePhotoFile(null);
      setContractorDniFrontFile(null);
      setContractorDniBackFile(null);
      setContractorFileInputKey((current) => current + 1);
      setContractorProfileStatus(
        submitForReview ? 'Perfil laboral enviado a revisión.' : 'Datos de trabajador guardados.'
      );
    } catch {
      setContractorProfileError('No pudimos guardar los datos de trabajador.');
    } finally {
      setIsSavingContractorProfile(false);
    }
  }

  function handleContractorProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveContractorProfile(false);
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
          isDefault: true,
          ...(selectedAddressMarket ? { marketId: selectedAddressMarket.id } : {})
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
        const hadNoAddresses = user.addresses.length === 0;
        setUser(nextAppUser);
        setProfileDraft(buildProfileDraft(nextAppUser));
        setContractorProfileDraft(buildContractorProfileDraft(nextAppUser));
        setAddressDraft(buildAddressDraft(nextAppUser));
        setEmergencyDraft((current) => ({
          ...current,
          addressId: nextAppUser.addresses[0]?.id ?? current.addressId
        }));
        setIsAddressFormOpen(hadNoAddresses ? nextAppUser.addresses.length === 0 : false);
      } else {
        setAddressDraft(buildAddressDraft(user));
        setIsAddressFormOpen(false);
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

      const payload = await parseEnvelope<EmergencyEnvelope>(response);

      if (!response.ok) {
        setEmergencyError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos crear la urgencia.'
        );
        return;
      }

      setEmergencyStatus('Urgencia creada y enviada a contractors elegibles.');
      if (payload?.request) {
        setEmergencies((current) => [toDashboardEmergencyFromApi(payload.request as EmergencyApiRequest), ...current]);
      }
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
        setContractorProfileDraft(buildContractorProfileDraft(payload.appUser));
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

  function replaceEmergency(updatedEmergency: DashboardEmergency) {
    setEmergencies((current) =>
      current.map((emergency) => (emergency.id === updatedEmergency.id ? updatedEmergency : emergency))
    );
  }

  function startEditingEmergency(emergency: DashboardEmergency) {
    setEmergencyError(null);
    setEmergencyStatus(null);
    setEditingEmergencyId(emergency.id);
    setEmergencyEditDrafts((current) => ({
      ...current,
      [emergency.id]: {
        categoryId: emergency.category.id,
        addressId: emergency.address.id,
        description: emergency.description
      }
    }));
  }

  function stopEditingEmergency() {
    setEditingEmergencyId(null);
  }

  async function handleEmergencyUpdate(event: FormEvent<HTMLFormElement>, emergencyId: string) {
    event.preventDefault();
    const draft = emergencyEditDrafts[emergencyId];

    if (!draft) {
      return;
    }

    setEmergencyError(null);
    setEmergencyStatus(null);
    setMutatingEmergencyId(emergencyId);

    try {
      const response = await fetch(`/api/emergencies/${emergencyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update',
          categoryId: draft.categoryId,
          addressId: draft.addressId,
          description: draft.description
        })
      });

      const payload = await parseEnvelope<EmergencyEnvelope>(response);

      if (!response.ok) {
        setEmergencyError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos editar la urgencia.'
        );
        return;
      }

      if (payload?.request) {
        replaceEmergency(toDashboardEmergencyFromApi(payload.request as EmergencyApiRequest));
      }

      setEditingEmergencyId(null);
      setEmergencyStatus('Urgencia actualizada.');
    } catch {
      setEmergencyError('No pudimos editar la urgencia.');
    } finally {
      setMutatingEmergencyId(null);
    }
  }

  async function handleEmergencyResolve(emergencyId: string) {
    setEmergencyError(null);
    setEmergencyStatus(null);
    setMutatingEmergencyId(emergencyId);

    try {
      const response = await fetch(`/api/emergencies/${emergencyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'resolve'
        })
      });

      const payload = await parseEnvelope<EmergencyEnvelope>(response);

      if (!response.ok) {
        setEmergencyError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos marcar la urgencia como resuelta.'
        );
        return;
      }

      if (payload?.request) {
        replaceEmergency(toDashboardEmergencyFromApi(payload.request as EmergencyApiRequest));
      }

      setEmergencyStatus('Urgencia marcada como resuelta.');
    } catch {
      setEmergencyError('No pudimos marcar la urgencia como resuelta.');
    } finally {
      setMutatingEmergencyId(null);
    }
  }

  async function handleEmergencyRepublish(emergencyId: string) {
    setEmergencyError(null);
    setEmergencyStatus(null);
    setMutatingEmergencyId(emergencyId);

    try {
      const response = await fetch(`/api/emergencies/${emergencyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'republish'
        })
      });

      const payload = await parseEnvelope<EmergencyEnvelope>(response);

      if (!response.ok) {
        setEmergencyError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos republicar la urgencia.'
        );
        return;
      }

      if (payload?.request) {
        setEmergencies((current) => [toDashboardEmergencyFromApi(payload.request as EmergencyApiRequest), ...current]);
      }

      setEmergencyStatus('Urgencia republicada.');
    } catch {
      setEmergencyError('No pudimos republicar la urgencia.');
    } finally {
      setMutatingEmergencyId(null);
    }
  }

  async function handleEmergencyDelete(emergencyId: string) {
    const confirmed = window.confirm('¿Querés borrar esta urgencia? La vamos a cancelar y quitar de tu lista.');

    if (!confirmed) {
      return;
    }

    setEmergencyError(null);
    setEmergencyStatus(null);
    setMutatingEmergencyId(emergencyId);

    try {
      const response = await fetch(`/api/emergencies/${emergencyId}`, {
        method: 'DELETE'
      });

      const payload = await parseEnvelope<EmergencyEnvelope>(response);

      if (!response.ok) {
        setEmergencyError(
          (payload as { message?: string; error?: string } | null)?.message ??
            (payload as { error?: string } | null)?.error ??
            'No pudimos borrar la urgencia.'
        );
        return;
      }

      setEmergencies((current) => current.filter((emergency) => emergency.id !== emergencyId));
      setEditingEmergencyId((current) => (current === emergencyId ? null : current));
      setEmergencyStatus('Urgencia borrada.');
    } catch {
      setEmergencyError('No pudimos borrar la urgencia.');
    } finally {
      setMutatingEmergencyId(null);
    }
  }

  const primaryAddress = user.addresses.find((address) => address.isDefault) ?? user.addresses[0] ?? null;
  const provinceOptions = useMemo(() => getProvinceOptions(addressLocations), [addressLocations]);
  const cityOptions = useMemo(
    () => getCityOptions(addressLocations, addressDraft.province),
    [addressDraft.province, addressLocations]
  );
  const selectedAddressMarket = addressMarkets.find(
    (market) =>
      normalizeLocationName(market.city) === normalizeLocationName(addressDraft.city) &&
      normalizeLocationName(market.province) === normalizeLocationName(addressDraft.province)
  );
  const visibleEmergencies =
    activeMode === 'contractor' ? emergencies.filter(isAvailableContractorEmergency) : emergencies;
  const emergencyListTitle = activeMode === 'contractor' ? 'Urgencias disponibles' : 'Mis urgencias creadas';
  const emergencyListDescription =
    activeMode === 'contractor'
      ? 'Solicitudes urgentes existentes y disponibles para trabajadores.'
      : 'Seguimiento de los pedidos urgentes que podés ver con tu cuenta.';
  const emergencyEmptyMessage =
    activeMode === 'contractor' ? 'No hay urgencias disponibles ahora.' : 'Todavía no creaste urgencias.';

  return (
    <div className="space-y-6">
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
                <Label htmlFor="profile-photo">Foto de perfil</Label>
                <Input
                  key={profilePhotoInputKey}
                  id="profile-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setProfilePhotoFile(event.target.files?.[0] ?? null)}
                />
                {profilePhotoFile ? (
                  <p className="text-xs text-muted-foreground">{profilePhotoFile.name}</p>
                ) : null}
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

      {view === 'perfil' && activeMode === 'contractor' ? (
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="font-display text-2xl">Perfil laboral</CardTitle>
                <CardDescription>Cargá los datos de trabajador que revisa Yavaa antes de publicar tu perfil.</CardDescription>
              </div>
              <Badge variant={user.contractorProfile?.approvalStatus === 'APPROVED' ? 'secondary' : 'outline'}>
                {user.contractorProfile?.approvalStatus ?? 'DRAFT'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleContractorProfileSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractor-dni">DNI</Label>
                  <Input
                    id="contractor-dni"
                    value={contractorProfileDraft.dniNumber}
                    onChange={(event) =>
                      setContractorProfileDraft((current) => ({ ...current, dniNumber: event.target.value }))
                    }
                    minLength={6}
                    maxLength={32}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractor-address">Dirección laboral</Label>
                  <select
                    id="contractor-address"
                    className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                    value={contractorProfileDraft.addressId}
                    onChange={(event) =>
                      setContractorProfileDraft((current) => ({ ...current, addressId: event.target.value }))
                    }
                    disabled={user.addresses.length === 0}
                  >
                    {user.addresses.length === 0 ? <option value="">Sin direcciones guardadas</option> : null}
                    {user.addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label} - {address.city}, {address.province}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="contractor-profile-photo-file">Foto laboral</Label>
                  <Input
                    key={`profile-photo-${contractorFileInputKey}`}
                    id="contractor-profile-photo-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setContractorProfilePhotoFile(event.target.files?.[0] ?? null)}
                  />
                  {contractorProfilePhotoFile ? (
                    <p className="text-xs text-muted-foreground">{contractorProfilePhotoFile.name}</p>
                  ) : user.contractorProfile?.profilePhotoUrl ? (
                    <p className="text-xs text-muted-foreground">Foto laboral guardada.</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractor-dni-front-file">DNI frente</Label>
                  <Input
                    key={`dni-front-${contractorFileInputKey}`}
                    id="contractor-dni-front-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setContractorDniFrontFile(event.target.files?.[0] ?? null)}
                  />
                  {contractorDniFrontFile ? (
                    <p className="text-xs text-muted-foreground">{contractorDniFrontFile.name}</p>
                  ) : user.contractorProfile?.dniFrontUrl ? (
                    <p className="text-xs text-muted-foreground">DNI frente guardado.</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractor-dni-back-file">DNI dorso</Label>
                  <Input
                    key={`dni-back-${contractorFileInputKey}`}
                    id="contractor-dni-back-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setContractorDniBackFile(event.target.files?.[0] ?? null)}
                  />
                  {contractorDniBackFile ? (
                    <p className="text-xs text-muted-foreground">{contractorDniBackFile.name}</p>
                  ) : user.contractorProfile?.dniBackUrl ? (
                    <p className="text-xs text-muted-foreground">DNI dorso guardado.</p>
                  ) : null}
                </div>
              </div>

              {contractorProfileError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {contractorProfileError}
                </p>
              ) : null}

              {contractorProfileStatus ? (
                <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {contractorProfileStatus}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isSavingContractorProfile}>
                  {isSavingContractorProfile ? 'Guardando...' : 'Guardar datos de trabajador'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSavingContractorProfile}
                  onClick={() => void saveContractorProfile(true)}
                >
                  Enviar a revisión
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {view === 'perfil' && activeMode === 'contractor' ? (
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Disponibilidad para urgencias</CardTitle>
            <CardDescription>
              Controlá si tu perfil entra en el dispatch de solicitudes urgentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {acceptsEmergencies ? 'Urgencias activas' : 'Urgencias pausadas'}
                </p>
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
          </CardContent>
        </Card>
      ) : null}

      {view === 'perfil' && activeMode === 'client' ? (
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="font-display text-2xl">Direcciones guardadas</CardTitle>
                <CardDescription>Vemos tus direcciones guardadas y podés agregar una nueva.</CardDescription>
              </div>
              {user.addresses.length > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  aria-expanded={isAddressFormOpen}
                  onClick={() => {
                    setAddressError(null);
                    setIsAddressFormOpen((current) => !current);
                  }}
                >
                  {isAddressFormOpen ? 'Ocultar formulario' : 'Agregar dirección'}
                </Button>
              ) : null}
            </div>
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

            {isAddressFormOpen ? (
              <>
                <Separator />
                <form className="space-y-4" onSubmit={handleAddressSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="address-label">Etiqueta</Label>
                      <Input
                        id="address-label"
                        value={addressDraft.label}
                        onChange={(event) =>
                          setAddressDraft((current) => ({ ...current, label: event.target.value }))
                        }
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
                      <Label htmlFor="province">Provincia</Label>
                      <select
                        id="province"
                        className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={addressDraft.province}
                        onChange={(event) => {
                          const nextProvince = event.target.value;
                          const nextCity = getCityOptions(addressLocations, nextProvince)[0]?.cityName ?? '';

                          setAddressDraft((current) => ({
                            ...current,
                            province: nextProvince,
                            city: nextCity
                          }));
                        }}
                        required
                      >
                        <option value="">Seleccionar provincia</option>
                        {provinceOptions.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <select
                        id="city"
                        className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                        value={addressDraft.city}
                        onChange={(event) => setAddressDraft((current) => ({ ...current, city: event.target.value }))}
                        disabled={!addressDraft.province || cityOptions.length === 0}
                        required
                      >
                        <option value="">Seleccionar ciudad</option>
                        {cityOptions.map((location) => (
                          <option key={`${location.provinceId}-${location.cityId}`} value={location.cityName}>
                            {location.cityName}
                          </option>
                        ))}
                      </select>
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

                  <Button type="submit" disabled={isSavingAddress}>
                    {isSavingAddress ? 'Guardando...' : 'Agregar dirección'}
                  </Button>
                </form>
              </>
            ) : null}

            {addressStatus ? (
              <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {addressStatus}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {view === 'urgencias' ? (
        <>
          <Card className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-2xl">{emergencyListTitle}</CardTitle>
              <CardDescription>{emergencyListDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleEmergencies.length > 0 ? (
                visibleEmergencies.map((emergency) => {
                  const isEditing = editingEmergencyId === emergency.id;
                  const isMutating = mutatingEmergencyId === emergency.id;
                  const editDraft = emergencyEditDrafts[emergency.id] ?? {
                    categoryId: emergency.category.id,
                    addressId: emergency.address.id,
                    description: emergency.description
                  };

                  return (
                    <article key={emergency.id} className="rounded-lg border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{formatEmergencyStatus(emergency.status)}</Badge>
                          <Badge variant="outline">{emergency.category.name}</Badge>
                        </div>

                        {activeMode === 'client' ? (
                          <div className="flex flex-wrap gap-2">
                            {canEditClientEmergency(emergency) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingEmergency(emergency)}
                                disabled={isMutating}
                              >
                                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                                Editar urgencia
                              </Button>
                            ) : null}
                            {canResolveClientEmergency(emergency) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => void handleEmergencyResolve(emergency.id)}
                                disabled={isMutating}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                Marcar resuelta
                              </Button>
                            ) : null}
                            {canRepublishClientEmergency(emergency) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => void handleEmergencyRepublish(emergency.id)}
                                disabled={isMutating}
                              >
                                <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                                Republicar urgencia
                              </Button>
                            ) : null}
                            {canEditClientEmergency(emergency) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => void handleEmergencyDelete(emergency.id)}
                                disabled={isMutating}
                              >
                                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                Borrar urgencia
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {isEditing ? (
                        <form className="mt-4 space-y-4" onSubmit={(event) => void handleEmergencyUpdate(event, emergency.id)}>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`emergency-edit-category-${emergency.id}`}>Categoría</Label>
                              <select
                                id={`emergency-edit-category-${emergency.id}`}
                                className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                value={editDraft.categoryId}
                                onChange={(event) =>
                                  setEmergencyEditDrafts((current) => ({
                                    ...current,
                                    [emergency.id]: {
                                      ...editDraft,
                                      categoryId: event.target.value
                                    }
                                  }))
                                }
                              >
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`emergency-edit-address-${emergency.id}`}>Dirección</Label>
                              <select
                                id={`emergency-edit-address-${emergency.id}`}
                                className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                value={editDraft.addressId}
                                onChange={(event) =>
                                  setEmergencyEditDrafts((current) => ({
                                    ...current,
                                    [emergency.id]: {
                                      ...editDraft,
                                      addressId: event.target.value
                                    }
                                  }))
                                }
                              >
                                {user.addresses.map((address) => (
                                  <option key={address.id} value={address.id}>
                                    {address.label} - {address.city}, {address.province}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`emergency-edit-description-${emergency.id}`}>Descripción</Label>
                            <Textarea
                              id={`emergency-edit-description-${emergency.id}`}
                              value={editDraft.description}
                              onChange={(event) =>
                                setEmergencyEditDrafts((current) => ({
                                  ...current,
                                  [emergency.id]: {
                                    ...editDraft,
                                    description: event.target.value
                                  }
                                }))
                              }
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="submit" size="sm" disabled={isMutating}>
                              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                              {isMutating ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={stopEditingEmergency}>
                              <X className="mr-2 h-4 w-4" aria-hidden="true" />
                              Cancelar edición
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="mt-3 text-sm font-semibold text-foreground">{emergency.description}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {emergency.address.label} · {emergency.address.city}, {emergency.address.province}
                          </p>
                        </>
                      )}

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <span>Creada: {formatUtcDateTime(emergency.createdAt)}</span>
                        <span>Vence: {formatUtcDateTime(emergency.expiresAt)}</span>
                        <span>Candidatos: {emergency.candidateCount}</span>
                      </div>
                      {emergency.assignedContractorName ? (
                        <p className="mt-2 text-sm text-foreground">Trabajador: {emergency.assignedContractorName}</p>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  {emergencyEmptyMessage}
                </p>
              )}
            </CardContent>
          </Card>

          {activeMode === 'client' ? (
          <Card className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Crear nueva urgencia</CardTitle>
              <CardDescription>Dispará una solicitud urgente para tus direcciones guardadas.</CardDescription>
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
              {isSavingEmergency ? 'Enviando...' : 'Crear nueva urgencia'}
            </Button>
          </form>
            </CardContent>
          </Card>
          ) : null}
        </>
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
