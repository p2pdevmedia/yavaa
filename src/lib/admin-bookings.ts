import { type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { actOnBooking, type BookingActor, type BookingRecord } from '@/lib/bookings';
import { canCorrectBookingsOperationally, type PermissionContext } from '@/lib/permissions';

export type AdminBookingActor = PermissionContext;

export const adminBookingCorrectionSchema = z.object({
  action: z.enum(['cancel']),
  reason: z.string().trim().max(1000)
});

export async function correctBookingForAdmin(
  prisma: PrismaClient,
  actor: AdminBookingActor,
  bookingId: string,
  input: z.infer<typeof adminBookingCorrectionSchema>
): Promise<BookingRecord> {
  if (!canCorrectBookingsOperationally(actor)) {
    throw new Error('forbidden');
  }

  const parsed = adminBookingCorrectionSchema.parse(input);
  const reason = parsed.reason.trim();

  if (reason.length < 8) {
    throw new Error('reason-required');
  }

  const booking = await actOnBooking(
    prisma,
    actor as BookingActor,
    bookingId,
    parsed.action,
    reason
  );

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'booking.admin_corrected',
    entityType: 'booking',
    entityId: booking.id,
    metadata: {
      correctionAction: parsed.action,
      reason,
      resultingStatus: booking.status
    }
  });

  return booking;
}
