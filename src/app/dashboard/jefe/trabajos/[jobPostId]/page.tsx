import {
  JobOfferStatus,
  JobPostStatus,
  type JobOfferStatus as JobOfferStatusValue,
  type JobPostStatus as JobPostStatusValue
} from '@prisma/client';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { ClientOfferActions } from '@/components/jobs/client-offer-actions';
import { ClientReviewActions } from '@/components/jobs/client-review-actions';
import { JobPaymentForm } from '@/components/jobs/job-payment-form';
import { OfferChat } from '@/components/jobs/offer-chat';
import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { getPrivateJobPhotoSrc } from '@/lib/job-photos';
import { listClientJobOffers, type ClientJobOfferListItem } from '@/lib/job-offers';
import { getClientJobPostForDetail } from '@/lib/job-posts';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { hasRole } from '@/lib/permissions';

type JobPostDetailPageProps = {
  params: Promise<{
    jobPostId: string;
  }>;
};

function formatDesiredTime(value: Date | null): string {
  if (!value) {
    return 'Sin fecha definida';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function formatAmountCents(amountCents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function formatWorkerName(worker: ClientJobOfferListItem['worker']): string {
  const firstName = worker.profile?.firstName?.trim();
  const lastName = worker.profile?.lastName?.trim();

  if (firstName) {
    const lastInitial = lastName ? `${lastName.charAt(0).toLocaleUpperCase('es-AR')}.` : null;

    return [firstName, lastInitial].filter(Boolean).join(' ');
  }

  return worker.displayName?.trim() || worker.email;
}

function formatOfferStatus(status: JobOfferStatusValue): string {
  const labels: Record<JobOfferStatusValue, string> = {
    [JobOfferStatus.PENDING]: 'Pendiente',
    [JobOfferStatus.ACCEPTED]: 'Aceptada',
    [JobOfferStatus.REJECTED]: 'Rechazada'
  };

  return labels[status];
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function canMessageOffer(offerStatus: JobOfferStatusValue, jobPostStatus: JobPostStatusValue): boolean {
  if (offerStatus === JobOfferStatus.PENDING) {
    return jobPostStatus === JobPostStatus.PUBLISHED;
  }

  return (
    offerStatus === JobOfferStatus.ACCEPTED &&
    (jobPostStatus === JobPostStatus.IN_PROGRESS || jobPostStatus === JobPostStatus.READY_FOR_REVIEW)
  );
}

function canRegisterPayments(offerStatus: JobOfferStatusValue, jobPostStatus: JobPostStatusValue): boolean {
  return (
    offerStatus === JobOfferStatus.ACCEPTED &&
    (jobPostStatus === JobPostStatus.IN_PROGRESS || jobPostStatus === JobPostStatus.READY_FOR_REVIEW)
  );
}

function canReviewOffer(offerStatus: JobOfferStatusValue, jobPostStatus: JobPostStatusValue): boolean {
  return offerStatus === JobOfferStatus.ACCEPTED && jobPostStatus === JobPostStatus.READY_FOR_REVIEW;
}

export default async function JobPostDetailPage({ params }: JobPostDetailPageProps) {
  const { jobPostId } = await params;
  const context = await getDashboardPageContext(`/dashboard/jefe/trabajos/${jobPostId}`);

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (!hasRole(context.appUser.permissionContext, 'jefe')) {
    redirect('/dashboard/seleccionar-modo' as Route);
  }

  if (!hasCompletedOnboarding(context.appUser.user.profile, 'jefe')) {
    redirect(getOnboardingPath('jefe') as Route);
  }

  const jobPost = await getClientJobPostForDetail(context.appUser.user.id, jobPostId);

  if (!jobPost) {
    notFound();
  }

  const offers = await listClientJobOffers(context.appUser.user.id, jobPost.id);

  return (
    <YavaaPageShell width="sm" className="py-5">
      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Trabajo activo</p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">{jobPost.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{jobPost.addressText}</p>
        </div>

        <article className="space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Categoría</p>
              <p className="mt-2 text-base font-bold text-foreground">{jobPost.category}</p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Fecha y hora</p>
              <p className="mt-2 text-base font-bold text-foreground">{formatDesiredTime(jobPost.desiredTime)}</p>
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

          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline">
              <Link href={'/dashboard/jefe' as Route}>Volver</Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/jefe/trabajos/${jobPost.id}/editar` as Route}>Editar</Link>
            </Button>
          </div>
        </article>

        <section className="space-y-4 rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Ofertas recibidas</p>
            <h2 className="font-display text-2xl font-bold tracking-normal text-foreground">Trabajadores interesados</h2>
          </div>

          {offers.length === 0 ? (
            <p className="rounded-[18px] bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
              Todavía no recibiste ofertas para este trabajo.
            </p>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <article key={offer.id} className="space-y-4 rounded-[22px] border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-foreground">{formatWorkerName(offer.worker)}</h3>
                      <p className="text-2xl font-black text-foreground">{formatAmountCents(offer.amountCents)}</p>
                    </div>
                    <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                      {formatOfferStatus(offer.status)}
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {formatCount(offer._count.messages, 'mensaje', 'mensajes')} ·{' '}
                    {formatCount(offer._count.payments, 'pago', 'pagos')}
                  </p>

                  {offer.status === JobOfferStatus.PENDING ? (
                    <ClientOfferActions offerId={offer.id} acceptLabel="Aceptar oferta" rejectLabel="Rechazar" />
                  ) : (
                    <p className="text-sm font-semibold text-muted-foreground">
                      Esta oferta figura como {formatOfferStatus(offer.status).toLocaleLowerCase('es-AR')}.
                    </p>
                  )}

                  {canReviewOffer(offer.status, jobPost.status) ? <ClientReviewActions offerId={offer.id} /> : null}

                  {canMessageOffer(offer.status, jobPost.status) ? (
                    <OfferChat
                      offerId={offer.id}
                      initialMessages={offer.messages}
                      currentUserId={context.appUser.user.id}
                      authorLabels={{
                        [context.appUser.user.id]: 'Vos',
                        [offer.worker.id]: formatWorkerName(offer.worker)
                      }}
                    />
                  ) : offer.status === JobOfferStatus.ACCEPTED ? (
                    <p className="border-t border-border pt-4 text-sm font-semibold text-muted-foreground">
                      El chat de esta oferta queda disponible como historial.
                    </p>
                  ) : null}

                  {canRegisterPayments(offer.status, jobPost.status) ? (
                    <JobPaymentForm
                      offerId={offer.id}
                      initialPayments={offer.payments}
                      authorLabels={{
                        [context.appUser.user.id]: 'Vos',
                        [offer.worker.id]: formatWorkerName(offer.worker)
                      }}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </YavaaPageShell>
  );
}
