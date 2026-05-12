import { cn } from '@/lib/utils';

export function ProgressBar({
  currentStep,
  totalSteps,
  className
}: {
  currentStep: number;
  totalSteps: number;
  className?: string;
}) {
  const safeTotal = Math.max(totalSteps, 1);
  const safeCurrent = Math.min(Math.max(currentStep, 1), safeTotal);
  const percentage = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span>
          Paso {safeCurrent} de {safeTotal}
        </span>
        <span>{percentage}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--yavaa-violet-soft)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
