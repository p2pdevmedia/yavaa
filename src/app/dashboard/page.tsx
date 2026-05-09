import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildSignInPath, getAuthSessionState } from '@/lib/auth';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  if (!authState.authenticated) {
    redirect(buildSignInPath('/dashboard') as Route);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Área protegida</CardTitle>
          <CardDescription>
            Esta ruta está reservada para usuarios autenticados y crecerá en fases posteriores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>La etapa 01 deja lista la sesión real con Supabase y la protección de la ruta.</p>
          <p className="font-mono text-foreground">{authState.user?.email ?? 'Sesión autenticada'}</p>
          <div className="pt-2">
            {authState.configured ? (
              <SignOutButton />
            ) : (
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Supabase no configurado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
