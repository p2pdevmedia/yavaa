'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

type WorkerReadyActionProps = {
  offerId: string;
};

type ReadyActionResponse =
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
      fieldErrors?: Record<string, string[]>;
    };

export function WorkerReadyAction({ offerId }: WorkerReadyActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusId = `worker-ready-${offerId}-status`;
  const errorId = `worker-ready-${offerId}-error`;

  async function handleMarkReady() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/job-offers/${offerId}/ready`, {
        method: 'POST'
      });
      const responseBody = (await response.json()) as ReadyActionResponse;

      if (!response.ok || !responseBody.ok) {
        setError(!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos marcar el trabajo como listo.');
        return;
      }

      setStatusMessage('Trabajo marcado como listo.');
      router.refresh();
    } catch {
      setError('No pudimos conectar con Yavaa. Probá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      aria-busy={isSubmitting}
      aria-describedby={error ? errorId : statusId}
      className="space-y-3 rounded-[22px] border border-border bg-card p-4 shadow-soft"
    >
      <div className="space-y-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Entrega</p>
        <h2 className="text-xl font-bold text-foreground">Listo para revisión</h2>
      </div>

      <Button type="button" className="w-full" disabled={isSubmitting} onClick={() => void handleMarkReady()}>
        {isSubmitting ? 'Marcando...' : 'Marcar trabajo listo'}
      </Button>

      {statusMessage ? (
        <p id={statusId} role="status" aria-live="polite" className="text-sm font-semibold text-foreground">
          {statusMessage}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
