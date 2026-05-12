import type { Route } from 'next';
import { z } from 'zod';

import type { AppUserProfile } from '@/lib/app-user';
import { isProfileAvatarBlobPath } from '@/lib/profile-avatar';

export const onboardingModes = ['jefe', 'trabajador'] as const;
export type OnboardingMode = (typeof onboardingModes)[number];

export const workerCategorySlugs = [
  'construction',
  'cleaning',
  'classes',
  'plumbing',
  'gardening',
  'painting',
  'moving'
] as const;

export type WorkerCategorySlug = (typeof workerCategorySlugs)[number];

export const workerCategoryLabels: Record<WorkerCategorySlug, string> = {
  construction: 'Construcción',
  cleaning: 'Limpieza',
  classes: 'Clases',
  plumbing: 'Plomería',
  gardening: 'Jardinería',
  painting: 'Pintura',
  moving: 'Mudanzas'
};

export function isOnboardingMode(value: string): value is OnboardingMode {
  return (onboardingModes as ReadonlyArray<string>).includes(value);
}

export function hasCompletedOnboarding(
  profile: Pick<AppUserProfile, 'workerOnboardingCompletedAt' | 'jefeOnboardingCompletedAt'> | null,
  mode: OnboardingMode
): boolean {
  if (!profile) {
    return false;
  }

  return mode === 'jefe'
    ? Boolean(profile.jefeOnboardingCompletedAt)
    : Boolean(profile.workerOnboardingCompletedAt);
}

export function getRequiredOnboardingPath(mode: OnboardingMode): Route {
  return `/dashboard/onboarding/${mode}` as Route;
}

export function getPostOnboardingDashboardPath(mode: OnboardingMode): Route {
  return `/dashboard/${mode}` as Route;
}

const messages = {
  firstNameRequired: 'Ingresá tu nombre.',
  lastNameRequired: 'Ingresá tu apellido.',
  textMax40: 'Usá 40 caracteres o menos.',
  addressRequired: 'Ingresá una ubicación válida.',
  addressMax: 'Usá 160 caracteres o menos.',
  dniInvalid: 'Ingresá un DNI válido de 7 u 8 números.',
  categoryRequired: 'Elegí al menos un tipo de trabajo.',
  categoryInvalid: 'Elegí un tipo de trabajo válido.',
  hourlyRateInvalid: 'Ingresá un precio por hora válido.',
  hourlyRateInteger: 'El precio por hora debe ser un número entero.',
  hourlyRatePositive: 'El precio por hora tiene que ser mayor a 0.',
  hourlyRateMax: 'El precio por hora es demasiado alto.',
  avatarBlobPathInvalid: 'Subí una foto válida.'
} as const;

const firstNameSchema = z
  .string({
    required_error: messages.firstNameRequired,
    invalid_type_error: messages.firstNameRequired
  })
  .trim()
  .min(1, messages.firstNameRequired)
  .max(40, messages.textMax40);

const lastNameSchema = z
  .string({
    required_error: messages.lastNameRequired,
    invalid_type_error: messages.lastNameRequired
  })
  .trim()
  .min(1, messages.lastNameRequired)
  .max(40, messages.textMax40);

const addressSchema = z
  .string({
    required_error: messages.addressRequired,
    invalid_type_error: messages.addressRequired
  })
  .trim()
  .min(3, messages.addressRequired)
  .max(160, messages.addressMax);

const dniNumberSchema = z
  .string({
    required_error: messages.dniInvalid,
    invalid_type_error: messages.dniInvalid
  })
  .trim()
  .regex(/^\d{7,8}$/, messages.dniInvalid);

const workerCategorySchema = z.enum(workerCategorySlugs, {
  errorMap: () => ({ message: messages.categoryInvalid })
});

const workerCategoriesSchema = z
  .array(workerCategorySchema, {
    required_error: messages.categoryRequired,
    invalid_type_error: messages.categoryRequired
  })
  .min(1, messages.categoryRequired);

const hourlyRatePesosSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      return trimmedValue === '' ? Number.NaN : trimmedValue;
    }

    return value ?? Number.NaN;
  },
  z.coerce
    .number({ invalid_type_error: messages.hourlyRateInvalid })
    .int(messages.hourlyRateInteger)
    .positive(messages.hourlyRatePositive)
    .max(10_000_000, messages.hourlyRateMax)
);

export const workerOnboardingSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  dniNumber: dniNumberSchema,
  addressText: addressSchema,
  workerCategories: workerCategoriesSchema,
  hourlyRatePesos: hourlyRatePesosSchema
});

export const jefeOnboardingSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  addressText: addressSchema,
  avatarBlobPath: z
    .string()
    .trim()
    .refine((value) => isProfileAvatarBlobPath(value), messages.avatarBlobPathInvalid)
    .nullable()
    .optional()
});

export type WorkerOnboardingInput = z.infer<typeof workerOnboardingSchema>;
export type JefeOnboardingInput = z.infer<typeof jefeOnboardingSchema>;

export type WorkerOnboardingField = keyof WorkerOnboardingInput;
export type JefeOnboardingField = keyof JefeOnboardingInput;

export type OnboardingFieldErrors<TField extends string> = Partial<Record<TField, string[]>>;

export type OnboardingValidationResult<TData, TField extends string> =
  | {
      ok: true;
      data: TData;
      fieldErrors: Record<string, never>;
    }
  | {
      ok: false;
      fieldErrors: OnboardingFieldErrors<TField>;
    };

function mapZodFieldErrors<TField extends string>(error: z.ZodError): OnboardingFieldErrors<TField> {
  const fieldErrors: OnboardingFieldErrors<TField> = {};

  for (const [field, messagesForField] of Object.entries(error.flatten().fieldErrors)) {
    if (messagesForField && messagesForField.length > 0) {
      fieldErrors[field as TField] = messagesForField;
    }
  }

  return fieldErrors;
}

export function validateWorkerOnboardingInput(
  input: unknown
): OnboardingValidationResult<WorkerOnboardingInput, WorkerOnboardingField> {
  const result = workerOnboardingSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      fieldErrors: mapZodFieldErrors<WorkerOnboardingField>(result.error)
    };
  }

  return {
    ok: true,
    data: result.data,
    fieldErrors: {}
  };
}

export function validateJefeOnboardingInput(
  input: unknown
): OnboardingValidationResult<JefeOnboardingInput, JefeOnboardingField> {
  const result = jefeOnboardingSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      fieldErrors: mapZodFieldErrors<JefeOnboardingField>(result.error)
    };
  }

  return {
    ok: true,
    data: result.data,
    fieldErrors: {}
  };
}
