'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

type OfferAction = 'accept' | 'reject';

type ClientOfferActionsProps = {
  offerId: string;
  acceptLabel?: string;
  rejectLabel?: string;
};

type OfferActionResponse =
  | {
      ok: true;
      offer: {
        id: string;
        status: string;
      };
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Record<string, string[]>;
    };

export function ClientOfferActions({
  offerId,
  acceptLabel = 'Aceptar oferta',
  rejectLabel = 'Rechazar'
}: ClientOfferActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<OfferAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitAction(action: OfferAction) {
    if (pendingAction) {
      return;
    }

    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/job-offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      const responseBody = (await response.json()) as OfferActionResponse;

      if (!response.ok || !responseBody.ok) {
        setError(!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos actualizar la oferta.');
        return;
      }

      setMessage(action === 'accept' ? 'Oferta aceptada.' : 'Oferta rechazada.');
      router.refresh();
    } catch {
      setError('No pudimos conectar con Yavaa. Probá de nuevo.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" disabled={Boolean(pendingAction)} onClick={() => void submitAction('accept')}>
          {pendingAction === 'accept' ? 'Aceptando...' : acceptLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(pendingAction)}
          onClick={() => void submitAction('reject')}
        >
          {pendingAction === 'reject' ? 'Rechazando...' : rejectLabel}
        </Button>
      </div>

      {message ? (
        <p role="status" aria-live="polite" className="text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
