'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type JobPaymentListItem = {
  id: string;
  offerId: string;
  createdById: string;
  amountCents: number;
  paidAt: Date | string;
  description: string;
  receiptPathname: string | null;
  createdAt: Date | string;
};

type JobPaymentFormProps = {
  offerId: string;
  initialPayments: JobPaymentListItem[];
  authorLabels?: Record<string, string>;
};

type PaymentField = 'amountPesos' | 'paidAt' | 'description' | 'receiptPathname' | 'form';

type PaymentResponse =
  | {
      ok: true;
      payment: JobPaymentListItem;
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<PaymentField, string[]>>;
    };

type ReceiptUploadResponse =
  | {
      ok: true;
      pathname: string;
    }
  | {
      ok: false;
      message?: string;
    };

function toDatetimeLocalValue(value: Date): string {
  const offsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatAmountCents(amountCents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function formatPaymentDate(value: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function serializePaidAtForPayload(value: string): string {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toISOString();
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="text-sm font-semibold text-destructive">
      {messages[0]}
    </p>
  );
}

function hasFieldErrorMessages(fieldErrors: Partial<Record<PaymentField, string[]>>): boolean {
  return Object.values(fieldErrors).some((messages) => Boolean(messages?.length));
}

export function JobPaymentForm({ offerId, initialPayments, authorLabels = {} }: JobPaymentFormProps) {
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [payments, setPayments] = useState<JobPaymentListItem[]>(initialPayments);
  const [amountPesos, setAmountPesos] = useState('');
  const [paidAt, setPaidAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PaymentField, string[]>>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountErrorId = `job-payment-${offerId}-amount-error`;
  const paidAtErrorId = `job-payment-${offerId}-paid-at-error`;
  const descriptionErrorId = `job-payment-${offerId}-description-error`;
  const receiptErrorId = `job-payment-${offerId}-receipt-error`;
  const formErrorId = `job-payment-${offerId}-form-error`;
  const statusId = `job-payment-${offerId}-status`;

  const orderedPayments = useMemo(
    () =>
      [...payments].sort(
        (left, right) => new Date(right.paidAt).getTime() - new Date(left.paidAt).getTime()
      ),
    [payments]
  );

  function getAuthorLabel(createdById: string): string {
    return authorLabels[createdById] ?? createdById;
  }

  function resetFeedback() {
    setFieldErrors({});
    setStatusMessage(null);
  }

  async function uploadReceipt(): Promise<string | null> {
    if (!receiptFile) {
      return null;
    }

    const formData = new FormData();
    formData.set('file', receiptFile);

    const response = await fetch(`/api/job-offers/${offerId}/payments/receipts`, {
      method: 'POST',
      body: formData
    });
    const responseBody = (await response.json()) as ReceiptUploadResponse;

    if (!response.ok || !responseBody.ok) {
      throw new Error(!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos subir el comprobante.');
    }

    return responseBody.pathname;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    resetFeedback();

    try {
      const receiptPathname = await uploadReceipt();
      const response = await fetch(`/api/job-offers/${offerId}/payments`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          amountPesos,
          paidAt: serializePaidAtForPayload(paidAt),
          description,
          receiptPathname
        })
      });
      const responseBody = (await response.json()) as PaymentResponse;

      if (!response.ok || !responseBody.ok) {
        const responseFieldErrors = !responseBody.ok ? responseBody.fieldErrors : undefined;

        setFieldErrors(
          responseFieldErrors && hasFieldErrorMessages(responseFieldErrors)
            ? responseFieldErrors
            : {
                form: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos registrar el pago.']
              }
        );
        return;
      }

      setPayments((current) => [responseBody.payment, ...current]);
      setAmountPesos('');
      setDescription('');
      setReceiptFile(null);
      if (receiptInputRef.current) {
        receiptInputRef.current.value = '';
      }
      setStatusMessage('Pago registrado.');
    } catch (error) {
      setFieldErrors({
        form: [error instanceof Error ? error.message : 'No pudimos conectar con Yavaa. Probá de nuevo.']
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="space-y-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Pagos internos</p>
      </div>

      <div className="space-y-3 rounded-[18px] border border-border bg-card p-3">
        {orderedPayments.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">Todavía no hay pagos registrados.</p>
        ) : (
          orderedPayments.map((payment) => (
            <article key={payment.id} className="space-y-1 rounded-[16px] bg-background px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-extrabold text-foreground">{formatAmountCents(payment.amountCents)}</p>
                <time dateTime={new Date(payment.paidAt).toISOString()} className="text-xs font-bold text-muted-foreground">
                  {formatPaymentDate(payment.paidAt)}
                </time>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{payment.description}</p>
              <p className="text-xs font-bold text-muted-foreground">Registrado por {getAuthorLabel(payment.createdById)}</p>
              {payment.receiptPathname ? (
                <p className="break-all text-xs font-semibold text-primary">Comprobante: {payment.receiptPathname}</p>
              ) : null}
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        aria-describedby={fieldErrors.form?.length ? formErrorId : statusId}
        className="space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`job-payment-${offerId}-amount`}>Monto</Label>
            <Input
              id={`job-payment-${offerId}-amount`}
              name="amountPesos"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={amountPesos}
              aria-invalid={Boolean(fieldErrors.amountPesos?.length)}
              aria-describedby={fieldErrors.amountPesos?.length ? amountErrorId : undefined}
              onChange={(event) => {
                setAmountPesos(event.target.value);
                resetFeedback();
              }}
            />
            <FieldError id={amountErrorId} messages={fieldErrors.amountPesos} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`job-payment-${offerId}-paid-at`}>Fecha de pago</Label>
            <Input
              id={`job-payment-${offerId}-paid-at`}
              name="paidAt"
              type="datetime-local"
              value={paidAt}
              aria-invalid={Boolean(fieldErrors.paidAt?.length)}
              aria-describedby={fieldErrors.paidAt?.length ? paidAtErrorId : undefined}
              onChange={(event) => {
                setPaidAt(event.target.value);
                resetFeedback();
              }}
            />
            <FieldError id={paidAtErrorId} messages={fieldErrors.paidAt} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`job-payment-${offerId}-description`}>Descripción</Label>
          <textarea
            id={`job-payment-${offerId}-description`}
            name="description"
            className="min-h-24 w-full rounded-[18px] border border-input bg-card px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={description}
            aria-invalid={Boolean(fieldErrors.description?.length)}
            aria-describedby={fieldErrors.description?.length ? descriptionErrorId : undefined}
            onChange={(event) => {
              setDescription(event.target.value);
              resetFeedback();
            }}
          />
          <FieldError id={descriptionErrorId} messages={fieldErrors.description} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`job-payment-${offerId}-receipt`}>Comprobante opcional</Label>
          <Input
            ref={receiptInputRef}
            id={`job-payment-${offerId}-receipt`}
            name="receipt"
            type="file"
            accept="image/*,application/pdf"
            aria-invalid={Boolean(fieldErrors.receiptPathname?.length)}
            aria-describedby={fieldErrors.receiptPathname?.length ? receiptErrorId : undefined}
            onChange={(event) => {
              setReceiptFile(event.target.files?.[0] ?? null);
              resetFeedback();
            }}
          />
          <FieldError id={receiptErrorId} messages={fieldErrors.receiptPathname} />
        </div>

        <FieldError id={formErrorId} messages={fieldErrors.form} />

        {isSubmitting || statusMessage ? (
          <p id={statusId} role="status" aria-live="polite" className="text-sm font-semibold text-foreground">
            {isSubmitting ? 'Registrando pago...' : statusMessage}
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Registrar pago'}
        </Button>
      </form>
    </div>
  );
}
