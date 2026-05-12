import Link from 'next/link';
import type { Route } from 'next';

import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import type { AppUserProfile } from '@/lib/app-user';

export function ClientHome({ profile }: { profile: AppUserProfile | null }) {
  const firstName = profile?.firstName ?? 'Tu perfil';

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Cliente home</p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Hola, {firstName}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Elegí una acción clara para resolver tu próximo trabajo sin vueltas.
          </p>
        </div>

        <article className="rounded-[30px] bg-primary p-6 text-primary-foreground shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-80">Acción principal</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-normal">Publicá un trabajo</h2>
          <p className="mt-3 text-sm leading-6 opacity-90">
            Contá qué necesitás, dónde y cuándo. En la próxima etapa vas a poder recibir opciones cerca.
          </p>
          <Button asChild className="mt-6 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link href={'/dashboard/jefe/publicar-trabajo' as Route}>Publicar trabajo</Link>
          </Button>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Secundario</p>
            <h2 className="mt-3 text-xl font-bold text-foreground">Buscar trabajadores</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Explorá perfiles cercanos cuando quieras comparar opciones.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href={'/dashboard/jefe/buscar-trabajadores' as Route}>Buscar trabajadores</Link>
            </Button>
          </article>

          <article className="rounded-[24px] border border-dashed border-border bg-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Ofertas sugeridas</p>
            <h2 className="mt-3 text-xl font-bold text-foreground">Todavía no hay actividad</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cuando publiques trabajos, este espacio va a mostrar respuestas y sugerencias.
            </p>
          </article>
        </div>
      </section>
    </YavaaPageShell>
  );
}
