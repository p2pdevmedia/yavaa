'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import { LocationMapPicker, type LocationCoordinate } from '@/components/onboarding/location-map-picker';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type JefeOnboardingField,
  type OnboardingFieldErrors,
  validateJefeOnboardingInput
} from '@/lib/onboarding';
import { getPrivateProfileAvatarSrc } from '@/lib/profile-avatar';

type JefeWizardInitialProfile = {
  firstName?: string | null;
  lastName?: string | null;
  addressText?: string | null;
  locationLatitude?: string | null;
  locationLongitude?: string | null;
  avatarUrl?: string | null;
};

type JefeWizardState = {
  firstName: string;
  lastName: string;
  addressText: string;
  location: LocationCoordinate | null;
  avatarBlobPath: string;
};

type LocalField = JefeOnboardingField | 'form';
type LocalFieldErrors = Partial<Record<LocalField, string[]>>;

type JefeApiResponse =
  | {
      ok: true;
      nextPath?: string;
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: OnboardingFieldErrors<JefeOnboardingField>;
    };

type AvatarUploadResponse =
  | {
      ok: true;
      pathname: string;
      previewSrc: string;
    }
  | {
      ok: false;
      message?: string;
    };

const steps = [
  {
    id: 'data',
    title: 'Tus datos',
    description: 'Mostramos tu nombre para que los trabajadores sepan con quién van a coordinar.'
  },
  {
    id: 'address',
    title: '¿Dónde necesitás ayuda?',
    description: 'Usamos esta zona para ordenar trabajadores cercanos y preparar la publicación del trabajo.'
  },
  {
    id: 'photo',
    title: 'Agregá una foto',
    description: 'Es opcional, pero ayuda a que tu perfil se sienta más confiable.'
  },
  {
    id: 'success',
    title: 'Ya podés contratar',
    description: 'Tu perfil de cliente queda listo para publicar el primer trabajo.'
  }
] as const;

const fieldByStep: Record<number, JefeOnboardingField[]> = {
  0: ['firstName', 'lastName'],
  1: ['addressText', 'locationLatitude', 'locationLongitude'],
  2: ['avatarBlobPath']
};

function getInitialLocation(profile?: JefeWizardInitialProfile | null): LocationCoordinate | null {
  const latitude = Number(profile?.locationLatitude);
  const longitude = Number(profile?.locationLongitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude
  };
}

function getInitialState(profile?: JefeWizardInitialProfile | null): JefeWizardState {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    addressText: profile?.addressText ?? '',
    location: getInitialLocation(profile),
    avatarBlobPath: profile?.avatarUrl ?? ''
  };
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-semibold text-destructive">{messages[0]}</p>;
}

function pickErrors(
  fieldErrors: OnboardingFieldErrors<JefeOnboardingField>,
  fields: ReadonlyArray<JefeOnboardingField>
): LocalFieldErrors {
  const nextErrors: LocalFieldErrors = {};

  for (const field of fields) {
    if (fieldErrors[field]?.length) {
      nextErrors[field] = fieldErrors[field];
    }
  }

  return nextErrors;
}

function getFirstErrorStep(fieldErrors: OnboardingFieldErrors<JefeOnboardingField>): number {
  if (fieldErrors.firstName || fieldErrors.lastName) {
    return 0;
  }

  if (fieldErrors.addressText || fieldErrors.locationLatitude || fieldErrors.locationLongitude) {
    return 1;
  }

  return 2;
}

export function JefeWizard({ initialProfile }: { initialProfile?: JefeWizardInitialProfile | null }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<JefeWizardState>(() => getInitialState(initialProfile));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewSrc, setAvatarPreviewSrc] = useState<string | null>(() =>
    initialProfile?.avatarUrl ? getPrivateProfileAvatarSrc(initialProfile.avatarUrl) : null
  );
  const [fieldErrors, setFieldErrors] = useState<LocalFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const step = steps[stepIndex];
  const isSuccessStep = step.id === 'success';

  const payload = useMemo(
    () => ({
      firstName: formState.firstName,
      lastName: formState.lastName,
      addressText: formState.addressText,
      locationLatitude: formState.location?.latitude,
      locationLongitude: formState.location?.longitude,
      avatarBlobPath: formState.avatarBlobPath.trim() ? formState.avatarBlobPath : null
    }),
    [
      formState.addressText,
      formState.avatarBlobPath,
      formState.firstName,
      formState.lastName,
      formState.location?.latitude,
      formState.location?.longitude
    ]
  );

  useEffect(() => {
    return () => {
      if (avatarPreviewSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewSrc);
      }
    };
  }, [avatarPreviewSrc]);

  function updateField(field: keyof JefeWizardState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined
    }));
  }

  const updateAddress = useCallback((value: string) => {
    setFormState((current) => ({
      ...current,
      addressText: value
    }));
    setFieldErrors((current) => ({
      ...current,
      addressText: undefined,
      form: undefined
    }));
  }, []);

  const updateLocation = useCallback((location: LocationCoordinate) => {
    setFormState((current) => ({
      ...current,
      location
    }));
    setFieldErrors((current) => ({
      ...current,
      locationLatitude: undefined,
      locationLongitude: undefined,
      form: undefined
    }));
  }, []);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = '';

    if (!file) {
      return;
    }

    setAvatarFile(file);
    setAvatarPreviewSrc(URL.createObjectURL(file));
    setFormState((current) => ({
      ...current,
      avatarBlobPath: ''
    }));
    setFieldErrors((current) => ({
      ...current,
      avatarBlobPath: undefined,
      form: undefined
    }));
  }

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreviewSrc(null);
    setFormState((current) => ({
      ...current,
      avatarBlobPath: ''
    }));
    setFieldErrors((current) => ({
      ...current,
      avatarBlobPath: undefined,
      form: undefined
    }));
  }

  function validateCurrentStep(): boolean {
    const fields = fieldByStep[stepIndex];

    if (!fields) {
      setFieldErrors({});
      return true;
    }

    const validation = validateJefeOnboardingInput(payload);

    if (validation.ok) {
      setFieldErrors({});
      return true;
    }

    const nextErrors = pickErrors(validation.fieldErrors, fields);
    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function uploadSelectedAvatar(): Promise<{ ok: true; avatarBlobPath: string | null } | { ok: false }> {
    if (!avatarFile) {
      return {
        ok: true,
        avatarBlobPath: payload.avatarBlobPath ?? null
      };
    }

    const formData = new FormData();
    formData.set('file', avatarFile);

    const response = await fetch('/api/profile/avatar', {
      method: 'POST',
      body: formData
    });
    const responseBody = (await response.json()) as AvatarUploadResponse;

    if (!response.ok || !responseBody.ok) {
      setFieldErrors({
        avatarBlobPath: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos subir la foto.']
      });
      setStepIndex(2);

      return {
        ok: false
      };
    }

    setAvatarFile(null);
    setAvatarPreviewSrc(responseBody.previewSrc);
    setFormState((current) => ({
      ...current,
      avatarBlobPath: responseBody.pathname
    }));

    return {
      ok: true,
      avatarBlobPath: responseBody.pathname
    };
  }

  async function submitProfile() {
    const validation = validateJefeOnboardingInput(payload);

    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setStepIndex(getFirstErrorStep(validation.fieldErrors));
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const avatarUpload = await uploadSelectedAvatar();

      if (!avatarUpload.ok) {
        return;
      }

      const finalPayload = {
        ...validation.data,
        avatarBlobPath: avatarUpload.avatarBlobPath
      };
      const finalValidation = validateJefeOnboardingInput(finalPayload);

      if (!finalValidation.ok) {
        setFieldErrors(finalValidation.fieldErrors);
        setStepIndex(getFirstErrorStep(finalValidation.fieldErrors));
        return;
      }

      const response = await fetch('/api/onboarding/jefe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(finalValidation.data)
      });
      const responseBody = (await response.json()) as JefeApiResponse;

      if (!response.ok || !responseBody.ok) {
        if (!responseBody.ok && responseBody.fieldErrors) {
          setFieldErrors(responseBody.fieldErrors);
          setStepIndex(getFirstErrorStep(responseBody.fieldErrors));
          return;
        }

        setFieldErrors({
          form: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos guardar tu perfil.']
        });
        return;
      }

      router.push((responseBody.nextPath ?? '/dashboard/jefe') as Route);
    } catch {
      setFieldErrors({
        form: ['No pudimos conectar con Yavaa. Probá de nuevo.']
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (isSuccessStep) {
      void submitProfile();
      return;
    }

    if (validateCurrentStep()) {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }
  }

  function renderStep() {
    if (step.id === 'data') {
      return (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={formState.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
            />
            <FieldError messages={fieldErrors.firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={formState.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
            />
            <FieldError messages={fieldErrors.lastName} />
          </div>
        </div>
      );
    }

    if (step.id === 'address') {
      return (
        <LocationMapPicker
          address={formState.addressText}
          location={formState.location}
          addressError={fieldErrors.addressText?.[0]}
          locationError={fieldErrors.locationLatitude?.[0] ?? fieldErrors.locationLongitude?.[0]}
          onAddressChange={updateAddress}
          onLocationChange={updateLocation}
        />
      );
    }

    if (step.id === 'photo') {
      return (
        <div className="space-y-4">
          <div className="rounded-[26px] border border-border bg-card p-5 shadow-soft">
            <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              {avatarPreviewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreviewSrc}
                  alt="Vista previa de la foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-4 text-center text-sm font-bold text-muted-foreground">Sin foto</span>
              )}
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">Podés subir una imagen o sacar una foto ahora.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              La foto se guarda como Vercel Blob privado y solo se muestra desde rutas autenticadas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              id="avatarUpload"
              name="avatarUpload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <Button type="button" asChild variant="outline">
              <label htmlFor="avatarUpload">Subir foto</label>
            </Button>
            <input
              id="avatarCamera"
              name="avatarCamera"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <Button type="button" asChild>
              <label htmlFor="avatarCamera">Tomar foto</label>
            </Button>
          </div>
          {avatarPreviewSrc ? (
            <Button type="button" variant="outline" className="w-full" onClick={clearAvatar}>
              Quitar foto
            </Button>
          ) : null}
          <FieldError messages={fieldErrors.avatarBlobPath} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-[26px] border border-border bg-card p-5 shadow-soft">
          <p className="text-sm font-bold text-foreground">
            {formState.firstName || 'Tu perfil'} queda listo para publicar trabajos.
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Zona principal</dt>
              <dd className="font-bold text-foreground">{formState.addressText || 'Sin zona'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Punto del mapa</dt>
              <dd className="font-bold text-foreground">{formState.location ? 'Seleccionado' : 'Pendiente'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Foto</dt>
              <dd className="font-bold text-foreground">
                {avatarPreviewSrc || formState.avatarBlobPath ? 'Agregada' : 'Pendiente'}
              </dd>
            </div>
          </dl>
        </div>
        <FieldError messages={fieldErrors.form} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <OnboardingShell
        eyebrow="Perfil cliente"
        title={step.title}
        description={step.description}
        currentStep={stepIndex + 1}
        totalSteps={steps.length}
        actions={
          <>
            {stepIndex > 0 && !isSubmitting ? (
              <Button type="button" variant="outline" onClick={() => setStepIndex((current) => current - 1)}>
                Volver
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isSuccessStep ? 'Finalizar perfil' : 'Continuar'}
            </Button>
          </>
        }
      >
        <div key={step.id}>{renderStep()}</div>
      </OnboardingShell>
    </form>
  );
}
