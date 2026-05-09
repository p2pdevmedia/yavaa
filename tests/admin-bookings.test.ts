import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  correctBookingForAdmin,
  type AdminBookingActor
} from '@/lib/admin-bookings';
import { recordAuditLog } from '@/lib/audit';
import { actOnBooking } from '@/lib/bookings';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

vi.mock('@/lib/bookings', () => ({
  actOnBooking: vi.fn()
}));

const activeAdmin: AdminBookingActor = {
  userId: 'admin_001',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

const activeSupport: AdminBookingActor = {
  userId: 'support_001',
  status: UserStatus.ACTIVE,
  roles: ['support']
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('admin booking corrections', () => {
  it('cancels a booking through the durable booking action flow and records an admin audit log', async () => {
    const booking = {
      id: 'booking_001',
      status: 'CANCELLED_BY_CLIENT'
    };

    vi.mocked(actOnBooking).mockResolvedValue(booking as never);

    const result = await correctBookingForAdmin({} as never, activeAdmin, 'booking_001', {
      action: 'cancel',
      reason: 'Client and contractor agreed to close the conflicted booking.'
    });

    expect(actOnBooking).toHaveBeenCalledWith(
      {},
      activeAdmin,
      'booking_001',
      'cancel',
      'Client and contractor agreed to close the conflicted booking.'
    );
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'booking.admin_corrected',
      entityType: 'booking',
      entityId: 'booking_001',
      metadata: {
        correctionAction: 'cancel',
        reason: 'Client and contractor agreed to close the conflicted booking.',
        resultingStatus: 'CANCELLED_BY_CLIENT'
      }
    });
    expect(result).toBe(booking);
  });

  it('requires an active admin actor', async () => {
    await expect(
      correctBookingForAdmin({} as never, activeSupport, 'booking_001', {
        action: 'cancel',
        reason: 'Support cannot force operational corrections.'
      })
    ).rejects.toThrow('forbidden');
  });

  it('requires a reason for every correction', async () => {
    await expect(
      correctBookingForAdmin({} as never, activeAdmin, 'booking_001', {
        action: 'cancel',
        reason: ''
      })
    ).rejects.toThrow('reason-required');
  });
});
