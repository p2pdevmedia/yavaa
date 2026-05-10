import type { ReactNode } from 'react';

import type { DashboardPanelProps } from '@/components/dashboard/dashboard-panel';
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

type DashboardViewPageStateArgs = {
  view: DashboardView;
  nextPath: string;
};

type DashboardViewPageReadyState = {
  kind: 'ready';
  panelProps: DashboardPanelProps;
};

type DashboardViewPageFallbackState =
  | {
      kind: 'database-unavailable';
      email: string | null;
    }
  | {
      kind: 'unlinked-user';
      email: string | null;
    };

export type DashboardViewPageState = DashboardViewPageReadyState | DashboardViewPageFallbackState;

export async function getDashboardViewPageState({
  view,
  nextPath
}: DashboardViewPageStateArgs): Promise<DashboardViewPageState> {
  const context = await getDashboardPageContext(nextPath);

  if (context.kind === 'database-unavailable') {
    return { kind: 'database-unavailable', email: context.email };
  }

  if (context.kind === 'unlinked-user') {
    return { kind: 'unlinked-user', email: context.authState.user?.email ?? null };
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

    notifications = await listNotificationsForUser(prisma, context.appUser.user.id, 20);

    if (view === 'admin') {
      adminData = await getDashboardAdminData(prisma, context.appUser.permissionContext);
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return { kind: 'database-unavailable', email: context.authState.user?.email ?? null };
    }

    throw error;
  }

  return {
    kind: 'ready',
    panelProps: {
      view,
      initialUser: context.appUser.user,
      email: context.authState.user?.email ?? null,
      categories,
      bookings: serializeBookingsForDashboard(bookings),
      notifications: serializeNotificationsForDashboard(notifications),
      adminData
    }
  };
}

export function DashboardViewPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-start px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

export function DashboardViewPageFallback({ state }: { state: DashboardViewPageFallbackState }) {
  if (state.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={state.email} />;
  }

  return <DashboardUnlinkedUserState email={state.email} />;
}
