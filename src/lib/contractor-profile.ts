import { type Prisma, type PrismaClient } from '@prisma/client';

type ContractorRoleClient = Pick<PrismaClient | Prisma.TransactionClient, 'role' | 'userRole'>;

export async function ensureContractorRoleForUser(prisma: ContractorRoleClient, userId: string): Promise<void> {
  const contractorRole = await prisma.role.findUnique({
    where: { slug: 'contractor' },
    select: { id: true }
  });

  if (!contractorRole) {
    throw new Error('contractor-role-not-found');
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: contractorRole.id
      }
    },
    update: {},
    create: {
      userId,
      roleId: contractorRole.id
    }
  });
}
