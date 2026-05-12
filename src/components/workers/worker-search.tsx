'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  workerCategoryLabels,
  workerCategorySlugs,
  type WorkerCategorySlug
} from '@/lib/onboarding';

type WorkerResult = {
  id: string;
  displayName: string;
  categories: string[];
  hourlyRateCents: number | null;
  identityVerificationStatus: string;
  distanceLabel: string;
};

type WorkerSearchResponse =
  | {
      ok: true;
      workers: WorkerResult[];
    }
  | {
      ok: false;
      message?: string;
    };

const verificationStatusLabels: Record<string, string> = {
  VERIFIED: 'Verificación aprobada',
  PENDING: 'Verificación en revisión',
  REJECTED: 'Verificación pendiente',
  NOT_STARTED: 'Verificación pendiente'
};

function formatMoney(cents: number | null): string {
  if (!cents) {
    return 'A convenir';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function WorkerSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [workers, setWorkers] = useState<WorkerResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const searchUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set('q', query.trim());
    }

    if (category) {
      params.set('category', category);
    }

    return `/api/workers/search?${params.toString()}`;
  }, [category, query]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(searchUrl);
        const responseBody = (await response.json()) as WorkerSearchResponse;

        if (!response.ok || !responseBody.ok) {
          if (!cancelled) {
            setWorkers([]);
            setError(!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos buscar trabajadores.');
          }
          return;
        }

        if (!cancelled) {
          setWorkers(responseBody.workers);
        }
      } catch {
        if (!cancelled) {
          setWorkers([]);
          setError('No pudimos conectar con Yavaa.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkers();

    return () => {
      cancelled = true;
    };
  }, [searchUrl]);

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="worker-search" className="text-sm font-bold text-foreground">
          Buscar trabajadores
        </label>
        <Input
          id="worker-search"
          name="worker-search"
          placeholder="Nombre, zona o rubro"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button type="button" variant={!category ? 'default' : 'outline'} onClick={() => setCategory('')}>
          Todos
        </Button>
        {workerCategorySlugs.map((categorySlug) => (
          <Button
            key={categorySlug}
            type="button"
            variant={category === categorySlug ? 'default' : 'outline'}
            onClick={() => setCategory(categorySlug)}
          >
            {workerCategoryLabels[categorySlug as WorkerCategorySlug]}
          </Button>
        ))}
      </div>

      {error ? <p className="rounded-[18px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p> : null}

      {isLoading ? <p className="text-sm font-semibold text-muted-foreground">Buscando...</p> : null}

      {!isLoading && workers.length === 0 && !error ? (
        <article className="rounded-[24px] border border-dashed border-border bg-card p-5">
          <h2 className="text-xl font-bold text-foreground">Sin trabajadores para este filtro</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Probá con otra categoría o una búsqueda más amplia.</p>
        </article>
      ) : null}

      <div className="space-y-3">
        {workers.map((worker) => (
          <article key={worker.id} className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{worker.displayName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {worker.categories
                    .map((workerCategory) => workerCategoryLabels[workerCategory as WorkerCategorySlug] ?? workerCategory)
                    .join(', ')}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                {worker.distanceLabel}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Precio por hora</dt>
                <dd className="font-bold text-foreground">{formatMoney(worker.hourlyRateCents)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Verificación</dt>
                <dd className="font-bold text-foreground">
                  {verificationStatusLabels[worker.identityVerificationStatus] ?? 'Verificación pendiente'}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
