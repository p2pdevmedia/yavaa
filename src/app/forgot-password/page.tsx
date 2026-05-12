import { cookies } from 'next/headers';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { AuthPageFrame } from '@/components/ui/yavaa-layout';
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
    <AuthPageFrame
      eyebrow="Recuperación"
      title="Volvé a entrar con un enlace seguro."
      description="Te mandamos un enlace para crear una contraseña nueva y seguir usando tu cuenta."
      previewTitle="Sin vueltas"
      previewDescription="El enlace abre una sesión temporal de Supabase y evita exponer tokens en formularios propios."
    >
      <ForgotPasswordForm configured={authState.configured} authError={authError} />
    </AuthPageFrame>
  );
}
