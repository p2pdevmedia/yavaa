import Link from 'next/link';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { APP_NAME } from '@/lib/app-metadata';
import { getAuthSessionState } from '@/lib/auth';
import { buildRootAuthCodeRedirectPath } from '@/lib/auth-redirect';

type HomePageProps = {
  searchParams?: Promise<{
    code?: string | string[];
    type?: string | string[];
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await Promise.resolve(searchParams)) ?? {};
  const authRedirectPath = buildRootAuthCodeRedirectPath(resolvedSearchParams);

  if (authRedirectPath) {
    redirect(authRedirectPath as Route);
  }

  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  return (
    <YavaaPageShell width="xl" className="flex min-h-screen items-center py-5 sm:py-8">
      <section className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,450px)] lg:items-center">
        <div className="space-y-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-primary text-base font-black text-primary-foreground shadow-soft">
                Y
              </div>
              <span className="text-sm font-extrabold text-foreground">{APP_NAME}</span>
            </div>
            {authState.authenticated ? (
              <Link
                href={'/dashboard' as Route}
                className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                Mi cuenta
              </Link>
            ) : (
              <Link
                href={{ pathname: '/sign-in', query: { next: '/dashboard' } }}
                className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                Ingresar
              </Link>
            )}
          </header>

          <div className="space-y-5">
            <p className="inline-flex rounded-full bg-card px-3 py-2 text-xs font-extrabold text-primary shadow-soft">
              Cerca tuyo
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl font-black leading-none tracking-normal text-foreground text-balance sm:text-6xl lg:text-7xl">
                Consegui ayuda cerca, desde hoy.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Yavaa te ayuda a empezar rapido: crea tu cuenta, elegi si sos Jefe o Trabajador y accede a
                perfiles pensados para conectar por cercania.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl gap-3 rounded-[28px] border border-border bg-card p-3 shadow-soft">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
              <div className="flex min-h-14 items-center gap-3 rounded-[20px] bg-muted px-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-black text-primary">
                  +
                </span>
                <span className="text-sm font-extrabold text-foreground">Elegir perfil</span>
              </div>
              <div className="flex min-h-14 items-center gap-3 rounded-[20px] bg-muted px-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-black text-primary">
                  •
                </span>
                <span className="text-sm font-extrabold text-foreground">Usar mi ubicación</span>
              </div>
            </div>

            {authState.authenticated ? (
              <Button asChild className="w-full">
                <Link href={'/dashboard' as Route}>Ir a selección de perfil</Link>
              </Button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Button asChild className="w-full">
                  <Link href={{ pathname: '/sign-up', query: { next: '/dashboard' } }}>Empezar en Yavaa</Link>
                </Button>
                <Button asChild className="w-full sm:w-auto" variant="outline">
                  <Link href={{ pathname: '/sign-in', query: { next: '/dashboard' } }}>Iniciar sesión</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="grid max-w-xl gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-black text-foreground">2 min</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">para crear tu acceso inicial.</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-black text-foreground">Jefe</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">modo para gestionar perfiles.</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-black text-foreground">Trabajador</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">modo para presentarte claro.</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[34px] border border-border bg-card p-3 shadow-soft sm:p-4">
          <div className="overflow-hidden rounded-[26px] border border-border bg-background">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-primary text-sm font-black text-primary-foreground">
                  Y
                </div>
                <span className="text-sm font-black text-foreground">Yavaa</span>
              </div>
              <span className="text-xs font-extrabold text-muted-foreground">Ahora</span>
            </div>

            <div className="px-5 pb-5">
              <div
                data-testid="home-map-preview"
                className="relative h-[340px] overflow-hidden rounded-[28px] border border-border bg-[#f7f7f4]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(229,229,229,0.78)_1px,transparent_1px),linear-gradient(rgba(229,229,229,0.78)_1px,transparent_1px)] bg-[size:36px_36px]" />
                <div className="absolute -left-12 top-24 h-14 w-80 -rotate-12 rounded-full bg-white/95 shadow-inner" />
                <div className="absolute -right-10 top-48 h-14 w-72 rotate-[24deg] rounded-full bg-white/95 shadow-inner" />
                <div className="absolute left-8 top-12 flex h-14 w-14 items-center justify-center rounded-full border-[4px] border-card bg-primary text-xs font-black text-primary-foreground shadow-soft">
                  1km
                </div>
                <div className="absolute right-10 top-24 flex h-14 w-14 items-center justify-center rounded-full border-[4px] border-card bg-[var(--yavaa-success)] text-xs font-black text-white shadow-soft">
                  OK
                </div>
                <div className="absolute bottom-12 left-[44%] flex h-14 w-14 items-center justify-center rounded-full border-[4px] border-card bg-[#F59E0B] text-xs font-black text-foreground shadow-soft">
                  rol
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-[22px] border border-border bg-card/95 p-4 shadow-soft backdrop-blur">
                  <p className="text-sm font-black text-foreground">Perfiles cerca listos para empezar</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    La selección de modo mantiene cada acción del lado correcto.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-[20px] bg-card p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-secondary text-sm font-black text-primary">
                    J
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Entrar como Jefe</p>
                    <p className="text-xs leading-5 text-muted-foreground">Perfil protegido despues del login.</p>
                  </div>
                  <span className="text-xs font-black text-primary">modo</span>
                </div>
                <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-[20px] bg-card p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-secondary text-sm font-black text-primary">
                    T
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Entrar como Trabajador</p>
                    <p className="text-xs leading-5 text-muted-foreground">Tu rol se valida antes de continuar.</p>
                  </div>
                  <span className="text-xs font-black text-primary">rol</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </YavaaPageShell>
  );
}
