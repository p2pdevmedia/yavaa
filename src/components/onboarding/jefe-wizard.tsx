'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import { MobileMapPreview } from '@/components/onboarding/mobile-map-preview';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type JefeOnboardingField,
  type OnboardingFieldErrors,
  validateJefeOnboardingInput
} from '@/lib/onboarding';

type JefeWizardInitialProfile = {
  firstName?: string | null;
  lastName?: string | null;
  addressText?: string | null;
  avatarUrl?: string | null;
};

type JefeWizardState = {
  firstName: string;
  lastName: string;
  addressText: string;
  avatarUrl: string;
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
  1: ['addressText'],
  2: ['avatarUrl']
};

function getInitialState(profile?: JefeWizardInitialProfile | null): JefeWizardState {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    addressText: profile?.addressText ?? '',
    avatarUrl: profile?.avatarUrl ?? ''
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

  if (fieldErrors.addressText) {
    return 1;
  }

  return 2;
}

export function JefeWizard({ initialProfile }: { initialProfile?: JefeWizardInitialProfile | null }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<JefeWizardState>(() => getInitialState(initialProfile));
  const [fieldErrors, setFieldErrors] = useState<LocalFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const step = steps[stepIndex];
  const isSuccessStep = step.id === 'success';

  const payload = useMemo(
    () => ({
      firstName: formState.firstName,
      lastName: formState.lastName,
      addressText: formState.addressText,
      avatarUrl: formState.avatarUrl.trim() ? formState.avatarUrl : null
    }),
    [formState.addressText, formState.avatarUrl, formState.firstName, formState.lastName]
  );

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
      const response = await fetch('/api/onboarding/jefe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(validation.data)
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
        <div className="grid gap-4">
          <MobileMapPreview address={formState.addressText} />
          <div className="space-y-2">
            <Label htmlFor="addressText">Zona donde necesitás ayuda</Label>
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

    if (step.id === 'photo') {
      return (
        <div className="space-y-4">
          <div className="rounded-[26px] border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-bold text-foreground">Podés dejarlo vacío y completar la foto después.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              En esta etapa solo guardamos una URL opcional. La carga real de archivos queda para una integración de storage.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">URL de foto opcional</Label>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              type="text"
              inputMode="url"
              placeholder="https://..."
              value={formState.avatarUrl}
              onChange={(event) => updateField('avatarUrl', event.target.value)}
            />
            <FieldError messages={fieldErrors.avatarUrl} />
          </div>
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
              <dt className="text-muted-foreground">Foto</dt>
              <dd className="font-bold text-foreground">{formState.avatarUrl ? 'Agregada' : 'Pendiente'}</dd>
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
