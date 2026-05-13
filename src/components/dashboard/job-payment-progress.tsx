import type { JobPostSummary } from '@/lib/job-posts';

type AcceptedOfferPaymentProgress = NonNullable<JobPostSummary['acceptedOffer']>;

export function getPaymentProgress(acceptedOffer: AcceptedOfferPaymentProgress | null | undefined) {
  if (!acceptedOffer) {
    return null;
  }

  const paidCents = acceptedOffer.payments.reduce((total, payment) => total + payment.amountCents, 0);

  return {
    budgetCents: acceptedOffer.amountCents,
    paidCents,
    remainingCents: Math.max(acceptedOffer.amountCents - paidCents, 0)
  };
}

function formatAmountCents(amountCents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

export function JobPaymentProgress({ acceptedOffer }: { acceptedOffer: JobPostSummary['acceptedOffer'] }) {
  const progress = getPaymentProgress(acceptedOffer);

  if (!progress) {
    return null;
  }

  return (
    <div className="grid gap-2 text-sm sm:grid-cols-3" aria-label="Resumen de pagos del trabajo">
      <div className="rounded-xl bg-green-50 px-3 py-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-green-700">Presupuesto</p>
        <p className="mt-1 font-black text-green-700">{formatAmountCents(progress.budgetCents)}</p>
      </div>
      <div className="rounded-xl bg-yellow-50 px-3 py-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-yellow-700">Pagado</p>
        <p className="mt-1 font-black text-yellow-700">{formatAmountCents(progress.paidCents)}</p>
      </div>
      <div className="rounded-xl bg-red-50 px-3 py-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-red-700">Falta pagar</p>
        <p className="mt-1 font-black text-red-700">{formatAmountCents(progress.remainingCents)}</p>
      </div>
    </div>
  );
}
