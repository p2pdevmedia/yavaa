import { cookies } from 'next/headers';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { YavaaHero, YavaaPageShell, YavaaSurface } from '@/components/ui/yavaa-layout';
import { getAuthSessionState } from '@/lib/auth';
import { buildAuthErrorMessage, hasAuthErrorParams, type AuthErrorParams } from '@/lib/auth-errors';

type ResetPasswordPageProps = {
  searchParams?: Promise<AuthErrorParams & {
    authError?: string | string[];
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);
  const resolvedSearchParams: AuthErrorParams & {
    authError?: string | string[];
  } = (await Promise.resolve(searchParams)) ?? {};
  const authError = Array.isArray(resolvedSearchParams.authError)
    ? resolvedSearchParams.authError[0]
    : resolvedSearchParams.authError ??
      (hasAuthErrorParams(resolvedSearchParams) ? buildAuthErrorMessage(resolvedSearchParams) : undefined);

  return (
    <YavaaPageShell width="md" className="flex min-h-screen items-center py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <YavaaHero
          eyebrow="Reset seguro"
          title="Guardá una contraseña nueva para tu cuenta."
          description="Esta pantalla funciona después de abrir el enlace de recuperación enviado por email."
        />

        <YavaaSurface className="p-6 backdrop-blur">
          <ResetPasswordForm configured={authState.configured} authError={authError} />
        </YavaaSurface>
      </section>
    </YavaaPageShell>
  );
}
