import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordAuditLog } from '@/lib/audit';
import { actOnBooking, createScheduledBooking, listBookingsForActor, type BookingActor } from '@/lib/bookings';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const mockedRecordAuditLog = vi.mocked(recordAuditLog);

afterEach(() => {
  vi.clearAllMocks();
});

const clientActor: BookingActor = {
  userId: '11111111-1111-4111-8111-111111111111',
  status: UserStatus.ACTIVE,
  roles: ['client']
};

const contractorActor: BookingActor = {
  userId: '22222222-2222-4222-8222-222222222222',
  status: UserStatus.ACTIVE,
  roles: ['contractor']
};

const adminActor: BookingActor = {
  userId: '33333333-3333-4333-8333-333333333333',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

function buildMockPrisma() {
  const bookingRow = {
    id: '44444444-4444-4444-8444-444444444444',
    status: 'PENDING_ACCEPTANCE',
    scheduledFor: new Date('2026-05-10T10:00:00.000Z'),
    description: 'Fix a leaking faucet',
    contractorNote: null,
    decisionReason: null,
    rescheduleRequestedAt: null,
    acceptedAt: null,
    rejectedAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-05-09T10:00:00.000Z'),
    updatedAt: new Date('2026-05-09T10:00:00.000Z'),
    client: {
      id: clientActor.userId,
      email: 'client@yavaa.test',
      displayName: 'Client One',
      profile: {
        firstName: 'Client',
        lastName: 'One'
      }
    },
    contractorProfile: {
      id: '55555555-5555-4555-8555-555555555555',
      user: {
        id: contractorActor.userId,
        email: 'contractor@yavaa.test',
        displayName: 'Contractor One',
        profile: {
          firstName: 'Contractor',
          lastName: 'One'
        }
      }
    },
    category: {
      id: '88888888-8888-4888-8888-888888888888',
      slug: 'plumbing',
      name: 'Plumbing'
    },
    address: {
      id: '66666666-6666-4666-8666-666666666666',
      label: 'Home',
      line1: 'Main 123',
      line2: null,
      city: 'Salta',
      province: 'Salta',
      postalCode: '4400',
      market: {
        id: '77777777-7777-4777-8777-777777777777',
        slug: 'salta',
        city: 'Salta',
        province: 'Salta',
        country: 'Argentina'
      }
    }
  };

  const tx = {
    booking: {
      create: vi.fn().mockResolvedValue(bookingRow),
      update: vi.fn().mockImplementation(async ({ data }: { data: Partial<typeof bookingRow> }) => ({
        ...bookingRow,
        ...data
      }))
    },
    bookingMessage: {
      create: vi.fn().mockImplementation(async ({ data }: { data: { bookingId: string; senderUserId: string | null; kind: string; systemEvent: string | null; body: string } }) => ({
        id: `message_${data.kind.toLowerCase()}`,
        bookingId: data.bookingId,
        senderUserId: data.senderUserId,
        kind: data.kind,
        systemEvent: data.systemEvent,
        body: data.body,
        createdAt: new Date('2026-05-09T10:00:00.000Z'),
        updatedAt: new Date('2026-05-09T10:00:00.000Z'),
        senderUser: data.senderUserId
          ? {
              id: data.senderUserId,
              email: 'contractor@yavaa.test',
              displayName: 'Contractor One',
              profile: {
                firstName: 'Contractor',
                lastName: 'One'
              }
            }
          : null
      }))
    }
  };

  return {
    bookingRow,
    tx,
    prisma: {
      address: {
        findFirst: vi.fn().mockResolvedValue({
          id: '66666666-6666-4666-8666-666666666666',
          marketId: '77777777-7777-4777-8777-777777777777'
        })
      },
      contractorProfile: {
        findFirst: vi.fn().mockResolvedValue({
          id: '55555555-5555-4555-8555-555555555555',
          userId: contractorActor.userId,
          user: {
            status: UserStatus.ACTIVE
          },
          workZones: [
            {
              workZone: {
                marketId: '77777777-7777-4777-8777-777777777777'
              }
            }
          ]
        })
      },
      category: {
        findFirst: vi.fn().mockResolvedValue({
          id: '88888888-8888-4888-8888-888888888888'
        })
      },
      booking: {
        findMany: vi.fn().mockResolvedValue([bookingRow]),
        findUnique: vi.fn().mockResolvedValue(bookingRow)
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx))
    }
  };
}

describe('bookings helpers', () => {
  it('creates a scheduled booking for an approved contractor and matching address market', async () => {
    const { prisma, tx, bookingRow } = buildMockPrisma();

    const booking = await createScheduledBooking(prisma as never, clientActor, {
      contractorProfileId: '55555555-5555-4555-8555-555555555555',
      categoryId: '88888888-8888-4888-8888-888888888888',
      addressId: '66666666-6666-4666-8666-666666666666',
      scheduledFor: new Date('2026-05-10T10:00:00.000Z'),
      description: 'Fix a leaking faucet'
    });

    expect(prisma.address.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.contractorProfile.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.category.findFirst).toHaveBeenCalledTimes(1);
    expect(tx.booking.create).toHaveBeenCalledTimes(1);
    expect(tx.bookingMessage.create).toHaveBeenCalledTimes(1);
    expect(mockedRecordAuditLog).toHaveBeenCalledTimes(1);
    expect(booking).toMatchObject({
      id: bookingRow.id,
      status: 'PENDING_ACCEPTANCE',
      contractorProfile: {
        id: '55555555-5555-4555-8555-555555555555'
      }
    });
  });

  it('rejects a contractor that does not cover the selected market', async () => {
    const { prisma } = buildMockPrisma();

    vi.mocked(prisma.contractorProfile.findFirst).mockResolvedValueOnce({
      id: '55555555-5555-4555-8555-555555555555',
      userId: contractorActor.userId,
      user: {
        status: UserStatus.ACTIVE
      },
      workZones: []
    });

    await expect(
      createScheduledBooking(prisma as never, clientActor, {
        contractorProfileId: '55555555-5555-4555-8555-555555555555',
        categoryId: '88888888-8888-4888-8888-888888888888',
        addressId: '66666666-6666-4666-8666-666666666666',
        scheduledFor: new Date('2026-05-10T10:00:00.000Z'),
        description: 'Fix a leaking faucet'
      })
    ).rejects.toThrow('invalid-contractor-market');
  });

  it('lets an active contractor accept a pending booking', async () => {
    const { prisma, tx } = buildMockPrisma();

    const booking = await actOnBooking(
      prisma as never,
      contractorActor,
      '44444444-4444-4444-8444-444444444444',
      'accept'
    );

    expect(prisma.booking.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.bookingMessage.create).toHaveBeenCalledTimes(1);
    expect(booking.status).toBe('ACCEPTED');
    expect(booking.acceptedAt).toBeInstanceOf(Date);
  });

  it('lists all bookings for an active admin', async () => {
    const { prisma } = buildMockPrisma();

    const bookings = await listBookingsForActor(prisma as never, adminActor);

    expect(prisma.booking.findMany).toHaveBeenCalledTimes(1);
    expect(bookings).toHaveLength(1);
  });

  it('lets an active admin cancel a booking', async () => {
    const { prisma, tx } = buildMockPrisma();

    const booking = await actOnBooking(
      prisma as never,
      adminActor,
      '44444444-4444-4444-8444-444444444444',
      'cancel',
      'Admin override'
    );

    expect(booking.status).toBe('CANCELLED_BY_CLIENT');
    expect(booking.cancelledAt).toBeInstanceOf(Date);
    expect(booking.decisionReason).toBe('Admin override');
    expect(tx.bookingMessage.create).toHaveBeenCalledTimes(1);
  });
});
