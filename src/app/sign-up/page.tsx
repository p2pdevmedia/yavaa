import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { AuthForm } from '@/components/auth/auth-form';
import { AuthPageFrame } from '@/components/ui/yavaa-layout';
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
    <AuthPageFrame
      eyebrow="Crear cuenta"
      title="Tu cuenta empieza simple."
      description="Registrate y después elegí si querés trabajar o contratar. Cada perfil tiene su propio wizard."
      previewTitle="Un acceso, dos caminos"
      previewDescription="Yavaa prepara una experiencia distinta para trabajador y jefe, sin pedir más datos de los necesarios al inicio."
    >
      <AuthForm mode="sign-up" nextPath={nextPath} configured={authState.configured} />
    </AuthPageFrame>
  );
}
