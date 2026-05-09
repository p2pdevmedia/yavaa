import { UserStatus, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { createBookingSystemMessage } from '@/lib/booking-communication';
import { hasAnyRole, hasRole, type PermissionContext } from '@/lib/permissions';

export const bookingActions = ['accept', 'reject', 'cancel', 'request_reschedule'] as const;
export type BookingAction = (typeof bookingActions)[number];

export const bookingStatuses = [
  'PENDING_ACCEPTANCE',
  'ACCEPTED',
  'REJECTED_BY_CONTRACTOR',
  'CANCELLED_BY_CLIENT',
  'RESCHEDULE_REQUESTED'
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export const createScheduledBookingSchema = z.object({
  contractorProfileId: z.string().uuid(),
  categoryId: z.string().uuid(),
  addressId: z.string().uuid(),
  scheduledFor: z.coerce.date(),
  description: z.string().trim().min(8).max(1000)
});

export const bookingActionSchema = z.object({
  action: z.enum(bookingActions),
  note: z.string().trim().max(500).nullable().optional()
});

export type BookingRecord = {
  id: string;
  status: BookingStatus;
  scheduledFor: Date;
  description: string;
  contractorNote: string | null;
  decisionReason: string | null;
  rescheduleRequestedAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    email: string;
    displayName: string | null;
    profile: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  contractorProfile: {
    id: string;
    user: {
      id: string;
      email: string;
      displayName: string | null;
      profile: {
        firstName: string | null;
        lastName: string | null;
      } | null;
    };
  };
  category: {
    id: string;
    slug: string;
    name: string;
  };
  address: {
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    market: {
      id: string;
      slug: string;
      city: string;
      province: string;
      country: string;
    } | null;
  };
};

export type BookingActor = PermissionContext;

type BookingRow = {
  id: string;
  status: BookingStatus;
  scheduledFor: Date;
  description: string;
  contractorNote: string | null;
  decisionReason: string | null;
  rescheduleRequestedAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    email: string;
    displayName: string | null;
    profile: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  contractorProfile: {
    id: string;
    user: {
      id: string;
      email: string;
      displayName: string | null;
      profile: {
        firstName: string | null;
        lastName: string | null;
      } | null;
    };
  };
  category: {
    id: string;
    slug: string;
    name: string;
  };
  address: {
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    market: {
      id: string;
      slug: string;
      city: string;
      province: string;
      country: string;
    } | null;
  };
};

const bookingSelect = {
  id: true,
  status: true,
  scheduledFor: true,
  description: true,
  contractorNote: true,
  decisionReason: true,
  rescheduleRequestedAt: true,
  acceptedAt: true,
  rejectedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      email: true,
      displayName: true,
      profile: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  },
  contractorProfile: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  },
  category: {
    select: {
      id: true,
      slug: true,
      name: true
    }
  },
  address: {
    select: {
      id: true,
      label: true,
      line1: true,
      line2: true,
      city: true,
      province: true,
      postalCode: true,
      market: {
        select: {
          id: true,
          slug: true,
          city: true,
          province: true,
          country: true
        }
      }
    }
  }
} as const;

function mapBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    status: row.status,
    scheduledFor: row.scheduledFor,
    description: row.description,
    contractorNote: row.contractorNote,
    decisionReason: row.decisionReason,
    rescheduleRequestedAt: row.rescheduleRequestedAt,
    acceptedAt: row.acceptedAt,
    rejectedAt: row.rejectedAt,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    client: row.client,
    contractorProfile: row.contractorProfile,
    category: row.category,
    address: row.address
  };
}

function isClientActor(actor: BookingActor): boolean {
  return actor.status === UserStatus.ACTIVE && hasRole(actor, 'client');
}

function isContractorActor(actor: BookingActor): boolean {
  return actor.status === UserStatus.ACTIVE && hasRole(actor, 'contractor');
}

function isAdminActor(actor: BookingActor): boolean {
  return actor.status === UserStatus.ACTIVE && hasRole(actor, 'admin');
}

function canViewBooking(actor: BookingActor, booking: { clientUserId: string; contractorProfile: { userId: string } }): boolean {
  return (
    actor.status === UserStatus.ACTIVE &&
    (hasAnyRole(actor, ['admin']) ||
      booking.clientUserId === actor.userId ||
      booking.contractorProfile.userId === actor.userId)
  );
}

function canModifyBookingAsClient(actor: BookingActor, booking: { clientUserId: string }): boolean {
  return actor.status === UserStatus.ACTIVE && hasRole(actor, 'client') && booking.clientUserId === actor.userId;
}

function canModifyBookingAsContractor(actor: BookingActor, booking: { contractorProfile: { userId: string } }): boolean {
  return (
    actor.status === UserStatus.ACTIVE &&
    hasRole(actor, 'contractor') &&
    booking.contractorProfile.userId === actor.userId
  );
}

function getBookingSystemEventAndBody(action: BookingAction): { systemEvent: string; body: string } {
  if (action === 'accept') {
    return {
      systemEvent: 'booking.accepted',
      body: 'Booking accepted by contractor.'
    };
  }

  if (action === 'reject') {
    return {
      systemEvent: 'booking.rejected',
      body: 'Booking rejected by contractor.'
    };
  }

  if (action === 'cancel') {
    return {
      systemEvent: 'booking.cancelled',
      body: 'Booking cancelled.'
    };
  }

  return {
    systemEvent: 'booking.reschedule_requested',
    body: 'Reschedule requested by contractor.'
  };
}

export async function listBookingsForActor(prisma: PrismaClient, actor: BookingActor): Promise<BookingRecord[]> {
  const rows = (await prisma.booking.findMany({
    where: isAdminActor(actor)
      ? undefined
      : {
          OR: [
            { clientUserId: actor.userId },
            { contractorProfile: { userId: actor.userId } }
          ]
        },
    orderBy: [
      { scheduledFor: 'desc' },
      { createdAt: 'desc' }
    ],
    select: bookingSelect
  })) as BookingRow[];

  return rows.map(mapBooking);
}

export async function getBookingForActor(
  prisma: PrismaClient,
  actor: BookingActor,
  bookingId: string
): Promise<BookingRecord | null> {
  const row = (await prisma.booking.findUnique({
    where: { id: bookingId },
    select: bookingSelect
  })) as BookingRow | null;

  if (!row) {
    return null;
  }

  if (!canViewBooking(actor, { clientUserId: row.client.id, contractorProfile: { userId: row.contractorProfile.user.id } })) {
    return null;
  }

  return mapBooking(row);
}

export async function createScheduledBooking(
  prisma: PrismaClient,
  actor: BookingActor,
  input: z.infer<typeof createScheduledBookingSchema>
): Promise<BookingRecord> {
  if (!isClientActor(actor)) {
    throw new Error('forbidden');
  }

  const parsed = createScheduledBookingSchema.parse(input);

  const [address, contractorProfile, category] = await Promise.all([
    prisma.address.findFirst({
      where: {
        id: parsed.addressId,
        userId: actor.userId
      },
      select: {
        id: true,
        marketId: true
      }
    }),
    prisma.contractorProfile.findFirst({
      where: {
        id: parsed.contractorProfileId,
        approvalStatus: 'APPROVED',
        user: {
          status: UserStatus.ACTIVE
        },
        categories: {
          some: {
            categoryId: parsed.categoryId
          }
        }
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            status: true
          }
        },
        workZones: {
          select: {
            workZone: {
              select: {
                marketId: true
              }
            }
          }
        }
      }
    }),
    prisma.category.findFirst({
      where: {
        id: parsed.categoryId,
        status: 'ACTIVE'
      },
      select: {
        id: true
      }
    })
  ]);

  if (!address) {
    throw new Error('invalid-address');
  }

  if (!category) {
    throw new Error('invalid-category');
  }

  if (!contractorProfile) {
    throw new Error('invalid-contractor');
  }

  if (!address.marketId) {
    throw new Error('invalid-address-market');
  }

  const contractorSupportsMarket = contractorProfile.workZones.some(
    (link) => link.workZone.marketId === address.marketId
  );

  if (!contractorSupportsMarket) {
    throw new Error('invalid-contractor-market');
  }

  const created = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        clientUserId: actor.userId,
        contractorProfileId: contractorProfile.id,
        categoryId: category.id,
        addressId: address.id,
        scheduledFor: parsed.scheduledFor,
        description: parsed.description,
        status: 'PENDING_ACCEPTANCE'
      },
      select: bookingSelect
    });

    await createBookingSystemMessage(
      tx as PrismaClient,
      booking.id,
      'booking.created',
      'Booking created.'
    );

    await recordAuditLog({
      actorUserId: actor.userId,
      action: 'booking.created',
      entityType: 'booking',
      entityId: booking.id,
      metadata: {
        contractorProfileId: contractorProfile.id,
        categoryId: category.id,
        addressId: address.id,
        scheduledFor: parsed.scheduledFor.toISOString()
      }
    });

    return booking;
  });

  return mapBooking(created as BookingRow);
}

export async function actOnBooking(
  prisma: PrismaClient,
  actor: BookingActor,
  bookingId: string,
  action: BookingAction,
  note?: string | null
): Promise<BookingRecord> {
  const row = (await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      scheduledFor: true,
      description: true,
      contractorNote: true,
      decisionReason: true,
      rescheduleRequestedAt: true,
      acceptedAt: true,
      rejectedAt: true,
      cancelledAt: true,
      createdAt: true,
      updatedAt: true,
      clientUserId: true,
      client: {
        select: {
          id: true,
          email: true,
          displayName: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      contractorProfile: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      },
      category: {
        select: {
          id: true,
          slug: true,
          name: true
        }
      },
      address: {
        select: {
          id: true,
          label: true,
          line1: true,
          line2: true,
          city: true,
          province: true,
          postalCode: true,
          market: {
            select: {
              id: true,
              slug: true,
              city: true,
              province: true,
              country: true
            }
          }
        }
      }
    }
  })) as BookingRow | null;

  if (!row) {
    throw new Error('booking-not-found');
  }

  const isParticipant = canViewBooking(actor, {
    clientUserId: row.client.id,
    contractorProfile: { userId: row.contractorProfile.user.id }
  });

  if (!isParticipant) {
    throw new Error('forbidden');
  }

  const now = new Date();
  const updateData: {
    status?: BookingStatus;
    contractorNote?: string | null;
    decisionReason?: string | null;
    rescheduleRequestedAt?: Date | null;
    acceptedAt?: Date | null;
    rejectedAt?: Date | null;
    cancelledAt?: Date | null;
  } = {};

  if (action === 'cancel') {
    if (!canModifyBookingAsClient(actor, { clientUserId: row.client.id }) && !isAdminActor(actor)) {
      throw new Error('forbidden');
    }

    if (!['PENDING_ACCEPTANCE', 'ACCEPTED', 'RESCHEDULE_REQUESTED'].includes(row.status)) {
      throw new Error('invalid-state');
    }

    updateData.status = 'CANCELLED_BY_CLIENT';
    updateData.cancelledAt = now;
    updateData.decisionReason = note ?? row.decisionReason;
  }

  if (action === 'accept') {
    if (!canModifyBookingAsContractor(actor, { contractorProfile: { userId: row.contractorProfile.user.id } })) {
      throw new Error('forbidden');
    }

    if (row.status !== 'PENDING_ACCEPTANCE') {
      throw new Error('invalid-state');
    }

    updateData.status = 'ACCEPTED';
    updateData.acceptedAt = now;
    updateData.contractorNote = note ?? row.contractorNote;
  }

  if (action === 'reject') {
    if (!canModifyBookingAsContractor(actor, { contractorProfile: { userId: row.contractorProfile.user.id } })) {
      throw new Error('forbidden');
    }

    if (row.status !== 'PENDING_ACCEPTANCE') {
      throw new Error('invalid-state');
    }

    updateData.status = 'REJECTED_BY_CONTRACTOR';
    updateData.rejectedAt = now;
    updateData.decisionReason = note ?? row.decisionReason;
  }

  if (action === 'request_reschedule') {
    if (!canModifyBookingAsContractor(actor, { contractorProfile: { userId: row.contractorProfile.user.id } })) {
      throw new Error('forbidden');
    }

    if (!['PENDING_ACCEPTANCE', 'ACCEPTED'].includes(row.status)) {
      throw new Error('invalid-state');
    }

    updateData.status = 'RESCHEDULE_REQUESTED';
    updateData.rescheduleRequestedAt = now;
    updateData.decisionReason = note ?? row.decisionReason;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: updateData,
      select: bookingSelect
    });

    const systemEvent = getBookingSystemEventAndBody(action);

    await createBookingSystemMessage(
      tx as PrismaClient,
      booking.id,
      systemEvent.systemEvent,
      systemEvent.body
    );

    await recordAuditLog({
      actorUserId: actor.userId,
      action: `booking.${action}`,
      entityType: 'booking',
      entityId: booking.id,
      metadata: {
        status: updateData.status,
        note: note ?? null
      }
    });

    return booking;
  });

  return mapBooking(updated as BookingRow);
}
