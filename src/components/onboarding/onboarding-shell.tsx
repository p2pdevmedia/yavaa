import type { ReactNode } from 'react';

import { ProgressBar } from '@/components/onboarding/progress-bar';
import { cn } from '@/lib/utils';

export function OnboardingShell({
  eyebrow,
  title,
  description,
  currentStep,
  totalSteps,
  children,
  actions,
  className
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mx-auto flex min-h-screen w-full max-w-xl flex-col bg-background', className)}>
      <div className="flex-1 px-4 pb-8 pt-5 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-primary text-base font-black text-primary-foreground shadow-soft">
              Y
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
              <p className="text-sm font-bold text-foreground">Yavaa</p>
            </div>
          </div>
        </div>

        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <div className="mt-7 space-y-3">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-normal text-foreground">{title}</h1>
          {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>

        <div className="mt-7">{children}</div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto grid max-w-xl gap-3">{actions}</div>
      </div>
    </section>
  );
}
