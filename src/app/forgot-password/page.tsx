import { cookies } from 'next/headers';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { YavaaHero, YavaaPageShell, YavaaSurface } from '@/components/ui/yavaa-layout';
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
    <YavaaPageShell width="md" className="flex min-h-screen items-center py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <YavaaHero
          eyebrow="Recuperación"
          title="Pedí un enlace seguro para volver a entrar."
          description="El enlace abre una sesión temporal de Supabase y permite guardar una contraseña nueva sin exponer tokens en formularios propios."
        />

        <YavaaSurface className="p-6 backdrop-blur">
          <ForgotPasswordForm configured={authState.configured} authError={authError} />
        </YavaaSurface>
      </section>
    </YavaaPageShell>
  );
}
