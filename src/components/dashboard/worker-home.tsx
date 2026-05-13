import { IdentityVerificationStatus, JobPostStatus } from '@prisma/client';
import Link from 'next/link';
import type { Route } from 'next';

import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { JobPaymentProgress } from '@/components/dashboard/job-payment-progress';
import type { AppUserProfile } from '@/lib/app-user';
import { formatJobPostPersonName, type JobPostSummary } from '@/lib/job-posts';
import { workerCategoryLabels, type WorkerCategorySlug, workerCategorySlugs } from '@/lib/onboarding';
import { getPrivateProfileAvatarSrc } from '@/lib/profile-avatar';

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

function getJobStatusLabel(status: JobPostStatus): string {
  const labels: Record<JobPostStatus, string> = {
    [JobPostStatus.DRAFT]: 'Borrador',
    [JobPostStatus.PUBLISHED]: 'Publicado',
    [JobPostStatus.IN_PROGRESS]: 'En curso',
    [JobPostStatus.READY_FOR_REVIEW]: 'Listo para revisión',
    [JobPostStatus.CLOSED]: 'Terminado',
    [JobPostStatus.CANCELLED]: 'Cancelado'
  };

  return labels[status];
}

function WorkerJobPostList({
  emptyCopy,
  jobPosts,
  showDescription = false,
  showStatus = false
}: {
  emptyCopy: string;
  jobPosts: JobPostSummary[];
  showDescription?: boolean;
  showStatus?: boolean;
}) {
  if (jobPosts.length === 0) {
    return <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyCopy}</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      {jobPosts.map((jobPost) => (
        <div
          key={jobPost.id}
          className="group relative space-y-3 rounded-[18px] border border-border bg-background px-4 py-3 transition hover:border-primary hover:bg-card focus-within:border-primary"
        >
          <Link
            href={`/dashboard/trabajador/trabajos/${jobPost.id}` as Route}
            aria-label={`Abrir trabajo ${jobPost.title}`}
            className="absolute inset-0 z-10 rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <div className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-base font-bold text-foreground">{jobPost.title}</h2>
              {showStatus ? (
                <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                  {getJobStatusLabel(jobPost.status)}
                </span>
              ) : null}
            </div>
            {showDescription ? <p className="text-sm leading-6 text-muted-foreground">{jobPost.description}</p> : null}
            <p className="text-sm font-semibold text-muted-foreground">
              Jefe: {formatJobPostPersonName(jobPost.client, 'Sin asignar')}
            </p>
          </div>
          <JobPaymentProgress acceptedOffer={jobPost.acceptedOffer} />
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
  );
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
  jobPosts = [],
  acceptedJobPosts = []
}: {
  profile: AppUserProfile | null;
  jobPosts?: JobPostSummary[];
  acceptedJobPosts?: JobPostSummary[];
}) {
  const verification = getVerificationCopy(
    profile?.identityVerificationStatus ?? IdentityVerificationStatus.NOT_STARTED
  );
  const categories = (profile?.workerCategories ?? []).filter(isWorkerCategorySlug);
  const firstName = profile?.firstName ?? 'Tu perfil';
  const avatarSrc = profile?.avatarUrl ? getPrivateProfileAvatarSrc(profile.avatarUrl) : null;
  const activeJobPosts = acceptedJobPosts.filter(
    (jobPost) => jobPost.status === JobPostStatus.IN_PROGRESS || jobPost.status === JobPostStatus.READY_FOR_REVIEW
  );
  const finishedJobPosts = acceptedJobPosts.filter((jobPost) => jobPost.status === JobPostStatus.CLOSED);

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-1">
          {avatarSrc ? (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt={`Foto de perfil de ${firstName}`} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Trabajador home</p>
            <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Hola, {firstName}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Elegí un trabajo cercano y avanzá con tu próxima oportunidad sin vueltas.
            </p>
          </div>
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
            <WorkerJobPostList emptyCopy="" jobPosts={jobPosts} showDescription />
          ) : (
            <>
              <h2 className="mt-3 text-xl font-bold text-foreground">No hay trabajos cercanos todavía</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                En la etapa de marketplace vamos a mostrar oportunidades compatibles con tu zona y rubros.
              </p>
            </>
          )}
        </article>

        <section className="space-y-4">
          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos en curso</p>
            <WorkerJobPostList
              emptyCopy="No tenés trabajos en curso todavía."
              jobPosts={activeJobPosts}
              showStatus
            />
          </article>

          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos terminados</p>
            <WorkerJobPostList
              emptyCopy="Los trabajos terminados van a aparecer acá."
              jobPosts={finishedJobPosts}
              showStatus
            />
          </article>
        </section>
      </section>
    </YavaaPageShell>
  );
}
