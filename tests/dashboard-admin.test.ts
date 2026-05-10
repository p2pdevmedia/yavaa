import { UserStatus, type PrismaClient } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDashboardAdminData } from '@/lib/dashboard-admin';
import { listCategoriesForAdmin } from '@/lib/admin-categories';
import { listContractorProfilesForAdmin } from '@/lib/admin-contractors';
import { listUsersForAdmin } from '@/lib/admin-users';
import { listBookingsForActor } from '@/lib/bookings';
import { listEmergencyRequestsForActor } from '@/lib/emergencies';

vi.mock('@/lib/admin-categories', () => ({
  listCategoriesForAdmin: vi.fn()
}));

vi.mock('@/lib/admin-contractors', () => ({
  listContractorProfilesForAdmin: vi.fn()
}));

vi.mock('@/lib/admin-users', () => ({
  listUsersForAdmin: vi.fn()
}));

vi.mock('@/lib/bookings', () => ({
  listBookingsForActor: vi.fn()
}));

vi.mock('@/lib/emergencies', () => ({
  listEmergencyRequestsForActor: vi.fn()
}));

const activeAdmin = {
  userId: 'admin_001',
  status: UserStatus.ACTIVE,
  roles: ['admin']
} as const;

const activeClient = {
  userId: 'client_001',
  status: UserStatus.ACTIVE,
  roles: ['client']
} as const;

afterEach(() => {
  vi.resetAllMocks();
});

describe('dashboard admin data', () => {
  it('returns null for non-admin dashboard users', async () => {
    const data = await getDashboardAdminData({} as PrismaClient, activeClient);

    expect(data).toBeNull();
    expect(listUsersForAdmin).not.toHaveBeenCalled();
    expect(listContractorProfilesForAdmin).not.toHaveBeenCalled();
    expect(listCategoriesForAdmin).not.toHaveBeenCalled();
    expect(listBookingsForActor).not.toHaveBeenCalled();
    expect(listEmergencyRequestsForActor).not.toHaveBeenCalled();
  });

  it('loads every admin workspace surface for active admins', async () => {
    vi.mocked(listUsersForAdmin).mockResolvedValue([
      {
        id: 'user_001',
        email: 'client@yavaa.test',
        displayName: 'Client User',
        status: UserStatus.ACTIVE,
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
        profile: null,
        roles: [{ slug: 'client', name: 'Client' }]
      }
    ]);
    vi.mocked(listContractorProfilesForAdmin).mockResolvedValue([]);
    vi.mocked(listCategoriesForAdmin).mockResolvedValue([]);
    vi.mocked(listBookingsForActor).mockResolvedValue([]);
    vi.mocked(listEmergencyRequestsForActor).mockResolvedValue([]);

    const data = await getDashboardAdminData({} as PrismaClient, activeAdmin);

    expect(listUsersForAdmin).toHaveBeenCalledWith({}, activeAdmin);
    expect(listContractorProfilesForAdmin).toHaveBeenCalledWith({}, activeAdmin, {});
    expect(listCategoriesForAdmin).toHaveBeenCalledWith({}, activeAdmin, {});
    expect(listBookingsForActor).toHaveBeenCalledWith({}, activeAdmin);
    expect(listEmergencyRequestsForActor).toHaveBeenCalledWith({}, activeAdmin);
    expect(data?.users).toHaveLength(1);
    expect(data?.contractorProfiles).toEqual([]);
    expect(data?.categories).toEqual([]);
    expect(data?.bookings).toEqual([]);
    expect(data?.emergencies).toEqual([]);
  });
});
