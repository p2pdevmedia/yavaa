import { DashboardPanel } from '@/components/dashboard/dashboard-panel';
import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { listBookingsForActor } from '@/lib/bookings';
import { getDashboardAdminData } from '@/lib/dashboard-admin';
import { serializeNotificationsForDashboard } from '@/lib/dashboard-notifications';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import type { DashboardView } from '@/lib/dashboard-routes';
import { serializeBookingsForDashboard } from '@/lib/dashboard-workspace';
import { listNotificationsForUser } from '@/lib/notifications';
import { getPrismaClient } from '@/lib/prisma';
import { listPublicCatalogCategories } from '@/lib/public-catalog';
import { isDatabaseUnavailableError } from '@/lib/public-db-fallback';

type DashboardViewPageProps = {
  view: DashboardView;
  nextPath: string;
};

export async function DashboardViewPage({ view, nextPath }: DashboardViewPageProps) {
  const context = await getDashboardPageContext(nextPath);

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  let categories: Awaited<ReturnType<typeof listPublicCatalogCategories>> = [];
  let bookings: Awaited<ReturnType<typeof listBookingsForActor>> = [];
  let notifications: Awaited<ReturnType<typeof listNotificationsForUser>> = [];
  let adminData: Awaited<ReturnType<typeof getDashboardAdminData>> = null;

  try {
    const prisma = getPrismaClient();

    if (view === 'urgencias') {
      categories = await listPublicCatalogCategories();
    }

    if (view === 'bookings') {
      bookings = await listBookingsForActor(prisma, context.appUser.permissionContext);
    }

    if (view === 'notificaciones') {
      notifications = await listNotificationsForUser(prisma, context.appUser.user.id, 20);
    }

    if (view === 'admin') {
      adminData = await getDashboardAdminData(prisma, context.appUser.permissionContext);
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return <DashboardDatabaseUnavailableState email={context.authState.user?.email ?? null} />;
    }

    throw error;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPanel
        view={view}
        initialUser={context.appUser.user}
        email={context.authState.user?.email ?? null}
        categories={categories}
        bookings={serializeBookingsForDashboard(bookings)}
        notifications={serializeNotificationsForDashboard(notifications)}
        adminData={adminData}
      />
    </main>
  );
}
