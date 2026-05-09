import { describe, expect, it, vi } from 'vitest';

import { createNotifications } from '@/lib/notifications';
import { serializeNotificationsForDashboard } from '@/lib/dashboard-notifications';

describe('notifications helpers', () => {
  it('creates notification rows with read state and recipient metadata', async () => {
    const notificationCreate = vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'notification_001',
      recipientUserId: data.recipientUserId as string,
      actorUserId: (data.actorUserId as string | null | undefined) ?? null,
      bookingId: (data.bookingId as string | null | undefined) ?? null,
      type: data.type as string,
      title: data.title as string,
      body: data.body as string,
      metadata: (data.metadata as Record<string, unknown> | null | undefined) ?? null,
      isRead: (data.isRead as boolean | null | undefined) ?? false,
      readAt: (data.readAt as Date | null | undefined) ?? null,
      createdAt: new Date('2026-05-09T10:00:00.000Z'),
      updatedAt: new Date('2026-05-09T10:00:00.000Z')
    }));

    const prisma = {
      notification: {
        create: notificationCreate
      }
    };

    const notifications = await createNotifications(prisma as never, [
      {
        recipientUserId: 'user_client',
        actorUserId: 'user_contractor',
        bookingId: 'booking_001',
        type: 'BOOKING_MESSAGE',
        title: 'Nuevo mensaje',
        body: 'Recibiste un nuevo mensaje en el booking.',
        isRead: false
      },
      {
        recipientUserId: 'user_client',
        actorUserId: 'user_contractor',
        bookingId: 'booking_001',
        type: 'BOOKING_STATUS_CHANGED',
        title: 'Booking aceptado',
        body: 'El contractor aceptó tu booking.',
        isRead: true,
        readAt: new Date('2026-05-09T10:01:00.000Z')
      }
    ]);

    expect(notificationCreate).toHaveBeenCalledTimes(2);
    expect(notifications).toHaveLength(2);
    expect(notifications[1]).toMatchObject({
      isRead: true
    });
  });

  it('serializes notifications into a dashboard-safe shape', () => {
    const serialized = serializeNotificationsForDashboard([
      {
        id: 'notification_001',
        recipientUserId: 'user_client',
        actorUserId: 'user_contractor',
        bookingId: 'booking_001',
        type: 'BOOKING_CREATED',
        title: 'Booking creado',
        body: 'Tu booking quedó registrado y esperando respuesta.',
        metadata: null,
        isRead: true,
        readAt: new Date('2026-05-09T10:00:00.000Z'),
        createdAt: new Date('2026-05-09T10:00:00.000Z'),
        updatedAt: new Date('2026-05-09T10:00:00.000Z')
      } as never
    ]);

    expect(serialized[0]).toMatchObject({
      id: 'notification_001',
      type: 'BOOKING_CREATED',
      typeLabel: 'Booking creado',
      createdAt: '2026-05-09T10:00:00.000Z'
    });
  });
});
