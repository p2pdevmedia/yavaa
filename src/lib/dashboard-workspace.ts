import { type BookingFileRecord, type BookingMessageRecord } from '@/lib/booking-communication';
import { type BookingRecord } from '@/lib/bookings';

type WorkspaceUserLike = {
  id: string;
  email: string;
  displayName: string | null;
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
  } | null;
};

export type DashboardWorkspaceUser = {
  id: string;
  email: string;
  displayName: string | null;
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
};

export type DashboardBooking = {
  id: string;
  status: BookingRecord['status'];
  scheduledFor: string;
  description: string;
  contractorNote: string | null;
  decisionReason: string | null;
  rescheduleRequestedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: DashboardWorkspaceUser;
  contractorProfile: {
    id: string;
    user: DashboardWorkspaceUser;
  };
  category: BookingRecord['category'];
  address: BookingRecord['address'];
};

export type DashboardBookingMessage = {
  id: string;
  bookingId: string;
  senderUserId: string | null;
  kind: BookingMessageRecord['kind'];
  systemEvent: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  senderUser: DashboardWorkspaceUser | null;
};

export type DashboardBookingFile = {
  id: string;
  bookingId: string;
  messageId: string | null;
  uploadedByUserId: string;
  purpose: BookingFileRecord['purpose'];
  fileName: string;
  mimeType: string;
  storageKey: string;
  storageUrl: string | null;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
  uploadedByUser: DashboardWorkspaceUser | null;
};

function serializeWorkspaceUser(user: WorkspaceUserLike): DashboardWorkspaceUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          avatarUrl: user.profile.avatarUrl ?? null
        }
      : null
  };
}

export function serializeBookingForDashboard(booking: BookingRecord): DashboardBooking {
  return {
    id: booking.id,
    status: booking.status,
    scheduledFor: booking.scheduledFor.toISOString(),
    description: booking.description,
    contractorNote: booking.contractorNote,
    decisionReason: booking.decisionReason,
    rescheduleRequestedAt: booking.rescheduleRequestedAt?.toISOString() ?? null,
    acceptedAt: booking.acceptedAt?.toISOString() ?? null,
    rejectedAt: booking.rejectedAt?.toISOString() ?? null,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    client: serializeWorkspaceUser(booking.client),
    contractorProfile: {
      id: booking.contractorProfile.id,
      user: serializeWorkspaceUser(booking.contractorProfile.user)
    },
    category: booking.category,
    address: booking.address
  };
}

export function serializeBookingMessageForDashboard(message: BookingMessageRecord): DashboardBookingMessage {
  return {
    id: message.id,
    bookingId: message.bookingId,
    senderUserId: message.senderUserId,
    kind: message.kind,
    systemEvent: message.systemEvent,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    senderUser: message.senderUser ? serializeWorkspaceUser(message.senderUser) : null
  };
}

export function serializeBookingFileForDashboard(file: BookingFileRecord): DashboardBookingFile {
  return {
    id: file.id,
    bookingId: file.bookingId,
    messageId: file.messageId,
    uploadedByUserId: file.uploadedByUserId,
    purpose: file.purpose,
    fileName: file.fileName,
    mimeType: file.mimeType,
    storageKey: file.storageKey,
    storageUrl: file.storageUrl,
    sizeBytes: file.sizeBytes,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    uploadedByUser: file.uploadedByUser ? serializeWorkspaceUser(file.uploadedByUser) : null
  };
}

export function serializeBookingsForDashboard(bookings: BookingRecord[]): DashboardBooking[] {
  return bookings.map(serializeBookingForDashboard);
}
