import { JobPostStatus, type JobPostStatus as JobPostStatusValue } from '@prisma/client';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { WorkerJobPayments } from '@/components/jobs/worker-job-payments';
import { WorkerOfferChat } from '@/components/jobs/worker-offer-chat';
import { WorkerReadyAction } from '@/components/jobs/worker-ready-action';
import { WorkerOfferForm } from '@/components/jobs/worker-offer-form';
import { WorkerOfferSummary } from '@/components/jobs/worker-offer-summary';
import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { getPrivateJobPhotoSrc } from '@/lib/job-photos';
import { getWorkerJobPostForDetail } from '@/lib/job-offers';
import {
  hasCompletedOnboarding,
  workerCategoryLabels,
  workerCategorySlugs,
  type WorkerCategorySlug
} from '@/lib/onboarding';
import { canSelectProfileMode, hasRole } from '@/lib/permissions';

type WorkerJobPostDetailPageProps = {
  params: Promise<{
    jobPostId: string;
  }>;
};

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

function formatJobStatus(status: JobPostStatusValue): string {
  const labels: Record<JobPostStatusValue, string> = {
    [JobPostStatus.DRAFT]: 'Borrador',
    [JobPostStatus.PUBLISHED]: 'Disponible',
    [JobPostStatus.IN_PROGRESS]: 'En progreso',
    [JobPostStatus.READY_FOR_REVIEW]: 'Listo para revisión',
    [JobPostStatus.CLOSED]: 'Cerrado',
    [JobPostStatus.CANCELLED]: 'Cancelado'
  };

  return labels[status];
}

export default async function WorkerJobPostDetailPage({ params }: WorkerJobPostDetailPageProps) {
  const { jobPostId } = await params;
  const context = await getDashboardPageContext(`/dashboard/trabajador/trabajos/${jobPostId}`);

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (
    !canSelectProfileMode(context.appUser.permissionContext, 'trabajador') ||
    !hasRole(context.appUser.permissionContext, 'trabajador')
  ) {
    redirect('/dashboard/seleccionar-modo' as Route);
  }

  if (!hasCompletedOnboarding(context.appUser.user.profile, 'trabajador')) {
    redirect(getOnboardingPath('trabajador') as Route);
  }

  const jobPost = await getWorkerJobPostForDetail(context.appUser.user.id, jobPostId);

  if (!jobPost) {
    notFound();
  }

  const acceptedOffer = jobPost.acceptedOffer;
  const canUseAcceptedOffer =
    acceptedOffer &&
    (jobPost.status === JobPostStatus.IN_PROGRESS || jobPost.status === JobPostStatus.READY_FOR_REVIEW);

  return (
    <YavaaPageShell width="sm" className="py-5">
      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
            {jobPost.status === JobPostStatus.PUBLISHED ? 'Trabajo disponible' : 'Trabajo aceptado'}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">{jobPost.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{jobPost.addressText}</p>
        </div>

        <article className="space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Categoría</p>
              <p className="mt-2 text-base font-bold text-foreground">{formatJobCategory(jobPost.category)}</p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Fecha y hora</p>
              <p className="mt-2 text-base font-bold text-foreground">{formatDesiredTime(jobPost.desiredTime)}</p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Estado</p>
              <p className="mt-2 text-base font-bold text-foreground">{formatJobStatus(jobPost.status)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Descripción</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{jobPost.description}</p>
          </div>

          {jobPost.photoPathnames.length > 0 ? (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Fotos</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {jobPost.photoPathnames.map((pathname) => (
                  <div key={pathname} className="overflow-hidden rounded-[16px] border border-border bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getPrivateJobPhotoSrc(pathname)} alt="Foto del trabajo" className="aspect-square w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Button asChild variant="outline" className="w-full">
            <Link href={'/dashboard/trabajador' as Route}>Volver</Link>
          </Button>
        </article>

        {jobPost.status === JobPostStatus.PUBLISHED ? (
          <WorkerOfferForm jobPost={{ id: jobPost.id, title: jobPost.title }} />
        ) : acceptedOffer ? (
          <>
            <WorkerOfferSummary amountCents={acceptedOffer.amountCents} status={acceptedOffer.status} />

            {jobPost.status === JobPostStatus.IN_PROGRESS ? (
              <WorkerReadyAction offerId={acceptedOffer.id} />
            ) : jobPost.status === JobPostStatus.READY_FOR_REVIEW ? (
              <p className="rounded-[22px] border border-border bg-card p-4 text-sm font-semibold text-muted-foreground shadow-soft">
                Marcaste este trabajo como listo. El cliente lo está revisando.
              </p>
            ) : null}

            <WorkerOfferChat
              offerId={acceptedOffer.id}
              initialMessages={acceptedOffer.messages}
              currentUserId={context.appUser.user.id}
              clientId={jobPost.clientId}
              canSendMessages={Boolean(canUseAcceptedOffer)}
            />

            <WorkerJobPayments
              offerId={acceptedOffer.id}
              initialPayments={acceptedOffer.payments}
              currentUserId={context.appUser.user.id}
              canRegisterPayments={Boolean(canUseAcceptedOffer)}
            />
          </>
        ) : null}
      </section>
    </YavaaPageShell>
  );
}
