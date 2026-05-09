import { UserStatus, type PrismaClient } from '@prisma/client';

import { listCategoriesForAdmin, type AdminCategorySummary } from '@/lib/admin-categories';
import {
  listContractorProfilesForAdmin,
  type AdminContractorProfileSummary
} from '@/lib/admin-contractors';
import { listUsersForAdmin, type AdminUserSummary } from '@/lib/admin-users';
import { listBookingsForActor, type BookingActor } from '@/lib/bookings';
import { serializeBookingsForDashboard, type DashboardBooking } from '@/lib/dashboard-workspace';
import { hasRole, type PermissionContext } from '@/lib/permissions';

export type DashboardAdminData = {
  users: AdminUserSummary[];
  contractorProfiles: AdminContractorProfileSummary[];
  categories: AdminCategorySummary[];
  bookings: DashboardBooking[];
};

export async function getDashboardAdminData(
  prisma: PrismaClient,
  actor: PermissionContext
): Promise<DashboardAdminData | null> {
  if (actor.status !== UserStatus.ACTIVE || !hasRole(actor, 'admin')) {
    return null;
  }

  const [users, contractorProfiles, categories, bookings] = await Promise.all([
    listUsersForAdmin(prisma, actor),
    listContractorProfilesForAdmin(prisma, actor, {}),
    listCategoriesForAdmin(prisma, actor, {}),
    listBookingsForActor(prisma, actor as BookingActor)
  ]);

  return {
    users,
    contractorProfiles,
    categories,
    bookings: serializeBookingsForDashboard(bookings)
  };
}
