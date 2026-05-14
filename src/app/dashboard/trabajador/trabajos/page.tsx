import { JobPostStatus } from '@prisma/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { JobPaymentProgress } from '@/components/dashboard/job-payment-progress';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import {
  formatJobPostPersonName,
  listAcceptedWorkerJobPosts,
  listPublishedWorkerJobPosts,
  type JobPostSummary
} from '@/lib/job-posts';
import { hasCompletedOnboarding, workerCategoryLabels, workerCategorySlugs, type WorkerCategorySlug } from '@/lib/onboarding';
import { canSelectProfileMode } from '@/lib/permissions';

function isWorkerCategorySlug(value: string): value is WorkerCategorySlug {
  return (workerCategorySlugs as ReadonlyArray<string>).includes(value);
}

function formatJobCategory(category: string): string {
  return isWorkerCategorySlug(category) ? workerCategoryLabels[category] : category;
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

function WorkerJobsList({
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

export default async function TrabajadorJobsPage() {
  const context = await getDashboardPageContext('/dashboard/trabajador/trabajos');

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (!canSelectProfileMode(context.appUser.permissionContext, 'trabajador')) {
    redirect('/dashboard/seleccionar-modo' as Route);
  }

  if (!hasCompletedOnboarding(context.appUser.user.profile, 'trabajador')) {
    redirect('/dashboard/onboarding/trabajador' as Route);
  }

  const jobPosts = await listPublishedWorkerJobPosts(context.appUser.user.profile?.workerCategories ?? []);
  const acceptedJobPosts = await listAcceptedWorkerJobPosts(context.appUser.user.id);
  const activeJobPosts = acceptedJobPosts.filter(
    (jobPost) => jobPost.status === JobPostStatus.IN_PROGRESS || jobPost.status === JobPostStatus.READY_FOR_REVIEW
  );
  const finishedJobPosts = acceptedJobPosts.filter((jobPost) => jobPost.status === JobPostStatus.CLOSED);

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Trabajos</p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Tus oportunidades</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Revisá trabajos cercanos, trabajos en curso y trabajos terminados desde un solo lugar.
          </p>
        </div>

        <article className="rounded-[24px] border border-dashed border-border bg-card p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos cercanos</p>
          <WorkerJobsList
            emptyCopy="No hay trabajos cercanos todavía."
            jobPosts={jobPosts}
            showDescription
          />
        </article>

        <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos en curso</p>
          <WorkerJobsList
            emptyCopy="No tenés trabajos en curso todavía."
            jobPosts={activeJobPosts}
            showStatus
          />
        </article>

        <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos terminados</p>
          <WorkerJobsList
            emptyCopy="Los trabajos terminados van a aparecer acá."
            jobPosts={finishedJobPosts}
            showStatus
          />
        </article>
      </section>
    </YavaaPageShell>
  );
}
