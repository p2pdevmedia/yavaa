import Link from 'next/link';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { APP_DESCRIPTION, APP_NAME, APP_VERSION } from '@/lib/app-metadata';
import { buildAuthErrorRedirectPath, hasAuthErrorParams, type AuthErrorParams } from '@/lib/auth-errors';
import { buildRootAuthCodeRedirectPath } from '@/lib/auth-redirect';
import { getAuthSessionState } from '@/lib/auth';

type HomePageProps = {
  searchParams?: Promise<AuthErrorParams & {
    code?: string | string[];
  }>;
};

const foundationChecks = [
  { label: 'Next.js App Router', value: 'Activado' },
  { label: 'TypeScript en modo estricto', value: 'Activado' },
  { label: 'Prisma + Postgres', value: 'Preparado' },
  { label: 'Contrato OpenAPI', value: 'Publicado' },
  { label: 'Vitest + Playwright', value: 'Conectado' }
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await Promise.resolve(searchParams)) ?? {};

  if (hasAuthErrorParams(resolvedSearchParams)) {
    redirect(buildAuthErrorRedirectPath(resolvedSearchParams) as Route);
  }

  const authCodeRedirectPath = buildRootAuthCodeRedirectPath(resolvedSearchParams);

  if (authCodeRedirectPath) {
    redirect(authCodeRedirectPath as Route);
  }

  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid flex-1 items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Etapa 01</Badge>
            <Badge variant="outline">v{APP_VERSION}</Badge>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl font-display">
              {APP_NAME} está listo para la Etapa 01 de base tecnica y autenticacion.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              {APP_DESCRIPTION} Esta base nos deja un punto de partida con TypeScript estricto,
              migraciones de Prisma, hooks de autenticación con Supabase, publicación de OpenAPI y
              pruebas deterministas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {authState.authenticated ? (
              <>
                <Button asChild>
                  <Link href="/dashboard">Ir al dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={'/providers' as Route}>Explorar proveedores</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/api/openapi">Contrato OpenAPI</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href={{ pathname: '/sign-in', query: { next: '/dashboard' } }}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={'/providers' as Route}>Explorar proveedores</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={{ pathname: '/sign-up', query: { next: '/dashboard' } }}>
                    Crear cuenta
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/api/health">Ver estado</Link>
                </Button>
              </>
            )}
          </div>

          {authState.authenticated ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Sesión activa{authState.user?.email ? ` como ${authState.user.email}` : ''}.</span>
              {authState.configured ? (
                <SignOutButton />
              ) : (
                <span className="text-xs uppercase tracking-[0.2em]">Supabase no configurado</span>
              )}
            </div>
          ) : null}
        </div>

        <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Lista de base</CardTitle>
            <CardDescription>Pequeña, explícita y fácil de verificar en CI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {foundationChecks.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="font-mono text-sm text-foreground">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>API-first</CardTitle>
            <CardDescription>Estado, sesión inicial y OpenAPI están tipados.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lista para base de datos</CardTitle>
            <CardDescription>El esquema de Prisma, las migraciones y el seed ya están listos.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Testeable</CardTitle>
            <CardDescription>Vitest y Playwright están preparados para validación repetible.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
