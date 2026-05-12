import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { AuthForm } from '@/components/auth/auth-form';
import { YavaaHero, YavaaPageShell, YavaaSurface } from '@/components/ui/yavaa-layout';
import { getAuthSessionState, normalizeNextPath } from '@/lib/auth';

type SignUpPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);
  const resolvedSearchParams: {
    next?: string | string[];
  } = (await Promise.resolve(searchParams)) ?? {};
  const nextPath = normalizeNextPath(
    Array.isArray(resolvedSearchParams.next) ? resolvedSearchParams.next[0] : resolvedSearchParams.next
  );

  if (authState.authenticated) {
    redirect(nextPath as Route);
  }

  return (
    <YavaaPageShell width="md" className="flex min-h-screen items-center py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <YavaaHero
          eyebrow="Crear cuenta"
          title="Creá tu acceso a Yavaa."
          description="Después del registro vas a poder entrar y elegir entre Jefe o Trabajador."
        />

        <YavaaSurface className="p-6 backdrop-blur">
          <AuthForm mode="sign-up" nextPath={nextPath} configured={authState.configured} />
        </YavaaSurface>
      </section>
    </YavaaPageShell>
  );
}
