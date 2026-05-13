import { redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { WorkerHome } from '@/components/dashboard/worker-home';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { listPublishedWorkerJobPosts } from '@/lib/job-posts';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { canSelectProfileMode } from '@/lib/permissions';

export default async function TrabajadorDashboardPage() {
  const context = await getDashboardPageContext('/dashboard/trabajador');

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
    redirect(getOnboardingPath('trabajador') as Route);
  }

  const jobPosts = await listPublishedWorkerJobPosts(context.appUser.user.profile?.workerCategories ?? []);

  return <WorkerHome profile={context.appUser.user.profile} jobPosts={jobPosts} />;
}
