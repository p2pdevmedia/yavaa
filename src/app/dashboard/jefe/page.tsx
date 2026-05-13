import { redirect } from 'next/navigation';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { ClientHome } from '@/components/dashboard/client-home';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { getOnboardingPath } from '@/lib/dashboard-routes';
import { listClientDashboardJobPosts } from '@/lib/job-posts';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { canSelectProfileMode } from '@/lib/permissions';

export default async function JefeDashboardPage() {
  const context = await getDashboardPageContext('/dashboard/jefe');

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (!canSelectProfileMode(context.appUser.permissionContext, 'jefe')) {
    redirect('/dashboard/seleccionar-modo' as Route);
  }

  if (!hasCompletedOnboarding(context.appUser.user.profile, 'jefe')) {
    redirect(getOnboardingPath('jefe') as Route);
  }

  const jobPosts = await listClientDashboardJobPosts(context.appUser.user.id);

  return <ClientHome profile={context.appUser.user.profile} jobPosts={jobPosts} />;
}
