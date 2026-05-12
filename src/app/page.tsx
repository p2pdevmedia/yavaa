import Link from 'next/link';
import type { Route } from 'next';
import { cookies } from 'next/headers';

import { Button } from '@/components/ui/button';
import { YavaaHero, YavaaPageShell, YavaaSurface } from '@/components/ui/yavaa-layout';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/app-metadata';
import { getAuthSessionState } from '@/lib/auth';

export default async function HomePage() {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  return (
    <YavaaPageShell width="md" className="flex min-h-screen items-center py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
        <YavaaHero
          eyebrow={APP_NAME}
          title="Acceso simple para elegir tu perfil."
          description={APP_DESCRIPTION}
        />

        <YavaaSurface className="space-y-4 p-6">
          {authState.authenticated ? (
            <Button asChild className="w-full">
              <Link href={'/dashboard' as Route}>Ir a selección de perfil</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link href={{ pathname: '/sign-in', query: { next: '/dashboard' } }}>Iniciar sesión</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href={{ pathname: '/sign-up', query: { next: '/dashboard' } }}>Crear cuenta</Link>
              </Button>
            </>
          )}
        </YavaaSurface>
      </section>
    </YavaaPageShell>
  );
}
