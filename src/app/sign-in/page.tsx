import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { AuthForm } from '@/components/auth/auth-form';
import { AuthPageFrame } from '@/components/ui/yavaa-layout';
import { getAuthSessionState, normalizeNextPath } from '@/lib/auth';

type SignInPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    authError?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);
  const resolvedSearchParams: {
    next?: string | string[];
    authError?: string | string[];
  } = (await Promise.resolve(searchParams)) ?? {};
  const nextPath = normalizeNextPath(
    Array.isArray(resolvedSearchParams.next) ? resolvedSearchParams.next[0] : resolvedSearchParams.next
  );
  const authError = Array.isArray(resolvedSearchParams.authError)
    ? resolvedSearchParams.authError[0]
    : resolvedSearchParams.authError;

  if (authState.authenticated) {
    redirect(nextPath as Route);
  }

  return (
    <AuthPageFrame
      eyebrow="Acceso seguro"
      title="Entrá y seguí con tu perfil."
      description="Usá tu cuenta para trabajar, contratar o completar el onboarding que tengas pendiente."
      previewTitle="¿Qué necesitás resolver hoy?"
      previewDescription="Después de iniciar sesión, Yavaa te lleva a elegir tipo, completar tu wizard o entrar directo a tu home."
    >
      <AuthForm mode="sign-in" nextPath={nextPath} configured={authState.configured} initialError={authError ?? null} />
    </AuthPageFrame>
  );
}
