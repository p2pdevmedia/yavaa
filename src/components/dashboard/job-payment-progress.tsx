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
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

export function JobPaymentProgress({ acceptedOffer }: { acceptedOffer: JobPostSummary['acceptedOffer'] }) {
  const progress = getPaymentProgress(acceptedOffer);

  if (!progress) {
    return null;
  }

  return (
    <p
      className="text-sm font-extrabold text-slate-700"
      aria-label={`Presupuesto ${formatAmountCents(progress.budgetCents)} menos pagado ${formatAmountCents(
        progress.paidCents
      )} igual falta pagar ${formatAmountCents(progress.remainingCents)}`}
    >
      Presupuesto{' '}
      <span className="font-black text-green-700">{formatAmountCents(progress.budgetCents)}</span>
      <span className="mx-1 text-slate-500">-</span>
      <span className="font-black text-yellow-700">{formatAmountCents(progress.paidCents)}</span>
      <span className="mx-1 text-slate-500">=</span>
      <span className="font-black text-red-700">{formatAmountCents(progress.remainingCents)}</span>
    </p>
  );
}
