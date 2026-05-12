import { cookies } from 'next/headers';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { AuthPageFrame } from '@/components/ui/yavaa-layout';
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
    <AuthPageFrame
      eyebrow="Reset seguro"
      title="Guardá una contraseña nueva."
      description="Esta pantalla funciona después de abrir el enlace de recuperación enviado por email."
      previewTitle="Tu cuenta queda protegida"
      previewDescription="Cuando actualices la contraseña vas a poder seguir al panel y completar el flujo pendiente."
    >
      <ResetPasswordForm configured={authState.configured} authError={authError} />
    </AuthPageFrame>
  );
}
