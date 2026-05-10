import { redirect } from 'next/navigation';

import { dashboardDefaultPath } from '@/lib/dashboard-routes';

export default function DashboardPage() {
  redirect(dashboardDefaultPath);
}
