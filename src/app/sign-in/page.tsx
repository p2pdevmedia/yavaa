import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { AuthForm } from '@/components/auth/auth-form';
import { YavaaHero, YavaaPageShell, YavaaSurface } from '@/components/ui/yavaa-layout';
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
    <YavaaPageShell width="md" className="flex min-h-screen items-center py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <YavaaHero
          eyebrow="Acceso seguro"
          title="Entrá para elegir tu perfil."
          description="Tu cuenta mantiene usuarios, perfiles y roles protegidos con Supabase Auth."
        />

        <YavaaSurface className="p-6 backdrop-blur">
          <AuthForm mode="sign-in" nextPath={nextPath} configured={authState.configured} initialError={authError ?? null} />
        </YavaaSurface>
      </section>
    </YavaaPageShell>
  );
}
