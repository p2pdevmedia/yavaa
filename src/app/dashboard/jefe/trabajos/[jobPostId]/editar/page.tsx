import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { EditJobForm } from '@/components/jobs/edit-job-form';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { getActiveClientJobPost, serializeJobPost } from '@/lib/job-posts';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { hasRole } from '@/lib/permissions';

type EditJobPostPageProps = {
  params: Promise<{
    jobPostId: string;
  }>;
};

export default async function EditJobPostPage({ params }: EditJobPostPageProps) {
  const { jobPostId } = await params;
  const context = await getDashboardPageContext(`/dashboard/jefe/trabajos/${jobPostId}/editar`);

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
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Editar trabajo</p>
          <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">{jobPost.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">Actualizá los datos principales del trabajo activo.</p>
        </div>
        <EditJobForm jobPost={serializeJobPost(jobPost)} />
      </section>
    </YavaaPageShell>
  );
}
