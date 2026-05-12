export function MobileMapPreview({ address }: { address?: string }) {
  return (
    <div className="relative min-h-44 overflow-hidden rounded-[24px] border border-border bg-[var(--yavaa-violet-soft)] p-4">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-[-12%] top-8 h-px w-[130%] rotate-12 bg-white" />
        <div className="absolute left-[-8%] top-24 h-px w-[130%] -rotate-6 bg-white" />
        <div className="absolute left-8 top-[-20%] h-[150%] w-px rotate-6 bg-white" />
        <div className="absolute right-16 top-[-20%] h-[150%] w-px -rotate-12 bg-white" />
      </div>
      <div className="relative flex min-h-36 items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-black text-primary-foreground shadow-soft">
          Y
        </div>
      </div>
      <div className="relative rounded-[18px] bg-card px-4 py-3 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Zona de trabajo</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{address?.trim() || 'Salta Capital'}</p>
      </div>
    </div>
  );
}
