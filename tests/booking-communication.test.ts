import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordAuditLog } from '@/lib/audit';
import {
  createBookingSystemMessage,
  listBookingMessagesForActor,
  registerBookingFile,
  sendBookingMessage,
  type BookingCommunicationActor
} from '@/lib/booking-communication';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const mockedRecordAuditLog = vi.mocked(recordAuditLog);

afterEach(() => {
  vi.clearAllMocks();
});

const clientActor: BookingCommunicationActor = {
  userId: '11111111-1111-4111-8111-111111111111',
  status: UserStatus.ACTIVE,
  roles: ['client']
};

const contractorActor: BookingCommunicationActor = {
  userId: '22222222-2222-4222-8222-222222222222',
  status: UserStatus.ACTIVE,
  roles: ['contractor']
};

const adminActor: BookingCommunicationActor = {
  userId: '33333333-3333-4333-8333-333333333333',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

const outsiderActor: BookingCommunicationActor = {
  userId: '44444444-4444-4444-8444-444444444444',
  status: UserStatus.ACTIVE,
  roles: ['client']
};

function buildMockPrisma() {
  const bookingId = '55555555-5555-4555-8555-555555555555';
  const bookingAccessRow = {
    id: bookingId,
    clientUserId: clientActor.userId,
    contractorProfile: {
      userId: contractorActor.userId
    }
  };

  type MockMessageRow = {
    id: string;
    bookingId: string;
    senderUserId: string | null;
    kind: string;
    systemEvent: string | null;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  };

  type MockFileRow = {
    id: string;
    bookingId: string;
    messageId: string | null;
    uploadedByUserId: string;
    purpose: string;
    fileName: string;
    mimeType: string;
    storageKey: string;
    storageUrl: string | null;
    sizeBytes: number | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type MockNotificationRow = {
    id: string;
    recipientUserId: string;
    actorUserId: string | null;
    bookingId: string | null;
    type: string;
    title: string;
    body: string;
    metadata: Record<string, unknown> | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  let messages: MockMessageRow[] = [
    {
      id: 'msg_001',
      bookingId,
      senderUserId: null,
      kind: 'SYSTEM',
      systemEvent: 'booking.created',
      body: 'Booking created.',
      createdAt: new Date('2026-05-09T10:00:00.000Z'),
      updatedAt: new Date('2026-05-09T10:00:00.000Z')
    }
  ];

  let files: MockFileRow[] = [
    {
      id: 'file_001',
      bookingId,
      messageId: null,
      uploadedByUserId: clientActor.userId,
      purpose: 'PROBLEM_PHOTO',
      fileName: 'leak.jpg',
      mimeType: 'image/jpeg',
      storageKey: 'bookings/55555555-5555-4555-8555-555555555555/leak.jpg',
      storageUrl: 'https://cdn.yavaa.test/bookings/leak.jpg',
      sizeBytes: 1024,
      createdAt: new Date('2026-05-09T10:05:00.000Z'),
      updatedAt: new Date('2026-05-09T10:05:00.000Z')
    }
  ];

  let notifications: MockNotificationRow[] = [];

  const bookingMessageCreate = vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    const row: MockMessageRow = {
      id: `msg_${messages.length + 1}`.padEnd(8, '0'),
      bookingId: data.bookingId as string,
      senderUserId: (data.senderUserId as string | null | undefined) ?? null,
      kind: data.kind as string,
      systemEvent: (data.systemEvent as string | null | undefined) ?? null,
      body: data.body as string,
      createdAt: new Date('2026-05-09T11:00:00.000Z'),
      updatedAt: new Date('2026-05-09T11:00:00.000Z')
    };

    messages = [...messages, row];
    return row;
  });

  const bookingFileCreate = vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    const row: MockFileRow = {
      id: `file_${files.length + 1}`.padEnd(8, '0'),
      bookingId: data.bookingId as string,
      messageId: (data.messageId as string | null | undefined) ?? null,
      uploadedByUserId: data.uploadedByUserId as string,
      purpose: data.purpose as string,
      fileName: data.fileName as string,
      mimeType: data.mimeType as string,
      storageKey: data.storageKey as string,
      storageUrl: (data.storageUrl as string | null | undefined) ?? null,
      sizeBytes: (data.sizeBytes as number | null | undefined) ?? null,
      createdAt: new Date('2026-05-09T11:05:00.000Z'),
      updatedAt: new Date('2026-05-09T11:05:00.000Z')
    };

    files = [...files, row];
    return row;
  });

  const notificationCreate = vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    const row: MockNotificationRow = {
      id: `notif_${notifications.length + 1}`.padEnd(8, '0'),
      recipientUserId: data.recipientUserId as string,
      actorUserId: (data.actorUserId as string | null | undefined) ?? null,
      bookingId: (data.bookingId as string | null | undefined) ?? null,
      type: data.type as string,
      title: data.title as string,
      body: data.body as string,
      metadata: (data.metadata as Record<string, unknown> | null | undefined) ?? null,
      isRead: (data.isRead as boolean | null | undefined) ?? false,
      readAt: (data.readAt as Date | null | undefined) ?? null,
      createdAt: new Date('2026-05-09T11:10:00.000Z'),
      updatedAt: new Date('2026-05-09T11:10:00.000Z')
    };

    notifications = [...notifications, row];
    return row;
  });

  const prisma = {
    booking: {
      findUnique: vi.fn().mockResolvedValue(bookingAccessRow)
    },
    bookingMessage: {
      findMany: vi.fn().mockImplementation(async () => messages),
      create: bookingMessageCreate
    },
    bookingFile: {
      findMany: vi.fn().mockImplementation(async () => files),
      create: bookingFileCreate
    },
    notification: {
      create: notificationCreate
    }
  };

  return { prisma, bookingMessageCreate, bookingFileCreate, notificationCreate };
}

describe('booking communication helpers', () => {
  it('lists booking messages in chronological order for a participant', async () => {
    const { prisma } = buildMockPrisma();

    const messages = await listBookingMessagesForActor(prisma as never, clientActor, '55555555-5555-4555-8555-555555555555');

    expect(prisma.booking.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.bookingMessage.findMany).toHaveBeenCalledTimes(1);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      kind: 'SYSTEM',
      systemEvent: 'booking.created'
    });
  });

  it('creates a system message without a sender', async () => {
    const { prisma, bookingMessageCreate } = buildMockPrisma();

    const message = await createBookingSystemMessage(
      prisma as never,
      '55555555-5555-4555-8555-555555555555',
      'booking.accepted',
      'Booking accepted by contractor.'
    );

    expect(bookingMessageCreate).toHaveBeenCalledTimes(1);
    expect(message).toMatchObject({
      kind: 'SYSTEM',
      senderUserId: null,
      systemEvent: 'booking.accepted',
      body: 'Booking accepted by contractor.'
    });
  });

  it('lets a participant send a text message and stores audit metadata', async () => {
    const { prisma, bookingMessageCreate, notificationCreate } = buildMockPrisma();

    const message = await sendBookingMessage(
      prisma as never,
      contractorActor,
      '55555555-5555-4555-8555-555555555555',
      {
        body: 'I am on the way'
      }
    );

    expect(prisma.booking.findUnique).toHaveBeenCalledTimes(1);
    expect(bookingMessageCreate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(mockedRecordAuditLog).toHaveBeenCalledTimes(1);
    expect(message).toMatchObject({
      kind: 'USER',
      senderUserId: contractorActor.userId,
      body: 'I am on the way'
    });
  });

  it('lets a participant register a booking file and rejects unrelated users', async () => {
    const { prisma, bookingFileCreate, notificationCreate } = buildMockPrisma();

    const file = await registerBookingFile(
      prisma as never,
      clientActor,
      '55555555-5555-4555-8555-555555555555',
      {
        purpose: 'PROBLEM_PHOTO',
        fileName: 'leak.jpg',
        mimeType: 'image/jpeg',
        storageKey: 'bookings/55555555-5555-4555-8555-555555555555/leak.jpg',
        storageUrl: 'https://cdn.yavaa.test/bookings/leak.jpg',
        sizeBytes: 1024
      }
    );

    expect(prisma.booking.findUnique).toHaveBeenCalledTimes(1);
    expect(bookingFileCreate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(file).toMatchObject({
      purpose: 'PROBLEM_PHOTO',
      uploadedByUserId: clientActor.userId
    });

    await expect(
      registerBookingFile(prisma as never, outsiderActor, '55555555-5555-4555-8555-555555555555', {
        purpose: 'PROBLEM_PHOTO',
        fileName: 'unauthorized.jpg',
        mimeType: 'image/jpeg',
        storageKey: 'bookings/55555555-5555-4555-8555-555555555555/unauthorized.jpg',
        storageUrl: 'https://cdn.yavaa.test/bookings/unauthorized.jpg',
        sizeBytes: 512
      })
    ).rejects.toThrow('forbidden');
  });

  it('allows admins to read booking messages without being participants', async () => {
    const { prisma } = buildMockPrisma();

    const messages = await listBookingMessagesForActor(prisma as never, adminActor, '55555555-5555-4555-8555-555555555555');

    expect(messages).toHaveLength(1);
    expect(messages[0].kind).toBe('SYSTEM');
  });
});
