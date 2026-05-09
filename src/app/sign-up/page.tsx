import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { AuthForm } from '@/components/auth/auth-form';
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Crear cuenta
          </p>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-display">
            Registrate para activar tu acceso y volver al flujo principal.
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            La cuenta de Supabase nos da una base simple para manejar sesión, protección de rutas y
            el siguiente paso de permisos por rol.
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft backdrop-blur">
          <AuthForm mode="sign-up" nextPath={nextPath} configured={authState.configured} />
        </div>
      </section>
    </main>
  );
}
