import * as React from 'react';

import { cn } from '@/lib/utils';

type ShellWidth = 'sm' | 'md' | 'lg' | 'xl';

const widthClassBySize: Record<ShellWidth, string> = {
  sm: 'max-w-4xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl'
};

export function YavaaPageShell({
  children,
  className,
  width = 'lg'
}: {
  children: React.ReactNode;
  className?: string;
  width?: ShellWidth;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className={cn('mx-auto w-full px-4 py-8 sm:px-6 lg:px-8', widthClassBySize[width], className)}>
        {children}
      </div>
    </main>
  );
}

export function YavaaHero({
  eyebrow,
  title,
  description,
  children,
  className
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-5', className)}>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-none tracking-normal text-balance sm:text-5xl">
          {title}
        </h1>
        {description ? <p className="max-w-2xl text-base leading-7 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function YavaaSurface({
  children,
  className,
  as: Comp = 'section'
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return (
    <Comp className={cn('rounded-lg border border-border/80 bg-card/95 shadow-soft', className)}>
      {children}
    </Comp>
  );
}

export function AuthPageFrame({
  eyebrow,
  title,
  description,
  previewTitle,
  previewDescription,
  children
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  previewTitle: string;
  previewDescription: string;
  children: React.ReactNode;
}) {
  return (
    <YavaaPageShell width="lg" className="flex min-h-screen items-center py-6 sm:py-10">
      <section className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.72fr)] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-xl font-black text-primary-foreground shadow-soft">
              Y
            </div>
            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
              <h1 className="max-w-2xl font-display text-4xl font-bold leading-none tracking-normal text-foreground sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-bold text-foreground">{previewTitle}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{previewDescription}</p>
          </div>
        </div>

        <YavaaSurface className="rounded-[28px] p-5 shadow-soft sm:p-7">{children}</YavaaSurface>
      </section>
    </YavaaPageShell>
  );
}
