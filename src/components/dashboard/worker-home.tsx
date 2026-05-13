import { IdentityVerificationStatus } from '@prisma/client';

import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import type { AppUserProfile } from '@/lib/app-user';
import type { JobPostSummary } from '@/lib/job-posts';
import { workerCategoryLabels, type WorkerCategorySlug, workerCategorySlugs } from '@/lib/onboarding';

function isWorkerCategorySlug(value: string): value is WorkerCategorySlug {
  return (workerCategorySlugs as ReadonlyArray<string>).includes(value);
}

function formatHourlyRate(cents: number | null): string {
  if (!cents) {
    return 'Sin precio';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function formatDesiredTime(value: Date | null): string {
  if (!value) {
    return 'Horario a coordinar';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function formatJobCategory(category: string): string {
  return isWorkerCategorySlug(category) ? workerCategoryLabels[category] : category;
}

function getVerificationCopy(status: IdentityVerificationStatus): {
  title: string;
  description: string;
} {
  if (status === IdentityVerificationStatus.VERIFIED) {
    return {
      title: 'Verificación aprobada',
      description: 'Tu identidad ya está validada para recibir más confianza de clientes.'
    };
  }

  if (status === IdentityVerificationStatus.REJECTED) {
    return {
      title: 'Verificación pendiente de corrección',
      description: 'Vamos a pedirte revisar tus datos cuando activemos la carga real de documentos.'
    };
  }

  return {
    title: 'Verificación en revisión',
    description: 'Tu perfil ya puede avanzar mientras Yavaa revisa tus datos de identidad.'
  };
}

export function WorkerHome({
  profile,
  jobPosts = []
}: {
  profile: AppUserProfile | null;
  jobPosts?: JobPostSummary[];
}) {
  const verification = getVerificationCopy(
    profile?.identityVerificationStatus ?? IdentityVerificationStatus.NOT_STARTED
  );
  const categories = (profile?.workerCategories ?? []).filter(isWorkerCategorySlug);
  const firstName = profile?.firstName ?? 'Tu perfil';

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-6">
        <div className="rounded-[28px] bg-primary p-6 text-primary-foreground shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-80">Trabajador home</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-normal">Tu perfil laboral</h1>
          <p className="mt-3 text-sm leading-6 opacity-90">{firstName} ya tiene su perfil preparado para trabajar.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Verificación</p>
            <h2 className="mt-3 text-xl font-bold text-foreground">{verification.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{verification.description}</p>
          </article>

          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Precio por hora</p>
            <p className="mt-3 font-display text-3xl font-bold text-foreground">
              {formatHourlyRate(profile?.workerHourlyRateCents ?? null)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Precio base editable para próximos trabajos.</p>
          </article>
        </div>

        <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Rubros</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.length > 0 ? (
              categories.map((category) => (
                <span key={category} className="rounded-full bg-[var(--yavaa-violet-soft)] px-4 py-2 text-sm font-bold text-primary">
                  {workerCategoryLabels[category]}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no elegiste rubros.</p>
            )}
          </div>
        </article>

        <article className="rounded-[24px] border border-dashed border-border bg-card p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos cercanos</p>
          {jobPosts.length > 0 ? (
            <div className="mt-3 space-y-3">
              {jobPosts.map((jobPost) => (
                <div key={jobPost.id} className="space-y-3 rounded-[18px] border border-border bg-background px-4 py-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-foreground">{jobPost.title}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">{jobPost.description}</p>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">Rubro</p>
                      <p className="mt-1 font-bold text-foreground">{formatJobCategory(jobPost.category)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">Zona</p>
                      <p className="mt-1 font-bold text-foreground">{jobPost.addressText}</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">Cuándo</p>
                      <p className="mt-1 font-bold text-foreground">{formatDesiredTime(jobPost.desiredTime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <h2 className="mt-3 text-xl font-bold text-foreground">No hay trabajos cercanos todavía</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                En la etapa de marketplace vamos a mostrar oportunidades compatibles con tu zona y rubros.
              </p>
            </>
          )}
        </article>
      </section>
    </YavaaPageShell>
  );
}
