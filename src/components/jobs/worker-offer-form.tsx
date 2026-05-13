'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type WorkerOfferJobPost = {
  id: string;
  title: string;
};

type WorkerOfferFormState = {
  amountPesos: string;
  message: string;
};

type WorkerOfferSummary = {
  id: string;
  jobPostId: string;
  workerId: string;
  amountCents: number;
  status: string;
};

type WorkerOfferResponse =
  | {
      ok: true;
      offer: WorkerOfferSummary;
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<keyof WorkerOfferFormState | 'jobPostId', string[]>>;
    };

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

function formatPesosFromCents(amountCents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

export function WorkerOfferForm({ jobPost }: { jobPost: WorkerOfferJobPost }) {
  const amountPesosErrorId = 'worker-offer-amountPesos-error';
  const messageErrorId = 'worker-offer-message-error';
  const jobPostErrorId = 'worker-offer-jobPost-error';
  const formErrorId = 'worker-offer-form-error';
  const [formState, setFormState] = useState<WorkerOfferFormState>({
    amountPesos: '',
    message: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof WorkerOfferFormState | 'jobPostId' | 'form', string[]>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentOffer, setSentOffer] = useState<WorkerOfferSummary | null>(null);

  const payload = useMemo(
    () => ({
      jobPostId: jobPost.id,
      amountPesos: formState.amountPesos,
      ...(formState.message.trim() ? { message: formState.message } : {})
    }),
    [formState.amountPesos, formState.message, jobPost.id]
  );

  function updateField(field: keyof WorkerOfferFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined
    }));
    setSentOffer(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch('/api/job-offers', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const responseBody = (await response.json()) as WorkerOfferResponse;

      if (!response.ok || !responseBody.ok) {
        setFieldErrors(
          !responseBody.ok && responseBody.fieldErrors
            ? responseBody.fieldErrors
            : {
                form: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos enviar la oferta.']
              }
        );
        return;
      }

      setSentOffer(responseBody.offer);
    } catch {
      setFieldErrors({
        form: ['No pudimos conectar con Yavaa. Probá de nuevo.']
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const formErrorDescriptionIds = [
    fieldErrors.jobPostId?.length ? jobPostErrorId : null,
    fieldErrors.form?.length ? formErrorId : null
  ]
    .filter((id): id is string => Boolean(id))
    .join(' ');

  return (
    <form
      onSubmit={handleSubmit}
      aria-describedby={formErrorDescriptionIds || undefined}
      className="space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-soft"
    >
      <div className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Tu oferta</p>
        <h2 className="font-display text-2xl font-bold tracking-normal text-foreground">{jobPost.title}</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountPesos">Monto en pesos</Label>
        <Input
          id="amountPesos"
          name="amountPesos"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          placeholder="12500"
          value={formState.amountPesos}
          aria-invalid={Boolean(fieldErrors.amountPesos?.length)}
          aria-describedby={fieldErrors.amountPesos?.length ? amountPesosErrorId : undefined}
          onChange={(event) => updateField('amountPesos', event.target.value)}
        />
        <FieldError id={amountPesosErrorId} messages={fieldErrors.amountPesos} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensaje opcional</Label>
        <textarea
          id="message"
          name="message"
          className="min-h-28 w-full rounded-[18px] border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Contale al cliente cuándo podrías hacerlo."
          value={formState.message}
          aria-invalid={Boolean(fieldErrors.message?.length)}
          aria-describedby={fieldErrors.message?.length ? messageErrorId : undefined}
          onChange={(event) => updateField('message', event.target.value)}
        />
        <FieldError id={messageErrorId} messages={fieldErrors.message} />
      </div>

      <FieldError id={jobPostErrorId} messages={fieldErrors.jobPostId} />
      <FieldError id={formErrorId} messages={fieldErrors.form} />

      {sentOffer ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-[18px] bg-[var(--yavaa-green-soft)] px-4 py-3 text-sm font-bold text-foreground"
        >
          Oferta enviada/actualizada por {formatPesosFromCents(sentOffer.amountCents)}.
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Enviando...' : 'Enviar oferta'}
      </Button>
    </form>
  );
}
