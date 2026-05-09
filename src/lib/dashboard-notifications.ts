import type { NotificationRecord } from '@/lib/notifications';

export type DashboardNotification = {
  id: string;
  bookingId: string | null;
  type: NotificationRecord['type'];
  typeLabel: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatNotificationTypeLabel(type: NotificationRecord['type']): string {
  switch (type) {
    case 'BOOKING_CREATED':
      return 'Booking creado';
    case 'BOOKING_MESSAGE':
      return 'Mensaje nuevo';
    case 'BOOKING_STATUS_CHANGED':
      return 'Estado actualizado';
    case 'BOOKING_FILE_UPLOADED':
      return 'Archivo subido';
    default:
      return 'Notificación';
  }
}

export function serializeNotificationForDashboard(notification: NotificationRecord): DashboardNotification {
  return {
    id: notification.id,
    bookingId: notification.bookingId,
    type: notification.type,
    typeLabel: formatNotificationTypeLabel(notification.type),
    title: notification.title,
    body: notification.body,
    isRead: notification.isRead,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString()
  };
}

export function serializeNotificationsForDashboard(
  notifications: ReadonlyArray<NotificationRecord>
): DashboardNotification[] {
  return notifications.map(serializeNotificationForDashboard);
}
