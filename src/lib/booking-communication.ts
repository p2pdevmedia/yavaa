import { Prisma, UserStatus, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import {
  canViewBookingConversation,
  canWriteBookingConversation,
  type PermissionContext
} from '@/lib/permissions';

export const bookingMessageKinds = ['USER', 'SYSTEM'] as const;
export type BookingMessageKind = (typeof bookingMessageKinds)[number];

export const bookingFilePurposes = ['CHAT_ATTACHMENT', 'PROBLEM_PHOTO', 'PAYMENT_PROOF'] as const;
export type BookingFilePurpose = (typeof bookingFilePurposes)[number];

export const bookingMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000)
});

export const bookingFileSchema = z.object({
  purpose: z.enum(bookingFilePurposes),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  storageKey: z.string().trim().min(1).max(512),
  storageUrl: z.string().url().nullable().optional(),
  sizeBytes: z.number().int().positive().nullable().optional(),
  messageId: z.string().uuid().nullable().optional()
});

export type BookingCommunicationActor = PermissionContext;

const bookingAccessSelect = Prisma.validator<Prisma.BookingSelect>()({
  id: true,
  clientUserId: true,
  contractorProfile: {
    select: {
      userId: true
    }
  }
});

const bookingUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  displayName: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      avatarUrl: true
    }
  }
});

const bookingMessageSelect = Prisma.validator<Prisma.BookingMessageSelect>()({
  id: true,
  bookingId: true,
  senderUserId: true,
  kind: true,
  systemEvent: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  senderUser: {
    select: bookingUserSelect
  }
});

const bookingFileSelect = Prisma.validator<Prisma.BookingFileSelect>()({
  id: true,
  bookingId: true,
  messageId: true,
  uploadedByUserId: true,
  purpose: true,
  fileName: true,
  mimeType: true,
  storageKey: true,
  storageUrl: true,
  sizeBytes: true,
  createdAt: true,
  updatedAt: true,
  uploadedByUser: {
    select: bookingUserSelect
  }
});

type BookingAccessRow = Prisma.BookingGetPayload<{ select: typeof bookingAccessSelect }>;
type BookingMessageRow = Prisma.BookingMessageGetPayload<{ select: typeof bookingMessageSelect }>;
type BookingFileRow = Prisma.BookingFileGetPayload<{ select: typeof bookingFileSelect }>;

export type BookingConversationUser = Prisma.UserGetPayload<{ select: typeof bookingUserSelect }>;

export type BookingMessageRecord = BookingMessageRow;
export type BookingFileRecord = BookingFileRow;

function isActiveActor(actor: BookingCommunicationActor): boolean {
  return actor.status === UserStatus.ACTIVE;
}

async function loadBookingAccess(prisma: PrismaClient, bookingId: string): Promise<BookingAccessRow | null> {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: bookingAccessSelect
  });
}

function assertCanViewConversation(actor: BookingCommunicationActor, booking: BookingAccessRow): void {
  if (!canViewBookingConversation(actor, booking)) {
    throw new Error('forbidden');
  }
}

function assertCanWriteConversation(actor: BookingCommunicationActor, booking: BookingAccessRow): void {
  if (!canWriteBookingConversation(actor, booking)) {
    throw new Error('forbidden');
  }
}

export async function listBookingMessagesForActor(
  prisma: PrismaClient,
  actor: BookingCommunicationActor,
  bookingId: string
): Promise<BookingMessageRecord[]> {
  if (!isActiveActor(actor)) {
    throw new Error('forbidden');
  }

  const booking = await loadBookingAccess(prisma, bookingId);

  if (!booking) {
    throw new Error('not-found');
  }

  assertCanViewConversation(actor, booking);

  return prisma.bookingMessage.findMany({
    where: {
      bookingId
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' }
    ],
    select: bookingMessageSelect
  });
}

export async function createBookingSystemMessage(
  prisma: PrismaClient,
  bookingId: string,
  systemEvent: string,
  body: string
): Promise<BookingMessageRecord> {
  return prisma.bookingMessage.create({
    data: {
      bookingId,
      senderUserId: null,
      kind: 'SYSTEM',
      systemEvent,
      body
    },
    select: bookingMessageSelect
  });
}

export async function sendBookingMessage(
  prisma: PrismaClient,
  actor: BookingCommunicationActor,
  bookingId: string,
  input: z.infer<typeof bookingMessageSchema>
): Promise<BookingMessageRecord> {
  if (!isActiveActor(actor)) {
    throw new Error('forbidden');
  }

  const parsed = bookingMessageSchema.parse(input);
  const booking = await loadBookingAccess(prisma, bookingId);

  if (!booking) {
    throw new Error('not-found');
  }

  assertCanWriteConversation(actor, booking);

  const message = await prisma.bookingMessage.create({
    data: {
      bookingId,
      senderUserId: actor.userId,
      kind: 'USER',
      systemEvent: null,
      body: parsed.body
    },
    select: bookingMessageSelect
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'booking_message.created',
    entityType: 'booking_message',
    entityId: message.id,
    metadata: {
      bookingId
    }
  });

  return message;
}

export async function listBookingFilesForActor(
  prisma: PrismaClient,
  actor: BookingCommunicationActor,
  bookingId: string
): Promise<BookingFileRecord[]> {
  if (!isActiveActor(actor)) {
    throw new Error('forbidden');
  }

  const booking = await loadBookingAccess(prisma, bookingId);

  if (!booking) {
    throw new Error('not-found');
  }

  assertCanViewConversation(actor, booking);

  return prisma.bookingFile.findMany({
    where: {
      bookingId
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' }
    ],
    select: bookingFileSelect
  });
}

export async function registerBookingFile(
  prisma: PrismaClient,
  actor: BookingCommunicationActor,
  bookingId: string,
  input: z.infer<typeof bookingFileSchema>
): Promise<BookingFileRecord> {
  if (!isActiveActor(actor)) {
    throw new Error('forbidden');
  }

  const parsed = bookingFileSchema.parse(input);
  const booking = await loadBookingAccess(prisma, bookingId);

  if (!booking) {
    throw new Error('not-found');
  }

  assertCanWriteConversation(actor, booking);

  const file = await prisma.bookingFile.create({
    data: {
      bookingId,
      messageId: parsed.messageId ?? undefined,
      uploadedByUserId: actor.userId,
      purpose: parsed.purpose,
      fileName: parsed.fileName,
      mimeType: parsed.mimeType,
      storageKey: parsed.storageKey,
      storageUrl: parsed.storageUrl ?? undefined,
      sizeBytes: parsed.sizeBytes ?? undefined
    },
    select: bookingFileSelect
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'booking_file.created',
    entityType: 'booking_file',
    entityId: file.id,
    metadata: {
      bookingId,
      purpose: parsed.purpose,
      messageId: parsed.messageId ?? null,
      storageKey: parsed.storageKey
    }
  });

  return file;
}
