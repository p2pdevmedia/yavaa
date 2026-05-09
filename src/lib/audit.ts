import { Prisma } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

type AuditMetadata = Prisma.InputJsonValue | null;

export async function recordAuditLog(entry: {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: AuditMetadata;
}): Promise<void> {
  const prisma = getPrismaClient();

  await prisma.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ?? undefined
    }
  });
}
