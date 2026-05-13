import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { getPrivateJobPhotoSrc } from '@/lib/job-photos';
import { getActiveClientJobPost } from '@/lib/job-posts';
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

  const jobPost = await getActiveClientJobPost(context.appUser.user.id, jobPostId);

  if (!jobPost) {
    notFound();
  }

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
      </section>
    </YavaaPageShell>
  );
}
