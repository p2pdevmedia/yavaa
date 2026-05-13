import { IdentityVerificationStatus, OnboardingRole } from '@prisma/client';
import type { Route } from 'next';

import { getDashboardHomePath } from '@/lib/dashboard-routes';
import {
  type OnboardingFieldErrors,
  type JefeOnboardingField,
  type JefeOnboardingInput,
  type WorkerOnboardingField,
  type WorkerOnboardingInput,
  validateJefeOnboardingInput,
  validateWorkerOnboardingInput
} from '@/lib/onboarding';
import { canCompleteOnboarding } from '@/lib/permissions';
import { isProfileAvatarBlobPathForUser } from '@/lib/profile-avatar';
import { getPrismaClient } from '@/lib/prisma';
import type { RequestAuthState } from '@/lib/request-auth';

export type WorkerOnboardingResult =
  | {
      ok: true;
      status: 200;
      nextPath: Route;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    }
  | {
      ok: false;
      status: 422;
      message: string;
      fieldErrors: OnboardingFieldErrors<WorkerOnboardingField>;
    };

export type JefeOnboardingResult =
  | {
      ok: true;
      status: 200;
      nextPath: Route;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    }
  | {
      ok: false;
      status: 422;
      message: string;
      fieldErrors: OnboardingFieldErrors<JefeOnboardingField>;
    };

function centsFromPesos(hourlyRatePesos: WorkerOnboardingInput['hourlyRatePesos']): number {
  return hourlyRatePesos * 100;
}

export async function completeWorkerOnboarding(
  auth: RequestAuthState,
  input: unknown,
  completedAt = new Date()
): Promise<WorkerOnboardingResult> {
  if (!auth.authenticated) {
    return {
      ok: false,
      status: 401,
      message: 'Iniciá sesión para completar tu perfil.'
    };
  }

  if (!auth.appUser || !auth.permissionContext) {
    return {
      ok: false,
      status: 403,
      message: 'No pudimos encontrar tu usuario de Yavaa.'
    };
  }

  if (auth.permissionContext.status !== 'ACTIVE') {
    return {
      ok: false,
      status: 403,
      message: 'Tu cuenta no está activa.'
    };
  }

  if (!canCompleteOnboarding(auth.permissionContext, 'trabajador')) {
    return {
      ok: false,
      status: 403,
      message: 'No tenés permiso para completar este perfil.'
    };
  }

  const validation = validateWorkerOnboardingInput(input);

  if (!validation.ok) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del formulario.',
      fieldErrors: validation.fieldErrors
    };
  }

  const data = validation.data;

  if (data.avatarBlobPath && !isProfileAvatarBlobPathForUser(data.avatarBlobPath, auth.appUser.id)) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        avatarBlobPath: ['Subí una foto válida.']
      }
    };
  }

  const profileData = {
    firstName: data.firstName,
    lastName: data.lastName,
    avatarUrl: data.avatarBlobPath ?? null,
    onboardingRole: OnboardingRole.TRABAJADOR,
    workerOnboardingCompletedAt: completedAt,
    identityVerificationStatus: IdentityVerificationStatus.PENDING,
    dniNumber: data.dniNumber,
    workerCategories: data.workerCategories,
    workerHourlyRateCents: centsFromPesos(data.hourlyRatePesos),
    addressText: data.addressText
  };

  await getPrismaClient().profile.upsert({
    where: {
      userId: auth.appUser.id
    },
    create: {
      userId: auth.appUser.id,
      ...profileData
    },
    update: profileData
  });

  return {
    ok: true,
    status: 200,
    nextPath: getDashboardHomePath('trabajador')
  };
}

export async function completeJefeOnboarding(
  auth: RequestAuthState,
  input: unknown,
  completedAt = new Date()
): Promise<JefeOnboardingResult> {
  if (!auth.authenticated) {
    return {
      ok: false,
      status: 401,
      message: 'Iniciá sesión para completar tu perfil.'
    };
  }

  if (!auth.appUser || !auth.permissionContext) {
    return {
      ok: false,
      status: 403,
      message: 'No pudimos encontrar tu usuario de Yavaa.'
    };
  }

  if (auth.permissionContext.status !== 'ACTIVE') {
    return {
      ok: false,
      status: 403,
      message: 'Tu cuenta no está activa.'
    };
  }

  if (!canCompleteOnboarding(auth.permissionContext, 'jefe')) {
    return {
      ok: false,
      status: 403,
      message: 'No tenés permiso para completar este perfil.'
    };
  }

  const validation = validateJefeOnboardingInput(input);

  if (!validation.ok) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del formulario.',
      fieldErrors: validation.fieldErrors
    };
  }

  const data: JefeOnboardingInput = validation.data;

  if (data.avatarBlobPath && !isProfileAvatarBlobPathForUser(data.avatarBlobPath, auth.appUser.id)) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        avatarBlobPath: ['Subí una foto válida.']
      }
    };
  }

  const profileData = {
    firstName: data.firstName,
    lastName: data.lastName,
    avatarUrl: data.avatarBlobPath ?? null,
    onboardingRole: OnboardingRole.JEFE,
    jefeOnboardingCompletedAt: completedAt,
    addressText: data.addressText
  };

  await getPrismaClient().profile.upsert({
    where: {
      userId: auth.appUser.id
    },
    create: {
      userId: auth.appUser.id,
      ...profileData
    },
    update: profileData
  });

  return {
    ok: true,
    status: 200,
    nextPath: getDashboardHomePath('jefe')
  };
}
