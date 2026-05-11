import { describe, expect, it, vi } from 'vitest';

import { getDashboardViewPageState } from '@/app/dashboard/dashboard-view-page';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { listPublicCatalogCategories, listPublicCatalogLocations, listPublicCatalogMarkets } from '@/lib/public-catalog';

vi.mock('@/components/dashboard/dashboard-states', () => ({
  DashboardDatabaseUnavailableState: () => null,
  DashboardUnlinkedUserState: () => null
}));

vi.mock('@/lib/bookings', () => ({
  listBookingsForActor: vi.fn()
}));

vi.mock('@/lib/dashboard-admin', () => ({
  getDashboardAdminData: vi.fn()
}));

vi.mock('@/lib/dashboard-page-data', () => ({
  getDashboardPageContext: vi.fn()
}));

vi.mock('@/lib/dashboard-workspace', () => ({
  serializeBookingsForDashboard: vi.fn(() => []),
  serializeEmergenciesForDashboard: vi.fn(() => [])
}));

vi.mock('@/lib/emergencies', () => ({
  listEmergencyRequestsForActor: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn(() => ({}))
}));

vi.mock('@/lib/public-catalog', () => ({
  listPublicCatalogCategories: vi.fn(),
  listPublicCatalogLocations: vi.fn(),
  listPublicCatalogMarkets: vi.fn()
}));

const mockedGetDashboardPageContext = vi.mocked(getDashboardPageContext);
const mockedListPublicCatalogCategories = vi.mocked(listPublicCatalogCategories);
const mockedListPublicCatalogLocations = vi.mocked(listPublicCatalogLocations);
const mockedListPublicCatalogMarkets = vi.mocked(listPublicCatalogMarkets);

describe('dashboard view page data', () => {
  it('loads catalog categories for profile views so worker profiles can select services', async () => {
    const categories = [
      {
        id: 'category_001',
        slug: 'plumbing',
        name: 'Plomeria',
        group: 'hogar',
        isInitial: true
      }
    ];

    mockedGetDashboardPageContext.mockResolvedValue({
      kind: 'ready',
      authState: {
        authenticated: true,
        user: {
          id: 'auth_user_001',
          email: 'worker@yavaa.test'
        }
      },
      appUser: {
        configured: true,
        matchedBy: 'supabaseAuthId',
        identity: {
          id: 'auth_user_001',
          email: 'worker@yavaa.test'
        },
        user: {
          id: 'user_001',
          email: 'worker@yavaa.test',
          displayName: 'Worker',
          status: 'ACTIVE',
          roles: ['contractor'],
          profile: null,
          contractorProfile: null,
          addresses: []
        },
        permissionContext: {
          userId: 'user_001',
          roles: ['contractor'],
          status: 'ACTIVE'
        }
      }
    } as never);
    mockedListPublicCatalogCategories.mockResolvedValue(categories);
    mockedListPublicCatalogMarkets.mockResolvedValue([]);
    mockedListPublicCatalogLocations.mockResolvedValue([]);

    const state = await getDashboardViewPageState({
      view: 'perfil',
      nextPath: '/dashboard/trabajador/perfil'
    });

    expect(state.kind).toBe('ready');
    expect(mockedListPublicCatalogCategories).toHaveBeenCalledTimes(1);

    if (state.kind === 'ready') {
      expect(state.panelProps.categories).toEqual(categories);
    }
  });
});
