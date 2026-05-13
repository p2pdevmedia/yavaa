'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ReviewAction = 'close' | 'needs_changes';

type ClientReviewActionsProps = {
  offerId: string;
};

type ReviewField = 'action' | 'message' | 'form';

type ReviewActionResponse =
  | {
      ok: true;
      jobPost: {
        id: string;
        status: string;
      };
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<ReviewField, string[]>>;
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

export function ClientReviewActions({ offerId }: ClientReviewActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ReviewField, string[]>>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const messageErrorId = `client-review-${offerId}-message-error`;
  const formErrorId = `client-review-${offerId}-form-error`;
  const statusId = `client-review-${offerId}-status`;
  const formDescriptionId = fieldErrors.form?.length || fieldErrors.action?.length ? formErrorId : statusId;

  function resetFeedback() {
    setFieldErrors({});
    setStatusMessage(null);
  }

  async function submitReview(action: ReviewAction) {
    if (pendingAction) {
      return;
    }

    setPendingAction(action);
    resetFeedback();

    try {
      const response = await fetch(`/api/job-offers/${offerId}/review`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(action === 'close' ? { action } : { action, message })
      });
      const responseBody = (await response.json()) as ReviewActionResponse;

      if (!response.ok || !responseBody.ok) {
        setFieldErrors(
          !responseBody.ok && responseBody.fieldErrors
            ? responseBody.fieldErrors
            : {
                form: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos revisar el trabajo.']
              }
        );
        return;
      }

      setStatusMessage(action === 'close' ? 'Trabajo aceptado.' : 'Pedido de cambios enviado.');
      setMessage('');
      router.refresh();
    } catch {
      setFieldErrors({
        form: ['No pudimos conectar con Yavaa. Probá de nuevo.']
      });
    } finally {
      setPendingAction(null);
    }
  }

  function handleNeedsChangesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitReview('needs_changes');
  }

  return (
    <div
      aria-busy={Boolean(pendingAction)}
      aria-describedby={formDescriptionId}
      className="space-y-4 border-t border-border pt-4"
    >
      <div className="space-y-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Revisión del trabajo</p>
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={Boolean(pendingAction)}
        onClick={() => void submitReview('close')}
      >
        {pendingAction === 'close' ? 'Aceptando...' : 'Aceptar trabajo'}
      </Button>

      <form onSubmit={handleNeedsChangesSubmit} className="space-y-2">
        <Label htmlFor={`client-review-${offerId}-message`}>Falta algo</Label>
        <textarea
          id={`client-review-${offerId}-message`}
          name="message"
          className="min-h-24 w-full rounded-[18px] border border-input bg-card px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={message}
          aria-invalid={Boolean(fieldErrors.message?.length)}
          aria-describedby={fieldErrors.message?.length ? messageErrorId : undefined}
          onChange={(event) => {
            setMessage(event.target.value);
            resetFeedback();
          }}
        />
        <FieldError id={messageErrorId} messages={fieldErrors.message} />
        <FieldError id={formErrorId} messages={fieldErrors.form ?? fieldErrors.action} />

        {pendingAction || statusMessage ? (
          <p id={statusId} role="status" aria-live="polite" className="text-sm font-semibold text-foreground">
            {pendingAction === 'needs_changes'
              ? 'Enviando pedido...'
              : pendingAction === 'close'
                ? 'Aceptando trabajo...'
                : statusMessage}
          </p>
        ) : null}

        <Button type="submit" variant="outline" size="sm" disabled={Boolean(pendingAction)}>
          {pendingAction === 'needs_changes' ? 'Enviando...' : 'Enviar pedido de cambios'}
        </Button>
      </form>
    </div>
  );
}
