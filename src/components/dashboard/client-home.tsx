import Link from 'next/link';
import type { Route } from 'next';
import { JobPostStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { JobPaymentProgress } from '@/components/dashboard/job-payment-progress';
import type { AppUserProfile } from '@/lib/app-user';
import type { ClientAcceptedWorker } from '@/lib/client-workers';
import { formatJobPostPersonName, type JobPostSummary } from '@/lib/job-posts';
import { getPrivateProfileAvatarSrc } from '@/lib/profile-avatar';

function getJobStatusLabel(status: JobPostStatus): string {
  const labels: Record<JobPostStatus, string> = {
    [JobPostStatus.DRAFT]: 'Borrador',
    [JobPostStatus.PUBLISHED]: 'Publicado',
    [JobPostStatus.IN_PROGRESS]: 'En progreso',
    [JobPostStatus.READY_FOR_REVIEW]: 'Listo para revisión',
    [JobPostStatus.CLOSED]: 'Terminado',
    [JobPostStatus.CANCELLED]: 'Cancelado'
  };

  return labels[status];
}

function JobPostList({
  emptyCopy,
  jobPosts,
  showEdit = false
}: {
  emptyCopy: string;
  jobPosts: JobPostSummary[];
  showEdit?: boolean;
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
            href={`/dashboard/jefe/trabajos/${jobPost.id}` as Route}
            aria-label={`Abrir trabajo ${jobPost.title}`}
            className="absolute inset-0 z-10 rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <div className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-base font-bold text-foreground">{jobPost.title}</h2>
              <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                {getJobStatusLabel(jobPost.status)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{jobPost.addressText}</p>
            {jobPost.acceptedOffer ? (
              <p className="text-sm font-semibold text-muted-foreground">
                Trabajador: {formatJobPostPersonName(jobPost.acceptedOffer?.worker, 'Sin asignar')}
              </p>
            ) : null}
          </div>
          <JobPaymentProgress acceptedOffer={jobPost.acceptedOffer} />
          {showEdit ? (
            <div className="relative z-20 grid gap-2">
              <Button asChild size="sm">
                <Link href={`/dashboard/jefe/trabajos/${jobPost.id}/editar` as Route}>Editar</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CollapsedJobPostSection({
  emptyCopy,
  jobPosts,
  title
}: {
  emptyCopy: string;
  jobPosts: JobPostSummary[];
  title: string;
}) {
  return (
    <details className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
      <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
        {title}
      </summary>
      <JobPostList emptyCopy={emptyCopy} jobPosts={jobPosts} />
    </details>
  );
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getWorkerInitials(worker: ClientAcceptedWorker): string {
  const initials = worker.displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase('es-AR');

  return initials || 'T';
}

function AcceptedWorkersList({ workers }: { workers: ClientAcceptedWorker[] }) {
  if (workers.length === 0) {
    return (
      <div className="mt-4 space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Cuando aceptes una oferta, el trabajador va a aparecer acá para entrar rápido a su perfil e historial.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={'/dashboard/jefe/buscar-trabajadores' as Route}>Buscar trabajadores</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
      {workers.slice(0, 8).map((worker) => {
        const avatarSrc = worker.avatarUrl ? getPrivateProfileAvatarSrc(worker.avatarUrl) : null;

        return (
          <Link
            key={worker.id}
            href={`/dashboard/jefe/trabajadores/${worker.id}` as Route}
            aria-label={`Abrir perfil e historial de ${worker.displayName}`}
            className="group flex min-w-0 flex-col items-center gap-2 rounded-[18px] p-2 text-center transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-lg font-black text-primary shadow-soft transition group-hover:border-primary">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={`Foto de perfil de ${worker.displayName}`} className="h-full w-full object-cover" />
              ) : (
                getWorkerInitials(worker)
              )}
            </span>
            <span className="w-full truncate text-sm font-extrabold text-foreground">{worker.displayName}</span>
            <span className="text-xs font-semibold text-muted-foreground">
              {formatCount(worker.acceptedJobsCount, 'trabajo', 'trabajos')}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function ClientHome({
  profile,
  jobPosts = [],
  acceptedWorkers = []
}: {
  profile: AppUserProfile | null;
  jobPosts?: JobPostSummary[];
  acceptedWorkers?: ClientAcceptedWorker[];
}) {
  const firstName = profile?.firstName ?? 'Tu perfil';
  const avatarSrc = profile?.avatarUrl ? getPrivateProfileAvatarSrc(profile.avatarUrl) : null;
  const publishedJobPosts = jobPosts.filter((jobPost) => jobPost.status === JobPostStatus.PUBLISHED);
  const inProgressJobPosts = jobPosts.filter(
    (jobPost) => jobPost.status === JobPostStatus.IN_PROGRESS || jobPost.status === JobPostStatus.READY_FOR_REVIEW
  );
  const finishedJobPosts = jobPosts.filter((jobPost) => jobPost.status === JobPostStatus.CLOSED);

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-5">
        <div className="flex items-center gap-4 px-1">
          {avatarSrc ? (
            <Link
              href={'/dashboard/jefe/perfil' as Route}
              aria-label="Abrir perfil público"
              className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt={`Foto de perfil de ${firstName}`} className="h-full w-full object-cover" />
            </Link>
          ) : null}
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Cliente home</p>
            <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Hola, {firstName}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Elegí una acción clara para resolver tu próximo trabajo sin vueltas.
            </p>
          </div>
        </div>

        <article className="rounded-[30px] bg-primary p-6 text-primary-foreground shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-80">Acción principal</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-normal">Publicá un trabajo</h2>
          <p className="mt-3 text-sm leading-6 opacity-90">
            Contá qué necesitás, dónde y cuándo. En la próxima etapa vas a poder recibir opciones cerca.
          </p>
          <Button asChild className="mt-6 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link href={'/dashboard/jefe/publicar-trabajo' as Route}>Publicar trabajo</Link>
          </Button>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajadores</p>
            <h2 className="mt-3 text-xl font-bold text-foreground">Aceptados por vos</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Entrá al perfil y al historial de trabajos con quienes ya coordinaste.
            </p>
            <AcceptedWorkersList workers={acceptedWorkers} />
          </article>

          <article className="rounded-[24px] border border-dashed border-border bg-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos activos</p>
            <JobPostList emptyCopy="No tenés trabajos publicados esperando ofertas." jobPosts={publishedJobPosts} showEdit />
          </article>
        </div>

        <section className="space-y-4">
          <CollapsedJobPostSection
            emptyCopy="No tenés trabajos en progreso todavía."
            jobPosts={inProgressJobPosts}
            title="Trabajos en progreso"
          />

          <CollapsedJobPostSection
            emptyCopy="Los trabajos cerrados van a aparecer acá."
            jobPosts={finishedJobPosts}
            title="Trabajos terminados"
          />
        </section>
      </section>
    </YavaaPageShell>
  );
}
