'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import { MobileMapPreview } from '@/components/onboarding/mobile-map-preview';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type OnboardingFieldErrors,
  type WorkerCategorySlug,
  type WorkerOnboardingField,
  validateWorkerOnboardingInput,
  workerCategoryLabels,
  workerCategorySlugs
} from '@/lib/onboarding';
import { getPrivateProfileAvatarSrc } from '@/lib/profile-avatar';
import { cn } from '@/lib/utils';

type WorkerWizardInitialProfile = {
  firstName?: string | null;
  lastName?: string | null;
  dniNumber?: string | null;
  addressText?: string | null;
  workerCategories?: string[] | null;
  workerHourlyRateCents?: number | null;
  avatarUrl?: string | null;
};

type WorkerWizardState = {
  firstName: string;
  lastName: string;
  dniNumber: string;
  addressText: string;
  workerCategories: WorkerCategorySlug[];
  hourlyRatePesos: string;
  avatarBlobPath: string;
  dniFrontReady: boolean;
  dniBackReady: boolean;
};

type LocalField = WorkerOnboardingField | 'dniFront' | 'dniBack' | 'form';
type LocalFieldErrors = Partial<Record<LocalField, string[]>>;

type WorkerApiResponse =
  | {
      ok: true;
      nextPath?: string;
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: OnboardingFieldErrors<WorkerOnboardingField>;
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
    id: 'name',
    title: '¿Cómo te llamás?',
    description: 'Estos datos van a aparecer en tu perfil cuando empieces a ofrecer trabajos.'
  },
  {
    id: 'dni',
    title: 'Validemos tu identidad',
    description: 'Usamos tu DNI para crear una capa básica de confianza antes de mostrarte a clientes.'
  },
  {
    id: 'dni-photos',
    title: 'Subí fotos del DNI',
    description: 'Por ahora las fotos quedan solo en este paso visual; el guardado real de archivos se planifica aparte.'
  },
  {
    id: 'zone',
    title: '¿Dónde trabajás?',
    description: 'Definí una zona principal para ordenar mejor futuras búsquedas cercanas.'
  },
  {
    id: 'categories',
    title: '¿Qué trabajos hacés?',
    description: 'Elegí uno o más rubros. Los podés cambiar después.'
  },
  {
    id: 'price',
    title: '¿Cuánto cobrás por hora?',
    description: 'Usalo como precio base en ARS. Después cada trabajo puede tener su propio presupuesto.'
  },
  {
    id: 'photo',
    title: 'Agregá una foto',
    description: 'Es opcional, pero ayuda a que los clientes reconozcan tu perfil cuando revisen tus ofertas.'
  },
  {
    id: 'success',
    title: 'Tu perfil está listo',
    description: 'Guardamos tu perfil laboral y dejamos la verificación de identidad en revisión.'
  }
] as const;

const fieldByStep: Record<number, WorkerOnboardingField[]> = {
  0: ['firstName', 'lastName'],
  1: ['dniNumber'],
  3: ['addressText'],
  4: ['workerCategories'],
  5: ['hourlyRatePesos'],
  6: ['avatarBlobPath']
};

function isWorkerCategorySlug(value: string): value is WorkerCategorySlug {
  return (workerCategorySlugs as ReadonlyArray<string>).includes(value);
}

function getInitialState(profile?: WorkerWizardInitialProfile | null): WorkerWizardState {
  const categories = (profile?.workerCategories ?? []).filter(isWorkerCategorySlug);
  const hourlyRatePesos = profile?.workerHourlyRateCents ? String(profile.workerHourlyRateCents / 100) : '';

  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    dniNumber: profile?.dniNumber ?? '',
    addressText: profile?.addressText ?? '',
    workerCategories: categories,
    hourlyRatePesos,
    avatarBlobPath: profile?.avatarUrl ?? '',
    dniFrontReady: false,
    dniBackReady: false
  };
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-semibold text-destructive">{messages[0]}</p>;
}

function pickErrors(
  fieldErrors: OnboardingFieldErrors<WorkerOnboardingField>,
  fields: ReadonlyArray<WorkerOnboardingField>
): LocalFieldErrors {
  const nextErrors: LocalFieldErrors = {};

  for (const field of fields) {
    if (fieldErrors[field]?.length) {
      nextErrors[field] = fieldErrors[field];
    }
  }

  return nextErrors;
}

function getFirstErrorStep(fieldErrors: OnboardingFieldErrors<WorkerOnboardingField>): number {
  if (fieldErrors.firstName || fieldErrors.lastName) {
    return 0;
  }

  if (fieldErrors.dniNumber) {
    return 1;
  }

  if (fieldErrors.addressText) {
    return 3;
  }

  if (fieldErrors.workerCategories) {
    return 4;
  }

  if (fieldErrors.hourlyRatePesos) {
    return 5;
  }

  return 6;
}

export function WorkerWizard({ initialProfile }: { initialProfile?: WorkerWizardInitialProfile | null }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<WorkerWizardState>(() => getInitialState(initialProfile));
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
      dniNumber: formState.dniNumber,
      addressText: formState.addressText,
      workerCategories: formState.workerCategories,
      hourlyRatePesos: formState.hourlyRatePesos,
      avatarBlobPath: formState.avatarBlobPath.trim() ? formState.avatarBlobPath : null
    }),
    [
      formState.addressText,
      formState.avatarBlobPath,
      formState.dniNumber,
      formState.firstName,
      formState.hourlyRatePesos,
      formState.lastName,
      formState.workerCategories
    ]
  );

  useEffect(() => {
    return () => {
      if (avatarPreviewSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewSrc);
      }
    };
  }, [avatarPreviewSrc]);

  function updateField(field: keyof WorkerWizardState, value: string | boolean | WorkerCategorySlug[]) {
    const errorField: LocalField =
      field === 'dniFrontReady' ? 'dniFront' : field === 'dniBackReady' ? 'dniBack' : field;

    setFormState((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => ({
      ...current,
      [errorField]: undefined,
      form: undefined
    }));
  }

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
    if (stepIndex === 2) {
      const nextErrors: LocalFieldErrors = {};

      if (!formState.dniFrontReady) {
        nextErrors.dniFront = ['Subí el frente del DNI.'];
      }

      if (!formState.dniBackReady) {
        nextErrors.dniBack = ['Subí el dorso del DNI.'];
      }

      setFieldErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    }

    const fields = fieldByStep[stepIndex];

    if (!fields) {
      setFieldErrors({});
      return true;
    }

    const validation = validateWorkerOnboardingInput(payload);

    if (validation.ok) {
      setFieldErrors({});
      return true;
    }

    const nextErrors = pickErrors(validation.fieldErrors, fields);
    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function toggleCategory(category: WorkerCategorySlug) {
    const nextCategories = formState.workerCategories.includes(category)
      ? formState.workerCategories.filter((current) => current !== category)
      : [...formState.workerCategories, category];

    updateField('workerCategories', nextCategories);
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
      setStepIndex(6);

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
    const validation = validateWorkerOnboardingInput(payload);

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
      const finalValidation = validateWorkerOnboardingInput(finalPayload);

      if (!finalValidation.ok) {
        setFieldErrors(finalValidation.fieldErrors);
        setStepIndex(getFirstErrorStep(finalValidation.fieldErrors));
        return;
      }

      const response = await fetch('/api/onboarding/trabajador', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(finalValidation.data)
      });
      const responseBody = (await response.json()) as WorkerApiResponse;

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

      router.push((responseBody.nextPath ?? '/dashboard/trabajador') as Route);
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
    if (step.id === 'name') {
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

    if (step.id === 'dni') {
      return (
        <div className="space-y-2">
          <Label htmlFor="dniNumber">DNI</Label>
          <Input
            id="dniNumber"
            name="dniNumber"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="30123456"
            value={formState.dniNumber}
            onChange={(event) => updateField('dniNumber', event.target.value)}
          />
          <FieldError messages={fieldErrors.dniNumber} />
        </div>
      );
    }

    if (step.id === 'dni-photos') {
      return (
        <div className="grid gap-4">
          <div className="rounded-[24px] border border-border bg-card p-4">
            <Label htmlFor="dniFront">Frente del DNI</Label>
            <Input
              id="dniFront"
              name="dniFront"
              type="file"
              accept="image/jpeg,image/png,image/heic"
              className="mt-3"
              onChange={(event) => updateField('dniFrontReady', Boolean(event.currentTarget.files?.length))}
            />
            <FieldError messages={fieldErrors.dniFront} />
          </div>
          <div className="rounded-[24px] border border-border bg-card p-4">
            <Label htmlFor="dniBack">Dorso del DNI</Label>
            <Input
              id="dniBack"
              name="dniBack"
              type="file"
              accept="image/jpeg,image/png,image/heic"
              className="mt-3"
              onChange={(event) => updateField('dniBackReady', Boolean(event.currentTarget.files?.length))}
            />
            <FieldError messages={fieldErrors.dniBack} />
          </div>
        </div>
      );
    }

    if (step.id === 'zone') {
      return (
        <div className="grid gap-4">
          <MobileMapPreview address={formState.addressText} />
          <div className="space-y-2">
            <Label htmlFor="addressText">Zona de trabajo</Label>
            <Input
              id="addressText"
              name="addressText"
              placeholder="Salta Capital"
              autoComplete="street-address"
              value={formState.addressText}
              onChange={(event) => updateField('addressText', event.target.value)}
            />
            <FieldError messages={fieldErrors.addressText} />
          </div>
        </div>
      );
    }

    if (step.id === 'categories') {
      return (
        <div className="grid grid-cols-2 gap-3">
          {workerCategorySlugs.map((category) => {
            const selected = formState.workerCategories.includes(category);

            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                className={cn(
                  'min-h-20 rounded-[22px] border p-4 text-left text-sm font-bold transition-colors',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                    : 'border-border bg-card text-foreground hover:border-primary'
                )}
                onClick={() => toggleCategory(category)}
              >
                {workerCategoryLabels[category]}
              </button>
            );
          })}
          <div className="col-span-2">
            <FieldError messages={fieldErrors.workerCategories} />
          </div>
        </div>
      );
    }

    if (step.id === 'price') {
      return (
        <div className="space-y-2">
          <Label htmlFor="hourlyRatePesos">Precio por hora</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary">
              ARS
            </span>
            <Input
              id="hourlyRatePesos"
              name="hourlyRatePesos"
              inputMode="numeric"
              className="pl-16"
              placeholder="4500"
              value={formState.hourlyRatePesos}
              onChange={(event) => updateField('hourlyRatePesos', event.target.value)}
            />
          </div>
          <FieldError messages={fieldErrors.hourlyRatePesos} />
        </div>
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
            {formState.firstName || 'Tu perfil'} va a quedar visible como trabajador.
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Zona</dt>
              <dd className="font-bold text-foreground">{formState.addressText || 'Sin zona'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Precio base</dt>
              <dd className="font-bold text-foreground">ARS {formState.hourlyRatePesos || '0'}</dd>
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
        eyebrow="Perfil trabajador"
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
