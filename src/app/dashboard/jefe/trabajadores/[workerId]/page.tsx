import { IdentityVerificationStatus, JobPostStatus, type JobPostStatus as JobPostStatusValue } from '@prisma/client';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getClientWorkerHistory } from '@/lib/client-workers';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import {
  hasCompletedOnboarding,
  workerCategoryLabels,
  workerCategorySlugs,
  type WorkerCategorySlug
} from '@/lib/onboarding';
import { canSelectProfileMode, hasRole } from '@/lib/permissions';
import { getPrivateProfileAvatarSrc } from '@/lib/profile-avatar';

type ClientWorkerHistoryPageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

function isWorkerCategorySlug(value: string): value is WorkerCategorySlug {
  return (workerCategorySlugs as ReadonlyArray<string>).includes(value);
}

function formatWorkerCategories(categories: string[]): string {
  if (categories.length === 0) {
    return 'Sin rubros cargados';
  }

  return categories.map((category) => (isWorkerCategorySlug(category) ? workerCategoryLabels[category] : category)).join(', ');
}

function formatAmountCents(amountCents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium'
  }).format(value);
}

function formatJobStatus(status: JobPostStatusValue): string {
  const labels: Record<JobPostStatusValue, string> = {
    [JobPostStatus.DRAFT]: 'Borrador',
    [JobPostStatus.PUBLISHED]: 'Publicado',
    [JobPostStatus.IN_PROGRESS]: 'En progreso',
    [JobPostStatus.READY_FOR_REVIEW]: 'Listo para revisión',
    [JobPostStatus.CLOSED]: 'Terminado',
    [JobPostStatus.CANCELLED]: 'Cancelado'
  };

  return labels[status];
}

function formatVerificationStatus(status: IdentityVerificationStatus): string {
  const labels: Record<IdentityVerificationStatus, string> = {
    [IdentityVerificationStatus.NOT_STARTED]: 'Verificación pendiente',
    [IdentityVerificationStatus.PENDING]: 'Verificación en revisión',
    [IdentityVerificationStatus.VERIFIED]: 'Verificación aprobada',
    [IdentityVerificationStatus.REJECTED]: 'Verificación pendiente'
  };

  return labels[status];
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getWorkerInitials(displayName: string): string {
  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase('es-AR');

  return initials || 'T';
}

export default async function ClientWorkerHistoryPage({ params }: ClientWorkerHistoryPageProps) {
  const { workerId } = await params;
  const context = await getDashboardPageContext(`/dashboard/jefe/trabajadores/${workerId}`);

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (
    !canSelectProfileMode(context.appUser.permissionContext, 'jefe') ||
    !hasRole(context.appUser.permissionContext, 'jefe')
  ) {
    redirect('/dashboard/seleccionar-modo' as Route);
  }

  if (!hasCompletedOnboarding(context.appUser.user.profile, 'jefe')) {
    redirect(getOnboardingPath('jefe') as Route);
  }

  const worker = await getClientWorkerHistory(context.appUser.user.id, workerId);

  if (!worker) {
    notFound();
  }

  const avatarSrc = worker.avatarUrl ? getPrivateProfileAvatarSrc(worker.avatarUrl) : null;

  return (
    <YavaaPageShell width="sm" className="py-5">
      <section className="space-y-5">
        <div className="space-y-2 px-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Trabajador aceptado</p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">{worker.displayName}</h1>
          <p className="text-sm leading-6 text-muted-foreground">Perfil e historial de trabajos que hicieron juntos.</p>
        </div>

        <article className="space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-2xl font-black text-primary">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={`Foto de perfil de ${worker.displayName}`} className="h-full w-full object-cover" />
              ) : (
                getWorkerInitials(worker.displayName)
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">{worker.displayName}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{worker.bio ?? 'Este trabajador todavía no cargó una presentación pública.'}</p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Rubros</dt>
              <dd className="mt-2 text-sm font-bold text-foreground">{formatWorkerCategories(worker.categories)}</dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Zona</dt>
              <dd className="mt-2 text-sm font-bold text-foreground">{worker.addressText ?? 'Sin zona cargada'}</dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Precio por hora</dt>
              <dd className="mt-2 text-sm font-bold text-foreground">
                {worker.hourlyRateCents ? formatAmountCents(worker.hourlyRateCents) : 'A convenir'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Verificación</dt>
              <dd className="mt-2 text-sm font-bold text-foreground">
                {formatVerificationStatus(worker.identityVerificationStatus)}
              </dd>
            </div>
          </dl>

          <Button asChild variant="outline" className="w-full">
            <Link href={'/dashboard/jefe' as Route}>Volver</Link>
          </Button>
        </article>

        <section className="space-y-4 rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Historial</p>
            <h2 className="font-display text-2xl font-bold tracking-normal text-foreground">Trabajos con este trabajador</h2>
          </div>

          <div className="space-y-3">
            {worker.history.map((work) => (
              <article key={work.offerId} className="relative rounded-[22px] border border-border bg-background p-4 transition hover:border-primary">
                <Link
                  href={`/dashboard/jefe/trabajos/${work.jobPostId}` as Route}
                  aria-label={`Abrir trabajo ${work.title}`}
                  className="absolute inset-0 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-extrabold text-foreground">{work.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(work.createdAt)} · {formatWorkerCategories([work.category])}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                    {formatJobStatus(work.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">
                  {formatAmountCents(work.amountCents)} · {formatCount(work.messagesCount, 'mensaje', 'mensajes')} ·{' '}
                  {formatCount(work.paymentsCount, 'pago', 'pagos')}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </YavaaPageShell>
  );
}
