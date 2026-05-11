import type { ReactNode } from 'react';

import type { DashboardPanelProps } from '@/components/dashboard/dashboard-panel';
import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { listBookingsForActor } from '@/lib/bookings';
import { getDashboardAdminData } from '@/lib/dashboard-admin';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import type { DashboardView } from '@/lib/dashboard-routes';
import { serializeBookingsForDashboard, serializeEmergenciesForDashboard } from '@/lib/dashboard-workspace';
import { listEmergencyRequestsForActor, type EmergencyListMode } from '@/lib/emergencies';
import { getPrismaClient } from '@/lib/prisma';
import {
  listPublicCatalogCategories,
  listPublicCatalogLocations,
  listPublicCatalogMarkets
} from '@/lib/public-catalog';
import { isDatabaseUnavailableError } from '@/lib/public-db-fallback';

type DashboardViewPageStateArgs = {
  view: DashboardView;
  nextPath: string;
  mode?: EmergencyListMode;
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
  nextPath,
  mode
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
  let emergencies: Awaited<ReturnType<typeof listEmergencyRequestsForActor>> = [];
  let adminData: Awaited<ReturnType<typeof getDashboardAdminData>> = null;
  let addressMarkets: Awaited<ReturnType<typeof listPublicCatalogMarkets>> = [];
  let addressLocations: Awaited<ReturnType<typeof listPublicCatalogLocations>> = [];

  try {
    const prisma = getPrismaClient();

    if (view === 'perfil') {
      categories = await listPublicCatalogCategories();
      addressMarkets = await listPublicCatalogMarkets();
      addressLocations = await listPublicCatalogLocations(addressMarkets);
    }

    if (view === 'urgencias') {
      categories = await listPublicCatalogCategories();
      emergencies = await listEmergencyRequestsForActor(prisma, context.appUser.permissionContext, { mode });
    }

    if (view === 'bookings') {
      bookings = await listBookingsForActor(prisma, context.appUser.permissionContext);
    }

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
      categories,
      bookings: serializeBookingsForDashboard(bookings),
      emergencies: serializeEmergenciesForDashboard(emergencies),
      adminData,
      addressMarkets,
      addressLocations
    }
  };
}

export function DashboardViewPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-start px-4 pb-8 pt-20 sm:px-6 sm:pt-8 lg:px-8">
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
