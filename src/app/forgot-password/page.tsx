import { cookies } from 'next/headers';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { getAuthSessionState } from '@/lib/auth';

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    authError?: string | string[];
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);
  const resolvedSearchParams: {
    authError?: string | string[];
  } = (await Promise.resolve(searchParams)) ?? {};
  const authError = Array.isArray(resolvedSearchParams.authError)
    ? resolvedSearchParams.authError[0]
    : resolvedSearchParams.authError;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Recuperación
          </p>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-display">
            Pedí un enlace seguro para volver a entrar.
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            El enlace abre una sesión temporal de Supabase y permite guardar una contraseña nueva
            sin exponer tokens en formularios propios.
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft backdrop-blur">
          <ForgotPasswordForm configured={authState.configured} authError={authError} />
        </div>
      </section>
    </main>
  );
}
