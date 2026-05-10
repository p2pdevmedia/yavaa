import Link from 'next/link';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  Hammer,
  Heart,
  Home,
  Leaf,
  MapPin,
  MessageCircle,
  Paintbrush,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wrench,
  Zap
} from 'lucide-react';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_DESCRIPTION, APP_NAME, APP_VERSION } from '@/lib/app-metadata';
import { buildAuthErrorRedirectPath, hasAuthErrorParams, type AuthErrorParams } from '@/lib/auth-errors';
import { buildRootAuthCodeRedirectPath } from '@/lib/auth-redirect';
import { getAuthSessionState } from '@/lib/auth';

type HomePageProps = {
  searchParams?: Promise<AuthErrorParams & {
    code?: string | string[];
  }>;
};

const categories = [
  { label: 'Plomería', icon: Wrench, tone: 'bg-[#f4d5c9] text-[#7b2d1d]' },
  { label: 'Electricidad', icon: Zap, tone: 'bg-[#f5e2a6] text-[#6d4a00]' },
  { label: 'Limpieza', icon: Sparkles, tone: 'bg-[#d9efe3] text-[#24523a]' },
  { label: 'Jardinería', icon: Leaf, tone: 'bg-[#d6ead0] text-[#2e5b25]' },
  { label: 'Pintura', icon: Paintbrush, tone: 'bg-[#dfd8f2] text-[#48316f]' },
  { label: 'Hogar', icon: Home, tone: 'bg-[#d8e8f2] text-[#1f4d65]' },
  { label: 'Arreglos', icon: Hammer, tone: 'bg-[#efdac1] text-[#684321]' },
  { label: 'Trámites', icon: BriefcaseBusiness, tone: 'bg-[#eadfcf] text-[#564232]' }
];

const nearbyProviders = [
  {
    name: 'Carlos Perez',
    trade: 'Servicios del hogar',
    rating: '4.9',
    reviews: '118',
    eta: 'Hoy',
    distance: 'San Martín',
    initials: 'CP',
    accent: 'bg-[#e4b69a] text-[#5c2615]'
  },
  {
    name: 'Lucía Rivas',
    trade: 'Electricista',
    rating: '4.8',
    reviews: '86',
    eta: 'Urgencias',
    distance: 'Centro',
    initials: 'LR',
    accent: 'bg-[#ccd7b8] text-[#304720]'
  },
  {
    name: 'Mateo Suárez',
    trade: 'Plomería',
    rating: '5.0',
    reviews: '142',
    eta: 'Mañana',
    distance: 'La Cascada',
    initials: 'MS',
    accent: 'bg-[#c9ddeb] text-[#244b61]'
  }
];

const trustItems = [
  { label: 'Identidad verificada', value: 'DNI y perfil revisados' },
  { label: 'Cliente en control', value: 'Elegís antes de confirmar' },
  { label: 'Coordinación interna', value: 'Booking, chat y estado en Yavaa' }
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
    <main className="min-h-screen bg-[#f6efe3] text-[#1f1a14]">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8 lg:py-8">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-col">
          <header className="flex items-center justify-between gap-4 py-2">
            <Link href={'/' as Route} className="font-display text-3xl font-semibold tracking-normal">
              {APP_NAME}
            </Link>
            <nav aria-label="Principal" className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="hidden rounded-[8px] text-[#4f463d] hover:bg-[#fff8ec] sm:inline-flex"
              >
                <Link href={'/providers' as Route}>Proveedores</Link>
              </Button>
              {authState.authenticated ? (
                <Button asChild size="sm" className="rounded-[8px] bg-[#c0492a] text-[#fff5ec] hover:bg-[#a93f24]">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-[8px] border-[#e5dbc8] bg-[#fffaf0] text-[#1f1a14] hover:bg-[#fff5e7]"
                >
                  <Link href={{ pathname: '/sign-in', query: { next: '/dashboard' } }}>
                    Iniciar sesión
                  </Link>
                </Button>
              )}
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-7">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-transparent bg-[#fff8ec] px-3 py-1 text-[#6b6258]">
                  <MapPin className="h-3.5 w-3.5 text-[#c0492a]" />
                  San Martín de los Andes
                  <ChevronDown className="h-3.5 w-3.5" />
                </Badge>
                <Badge variant="outline" className="border-[#e5dbc8] bg-[#fffaf0] px-3 py-1 text-[#6b6258]">
                  Web v{APP_VERSION}
                </Badge>
              </div>

              <div className="max-w-3xl space-y-4">
                <p className="text-base text-[#6b6258]">Buenos días,</p>
                <h1 className="font-display text-4xl font-semibold leading-none tracking-normal text-balance sm:text-5xl lg:text-6xl">
                  ¿Qué necesitás resolver{' '}
                  <em className="font-serif font-normal italic text-[#c0492a]">hoy</em>?
                </h1>
              </div>

              <div className="max-w-2xl rounded-[8px] border border-[#e5dbc8] bg-[#fffaf0] p-2 shadow-[0_18px_50px_rgba(82,54,30,0.10)]">
                <Link
                  href={'/providers' as Route}
                  className="flex items-center gap-3 rounded-[6px] px-3 py-3 text-left transition hover:bg-[#f9f0df] sm:px-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[#c0492a] text-[#fff5ec]">
                    <Search className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#1f1a14]">Buscar servicios</span>
                    <span className="block truncate text-sm text-[#6b6258]">
                      Plomería, electricidad, limpieza, jardinería...
                    </span>
                  </span>
                  <span className="hidden rounded-[8px] border border-[#e5dbc8] px-3 py-2 text-xs font-semibold text-[#6b6258] sm:inline-flex">
                    Ver resultados
                  </span>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-[8px] bg-[#c0492a] text-[#fff5ec] hover:bg-[#a93f24]">
                  <Link href={'/providers' as Route}>Buscar servicios</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-[8px] border-[#d6c7b0] bg-transparent text-[#1f1a14] hover:bg-[#fff8ec]"
                >
                  <Link href={'/providers' as Route}>Explorar proveedores</Link>
                </Button>
                {authState.authenticated ? (
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-[8px] border-[#d6c7b0] bg-transparent text-[#1f1a14] hover:bg-[#fff8ec]"
                  >
                    <Link href="/api/openapi">Contrato OpenAPI</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="secondary"
                    className="rounded-[8px] bg-[#e8f2df] text-[#24523a] hover:bg-[#dcebd0]"
                  >
                    <Link href={{ pathname: '/sign-up', query: { next: '/dashboard' } }}>
                      Crear cuenta
                    </Link>
                  </Button>
                )}
              </div>

              <p className="max-w-2xl text-base leading-7 text-[#5f574e]">
                {APP_DESCRIPTION} Encontrá profesionales aprobados, compará opciones y coordiná
                el trabajo desde una experiencia simple.
              </p>

              {authState.authenticated ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b6258]">
                  <span>
                    Sesión activa{authState.user?.email ? ` como ${authState.user.email}` : ''}.
                  </span>
                  {authState.configured ? (
                    <SignOutButton />
                  ) : (
                    <span className="text-xs uppercase tracking-[0.2em]">Supabase no configurado</span>
                  )}
                </div>
              ) : null}
            </div>

            <aside
              aria-label="Profesionales destacados"
              className="rounded-[8px] border border-[#e5dbc8] bg-[#fffaf0] p-4 shadow-[0_18px_50px_rgba(82,54,30,0.08)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#6b6258]">Cerca de vos</p>
                  <h2 className="font-display text-2xl font-semibold tracking-normal">Disponibles</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#e8f2df] text-[#2f6b3a]">
                  <Bell className="h-5 w-5" />
                </span>
              </div>

              <div className="space-y-3">
                {nearbyProviders.map((provider) => (
                  <Link
                    key={provider.name}
                    href={'/providers' as Route}
                    className="flex items-center gap-3 rounded-[8px] border border-[#eadfce] bg-white/70 p-3 transition hover:border-[#c0492a]/40 hover:bg-white"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] font-display text-base font-semibold ${provider.accent}`}
                    >
                      {provider.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#1f1a14]">
                        {provider.name}
                        <BadgeCheck className="h-4 w-4 text-[#2f6b3a]" />
                      </span>
                      <span className="block truncate text-sm text-[#6b6258]">{provider.trade}</span>
                    </span>
                    <span className="text-right text-xs text-[#6b6258]">
                      <span className="flex items-center justify-end gap-1 font-semibold text-[#1f1a14]">
                        <Star className="h-3.5 w-3.5 fill-[#c0492a] text-[#c0492a]" />
                        {provider.rating}
                      </span>
                      {provider.eta}
                    </span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>

        <aside className="hidden min-h-[calc(100vh-4rem)] flex-col justify-center lg:flex">
          <div className="relative mx-auto w-full max-w-[402px] overflow-hidden rounded-[48px] border border-[#1f1a14]/10 bg-[#f6efe3] shadow-[0_40px_90px_rgba(31,26,20,0.20)]">
            <div className="absolute left-1/2 top-3 z-10 h-9 w-32 -translate-x-1/2 rounded-full bg-black" />
            <div className="px-5 pb-24 pt-16">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#6b6258]">
                  <MapPin className="h-4 w-4 text-[#c0492a]" />
                  Centro
                  <ChevronDown className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fffaf0]">
                    <Heart className="h-4 w-4" />
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4b69a] text-sm font-semibold text-[#5c2615]">
                    C
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[15px] text-[#6b6258]">Buenos días,</p>
                <p className="mt-1 font-display text-[40px] font-semibold leading-none tracking-normal">
                  ¿Qué necesitás
                  <br />
                  arreglar <em className="font-serif font-normal italic text-[#c0492a]">hoy</em>?
                </p>
              </div>

              <Link
                href={'/providers' as Route}
                className="mt-6 flex items-center gap-3 rounded-[16px] border border-[#e5dbc8] bg-[#fffaf0] px-4 py-3 text-sm text-[#6b6258]"
              >
                <Search className="h-5 w-5" />
                Buscar plomero, electricista...
              </Link>

              <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-dashed border-[#e5dbc8] bg-[#fffaf0] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#e8f2df] text-[#2f6b3a]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Profesionales verificados</p>
                  <p className="text-xs text-[#6b6258]">Identidad, reseñas y estado revisados</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold tracking-normal">Categorías</h2>
                <Link href={'/providers' as Route} className="text-sm font-semibold text-[#c0492a]">
                  Ver todo
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {categories.map((category) => {
                  const Icon = category.icon;

                  return (
                    <Link
                      key={category.label}
                      href={'/providers' as Route}
                      className="flex flex-col items-center gap-2 rounded-[16px] border border-[#e5dbc8] bg-[#fffaf0] px-2 py-3 text-center text-[11px] font-medium"
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${category.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      {category.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold tracking-normal">Mejor calificados</h2>
                <Link href={'/providers' as Route} className="text-sm font-semibold text-[#c0492a]">
                  Ver todo
                </Link>
              </div>

              <div className="mt-3 space-y-3">
                {nearbyProviders.slice(0, 2).map((provider) => (
                  <Link
                    key={provider.name}
                    href={'/providers' as Route}
                    className="flex items-center gap-3 rounded-[16px] border border-[#e5dbc8] bg-[#fffaf0] p-3"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full font-display font-semibold ${provider.accent}`}
                    >
                      {provider.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        {provider.name}
                        <BadgeCheck className="h-4 w-4 text-[#2f6b3a]" />
                      </span>
                      <span className="block truncate text-xs text-[#6b6258]">{provider.trade}</span>
                    </span>
                    <span className="text-xs font-semibold text-[#1f1a14]">{provider.rating}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 left-5 right-5 flex items-center justify-between rounded-[28px] border border-[#e5dbc8] bg-[#fffaf0]/95 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur">
              {[
                { label: 'Inicio', icon: Home, active: true },
                { label: 'Buscar', icon: Search, active: false },
                { label: 'Reservas', icon: CalendarClock, active: false },
                { label: 'Mensajes', icon: MessageCircle, active: false },
                { label: 'Tú', icon: UserRound, active: false }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <span
                    key={item.label}
                    className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                      item.active ? 'text-[#c0492a]' : 'text-[#6b6258]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      <section className="border-t border-[#e5dbc8] bg-[#fffaf0]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#e8f2df] text-[#2f6b3a]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold tracking-normal">Profesionales verificados</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b6258]">
                Identidad, aprobación y estado operativo visibles antes de coordinar.
              </p>
            </div>
          </div>
          {trustItems.slice(1).map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c0492a]" />
              <div>
                <h2 className="font-display text-lg font-semibold tracking-normal">{item.label}</h2>
                <p className="mt-1 text-sm leading-6 text-[#6b6258]">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c0492a]">Empezá por acá</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-normal">Categorías frecuentes</h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="hidden rounded-[8px] border-[#d6c7b0] bg-transparent text-[#1f1a14] hover:bg-[#fff8ec] sm:inline-flex"
          >
            <Link href={'/providers' as Route}>Ver todo</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.label}
                href={'/providers' as Route}
                className="flex items-center gap-3 rounded-[8px] border border-[#e5dbc8] bg-[#fffaf0] p-4 transition hover:border-[#c0492a]/50 hover:bg-white"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] ${category.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold">{category.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
