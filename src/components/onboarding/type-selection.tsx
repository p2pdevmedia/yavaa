import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getModeSelectionPath, type DashboardMode } from '@/lib/dashboard-routes';

type TypeSelectionMode = {
  slug: DashboardMode;
  title: string;
  description: string;
  eyebrow: string;
  allowed: boolean;
};

const badgeByMode: Record<DashboardMode, string> = {
  jefe: 'J',
  trabajador: 'T'
};

export function TypeSelection({ modes }: { modes: TypeSelectionMode[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {modes.map((mode) => (
        <article
          key={mode.slug}
          className="flex min-h-[220px] flex-col justify-between rounded-[28px] border border-border bg-card p-5 shadow-soft"
        >
          <div className="space-y-4">
            <div
              className={
                mode.slug === 'jefe'
                  ? 'flex h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-100 text-lg font-black text-emerald-700'
                  : 'flex h-12 w-12 items-center justify-center rounded-[18px] bg-secondary text-lg font-black text-secondary-foreground'
              }
            >
              {badgeByMode[mode.slug]}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{mode.eyebrow}</p>
              <h2 className="font-display text-2xl font-bold tracking-normal text-foreground">{mode.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{mode.description}</p>
            </div>
          </div>

          {mode.allowed ? (
            <Button asChild className="mt-6 w-full" variant={mode.slug === 'jefe' ? 'default' : 'outline'}>
              <Link href={getModeSelectionPath(mode.slug)}>Continuar</Link>
            </Button>
          ) : (
            <Button className="mt-6 w-full" disabled variant={mode.slug === 'jefe' ? 'default' : 'outline'}>
              Rol no asignado
            </Button>
          )}
        </article>
      ))}
    </div>
  );
}
