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
  bio: string | null;
  hourlyRateCents: number | null;
  identityVerificationStatus: string;
  distanceLabel: string;
  rating: {
    average: number | null;
    count: number;
  };
  workHistory: Array<{
    id: string;
    title: string;
    completedAtLabel: string;
  }>;
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

function formatRating(worker: WorkerResult): string {
  if (worker.rating.average === null || worker.rating.count === 0) {
    return 'Sin calificaciones todavía';
  }

  return `${worker.rating.average.toFixed(1)} (${worker.rating.count})`;
}

function getStarState(worker: WorkerResult, star: number): string {
  if (worker.rating.average === null) {
    return '☆';
  }

  return worker.rating.average >= star ? '★' : '☆';
}

export function WorkerSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [workers, setWorkers] = useState<WorkerResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

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
          setSelectedWorkerId((currentWorkerId) =>
            responseBody.workers.some((worker) => worker.id === currentWorkerId) ? currentWorkerId : null
          );
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
                <button
                  type="button"
                  className="text-left text-xl font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={selectedWorkerId === worker.id}
                  aria-controls={`worker-profile-${worker.id}`}
                  onClick={() => setSelectedWorkerId((currentWorkerId) => (currentWorkerId === worker.id ? null : worker.id))}
                >
                  {worker.displayName}
                </button>
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
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              aria-expanded={selectedWorkerId === worker.id}
              aria-controls={`worker-profile-${worker.id}`}
              onClick={() => setSelectedWorkerId((currentWorkerId) => (currentWorkerId === worker.id ? null : worker.id))}
            >
              Ver perfil público
            </Button>
            {selectedWorkerId === worker.id ? (
              <div id={`worker-profile-${worker.id}`} className="mt-4 space-y-4 border-t border-border pt-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Perfil público</p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">{worker.displayName}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {worker.bio ?? 'Este trabajador todavía no cargó una presentación pública.'}
                  </p>
                </div>

                <div className="rounded-[18px] bg-secondary/50 p-4">
                  <p className="text-sm font-bold text-foreground">Estrellas</p>
                  <div className="mt-2 flex items-center gap-2" aria-label={formatRating(worker)}>
                    <span className="text-lg font-bold text-primary" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((star) => getStarState(worker, star)).join(' ')}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">{formatRating(worker)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground">Historial de trabajos</p>
                  {worker.workHistory.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {worker.workHistory.map((work) => (
                        <li key={work.id} className="rounded-[18px] border border-border px-3 py-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{work.title}</span>
                          <span className="block">{work.completedAtLabel}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 rounded-[18px] border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                      Todavía no hay trabajos finalizados para mostrar.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
