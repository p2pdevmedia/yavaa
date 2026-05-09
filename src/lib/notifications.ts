import { Prisma, type PrismaClient } from '@prisma/client';

export const notificationTypes = [
  'BOOKING_CREATED',
  'BOOKING_MESSAGE',
  'BOOKING_STATUS_CHANGED',
  'BOOKING_FILE_UPLOADED'
] as const;

export type NotificationType = (typeof notificationTypes)[number];

const notificationSelect = Prisma.validator<Prisma.NotificationSelect>()({
  id: true,
  recipientUserId: true,
  actorUserId: true,
  bookingId: true,
  type: true,
  title: true,
  body: true,
  metadata: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  updatedAt: true
});

export type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

export type NotificationInput = {
  recipientUserId: string;
  actorUserId?: string | null;
  bookingId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue | null;
  isRead?: boolean;
  readAt?: Date | null;
};

export async function createNotifications(
  prisma: PrismaClient,
  notifications: ReadonlyArray<NotificationInput>
): Promise<NotificationRecord[]> {
  const rows: NotificationRecord[] = [];

  for (const notification of notifications) {
    const row = await prisma.notification.create({
      data: {
        recipientUserId: notification.recipientUserId,
        actorUserId: notification.actorUserId ?? null,
        bookingId: notification.bookingId ?? null,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata ?? undefined,
        isRead: notification.isRead ?? false,
        readAt: notification.readAt ?? (notification.isRead ? new Date() : null)
      },
      select: notificationSelect
    });

    rows.push(row);
  }

  return rows;
}

export async function listNotificationsForUser(
  prisma: PrismaClient,
  userId: string,
  limit = 8
): Promise<NotificationRecord[]> {
  return prisma.notification.findMany({
    where: {
      recipientUserId: userId
    },
    orderBy: [
      { isRead: 'asc' },
      { createdAt: 'desc' },
      { id: 'desc' }
    ],
    take: limit,
    select: notificationSelect
  });
}
