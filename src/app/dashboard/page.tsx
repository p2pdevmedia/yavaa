import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';

import { dashboardDefaultPath } from '@/lib/dashboard-routes';
import { buildSignInPath, getAuthSessionState } from '@/lib/auth';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);

  if (!authState.authenticated) {
    redirect(buildSignInPath('/dashboard') as Route);
  }

  redirect(dashboardDefaultPath);
}
