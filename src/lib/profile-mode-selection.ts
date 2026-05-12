import type { DashboardMode } from '@/lib/dashboard-routes';
import { getPrismaClient } from '@/lib/prisma';

export async function ensureUserProfileModeRole(userId: string, mode: DashboardMode): Promise<void> {
  const prisma = getPrismaClient();
  const role = await prisma.role.findUniqueOrThrow({
    where: {
      slug: mode
    },
    select: {
      id: true
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id
      }
    },
    create: {
      userId,
      roleId: role.id
    },
    update: {}
  });
}
