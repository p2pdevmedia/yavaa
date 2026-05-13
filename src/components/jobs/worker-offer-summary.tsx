import { JobOfferStatus, type JobOfferStatus as JobOfferStatusValue } from '@prisma/client';

function formatAmountCents(amountCents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function formatOfferStatus(status: JobOfferStatusValue): string {
  const labels: Record<JobOfferStatusValue, string> = {
    [JobOfferStatus.PENDING]: 'Pendiente',
    [JobOfferStatus.ACCEPTED]: 'Aceptada',
    [JobOfferStatus.REJECTED]: 'Rechazada'
  };

  return labels[status];
}

export function WorkerOfferSummary({
  amountCents,
  status
}: {
  amountCents: number;
  status: JobOfferStatusValue;
}) {
  return (
    <article className="space-y-3 rounded-[28px] border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Tu oferta</p>
          <p className="text-3xl font-black text-foreground">{formatAmountCents(amountCents)}</p>
        </div>
        <span className="w-fit rounded-full bg-background px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
          {formatOfferStatus(status)}
        </span>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Este es el monto acordado para este trabajo. Los mensajes y pagos quedan asociados a esta oferta.
      </p>
    </article>
  );
}
