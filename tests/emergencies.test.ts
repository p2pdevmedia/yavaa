import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordAuditLog } from '@/lib/audit';
import {
  cancelEmergencyRequest,
  createEmergencyRequest,
  listEmergencyRequestsForActor,
  reassignEmergencyRequest,
  respondToEmergencyRequest,
  type EmergencyRequestActor
} from '@/lib/emergencies';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const mockedRecordAuditLog = vi.mocked(recordAuditLog);

afterEach(() => {
  vi.clearAllMocks();
});

const clientActor: EmergencyRequestActor = {
  userId: '11111111-1111-4111-8111-111111111111',
  status: UserStatus.ACTIVE,
  roles: ['client']
};

const contractorActor: EmergencyRequestActor = {
  userId: '22222222-2222-4222-8222-222222222222',
  status: UserStatus.ACTIVE,
  roles: ['contractor']
};

const adminActor: EmergencyRequestActor = {
  userId: '33333333-3333-4333-8333-333333333333',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

function buildMockPrisma() {
  const categoryId = '88888888-8888-4888-8888-888888888888';
  const addressId = '66666666-6666-4666-8666-666666666666';
  const contractorProfileId = '55555555-5555-4555-8555-555555555555';
  const candidateId = '77777777-7777-4777-8777-777777777777';
  const requestId = '44444444-4444-4444-8444-444444444444';

  type MockContractorProfile = {
    id: string;
    userId: string;
    acceptsEmergencies: boolean;
    approvalStatus: string;
    user: {
      id: string;
      email: string;
      displayName: string;
      profile: {
        firstName: string;
        lastName: string;
      };
    };
    categories: Array<{
      categoryId: string;
      category: {
        id: string;
        slug: string;
        name: string;
        group: string;
      };
    }>;
    workZones: Array<{
      workZone: {
        marketId: string;
        market: {
          id: string;
          slug: string;
          city: string;
          province: string;
          country: string;
        };
      };
    }>;
  };

  type MockEmergencyCandidate = {
    id: string;
    contractorProfileId: string;
    dispatchRound: number;
    status: string;
    notifiedAt: Date;
    respondedAt: Date | null;
    responseNote: string | null;
    contractorProfile: MockContractorProfile;
  };

  type MockEmergencyRequestRow = {
    id: string;
    status: string;
    dispatchRound: number;
    expiresAt: Date;
    description: string;
    acceptedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    client: {
      id: string;
      email: string;
      displayName: string;
      profile: {
        firstName: string;
        lastName: string;
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
      postalCode: string;
      market: {
        id: string;
        slug: string;
        city: string;
        province: string;
        country: string;
      };
    };
    assignedContractorProfile: typeof contractorProfile | null;
    candidates: MockEmergencyCandidate[];
  };

  const contractorProfile: MockContractorProfile = {
    id: contractorProfileId,
    userId: contractorActor.userId,
    acceptsEmergencies: true,
    approvalStatus: 'APPROVED',
    user: {
      id: contractorActor.userId,
      email: 'contractor@yavaa.test',
      displayName: 'Contractor One',
      profile: {
        firstName: 'Contractor',
        lastName: 'One'
      }
    },
    categories: [
      {
        categoryId,
        category: {
          id: categoryId,
          slug: 'home-services',
          name: 'Home Services',
          group: 'home services'
        }
      }
    ],
    workZones: [
      {
        workZone: {
          marketId: '99999999-9999-4999-8999-999999999999',
          market: {
            id: '99999999-9999-4999-8999-999999999999',
            slug: 'san-martin-de-los-andes',
            city: 'San Martin de los Andes',
            province: 'Neuquen',
            country: 'Argentina'
          }
        }
      }
    ]
  };

  let requestRow: MockEmergencyRequestRow = {
    id: requestId,
    status: 'DISPATCHING',
    dispatchRound: 1,
    expiresAt: new Date('2026-05-09T12:30:00.000Z'),
    description: 'Pipe burst and water is flooding the kitchen',
    acceptedAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-05-09T12:00:00.000Z'),
    updatedAt: new Date('2026-05-09T12:00:00.000Z'),
    client: {
      id: clientActor.userId,
      email: 'client@yavaa.test',
      displayName: 'Client One',
      profile: {
        firstName: 'Client',
        lastName: 'One'
      }
    },
    category: {
      id: categoryId,
      slug: 'home-services',
      name: 'Home Services'
    },
    address: {
      id: addressId,
      label: 'Home',
      line1: 'Main 123',
      line2: null,
      city: 'Salta',
      province: 'Salta',
      postalCode: '4400',
      market: {
        id: '99999999-9999-4999-8999-999999999999',
        slug: 'san-martin-de-los-andes',
        city: 'San Martin de los Andes',
        province: 'Neuquen',
        country: 'Argentina'
      }
    },
    assignedContractorProfile: null,
    candidates: [
      {
        id: candidateId,
        contractorProfileId,
        dispatchRound: 1,
        status: 'NOTIFIED',
        notifiedAt: new Date('2026-05-09T12:00:00.000Z'),
        respondedAt: null,
        responseNote: null,
        contractorProfile
      }
    ]
  };

  const tx = {
    emergencyRequest: {
      create: vi.fn().mockImplementation(async () => requestRow),
      findMany: vi.fn().mockImplementation(async () => [requestRow]),
      findUnique: vi.fn().mockImplementation(async () => requestRow),
      update: vi.fn().mockImplementation(async ({ data }: { data: { status?: string; assignedContractorProfileId?: string | null; acceptedAt?: Date | null; cancelledAt?: Date | null; dispatchRound?: number; expiresAt?: Date } }) => {
        requestRow = {
          ...requestRow,
          status: data.status ?? requestRow.status,
          assignedContractorProfile:
            data.assignedContractorProfileId === contractorProfileId ? contractorProfile : requestRow.assignedContractorProfile,
          acceptedAt: data.acceptedAt ?? requestRow.acceptedAt,
          cancelledAt: data.cancelledAt ?? requestRow.cancelledAt,
          dispatchRound: data.dispatchRound ?? requestRow.dispatchRound,
          expiresAt: data.expiresAt ?? requestRow.expiresAt
        };

        return requestRow;
      })
    },
    emergencyRequestCandidate: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockImplementation(async ({ data }: { data: { status: string; respondedAt?: Date | null; responseNote?: string | null } }) => {
        requestRow = {
          ...requestRow,
          candidates: requestRow.candidates.map((candidate) =>
            candidate.id === candidateId
              ? {
                  ...candidate,
                  status: data.status,
                  respondedAt: data.respondedAt ?? candidate.respondedAt,
                  responseNote: data.responseNote ?? candidate.responseNote
                }
              : candidate
          )
        };

        return {
          id: candidateId,
          contractorProfileId,
          dispatchRound: 1,
          status: data.status,
          notifiedAt: new Date('2026-05-09T12:00:00.000Z'),
          respondedAt: data.respondedAt ?? null,
          responseNote: data.responseNote ?? null,
          contractorProfile
        };
      }),
      updateMany: vi.fn().mockImplementation(async ({ data }: { data: { status: string } }) => {
        requestRow = {
          ...requestRow,
          candidates: requestRow.candidates.map((candidate) =>
            candidate.status === 'NOTIFIED'
              ? {
                  ...candidate,
                  status: data.status
                }
              : candidate
          )
        };

        return { count: 1 };
      })
    },
    address: {
      findFirst: vi.fn().mockResolvedValue({
        id: addressId,
        marketId: '99999999-9999-4999-8999-999999999999'
      })
    },
    category: {
      findFirst: vi.fn().mockResolvedValue({
        id: categoryId
      })
    },
    contractorProfile: {
      findMany: vi.fn().mockResolvedValue([contractorProfile])
    }
  };

  return {
    tx,
    prisma: {
      address: tx.address,
      category: tx.category,
      contractorProfile: tx.contractorProfile,
      emergencyRequest: tx.emergencyRequest,
      emergencyRequestCandidate: tx.emergencyRequestCandidate,
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx))
    }
  };
}

describe('emergency helpers', () => {
  it('creates an emergency request and dispatches to eligible contractors', async () => {
    const { prisma, tx } = buildMockPrisma();

    const request = await createEmergencyRequest(prisma as never, clientActor, {
      categoryId: '88888888-8888-4888-8888-888888888888',
      addressId: '66666666-6666-4666-8666-666666666666',
      description: 'Pipe burst and water is flooding the kitchen'
    });

    expect(prisma.address.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.category.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.contractorProfile.findMany).toHaveBeenCalledTimes(1);
    expect(tx.emergencyRequest.create).toHaveBeenCalledTimes(1);
    expect(tx.emergencyRequestCandidate.createMany).toHaveBeenCalledTimes(1);
    expect(mockedRecordAuditLog).toHaveBeenCalledTimes(1);
    expect(request.status).toBe('DISPATCHING');
    expect(request.candidates).toHaveLength(1);
  });

  it('lets a contractor accept the emergency and closes the request to others', async () => {
    const { prisma } = buildMockPrisma();

    const request = await respondToEmergencyRequest(
      prisma as never,
      contractorActor,
      '44444444-4444-4444-8444-444444444444',
      'accept'
    );

    expect(prisma.emergencyRequest.findUnique).toHaveBeenCalledTimes(2);
    expect(prisma.emergencyRequest.update).toHaveBeenCalledTimes(1);
    expect(prisma.emergencyRequestCandidate.updateMany).toHaveBeenCalledTimes(1);
    expect(request.status).toBe('ACCEPTED');
    expect(request.assignedContractorProfile?.id).toBe('55555555-5555-4555-8555-555555555555');
  });

  it('lets a client cancel an open emergency request', async () => {
    const { prisma } = buildMockPrisma();

    const request = await cancelEmergencyRequest(
      prisma as never,
      clientActor,
      '44444444-4444-4444-8444-444444444444'
    );

    expect(request.status).toBe('CANCELLED_BY_CLIENT');
    expect(prisma.emergencyRequest.update).toHaveBeenCalledTimes(1);
  });

  it('lets an admin force a reassignment', async () => {
    const { prisma } = buildMockPrisma();

    const request = await reassignEmergencyRequest(
      prisma as never,
      adminActor,
      '44444444-4444-4444-8444-444444444444',
      'No contractor responded in time'
    );

    expect(request.status).toBe('DISPATCHING');
    expect(prisma.contractorProfile.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.emergencyRequestCandidate.createMany).toHaveBeenCalledTimes(1);
  });

  it('lists visible emergencies for the active actor', async () => {
    const { prisma } = buildMockPrisma();

    const requests = await listEmergencyRequestsForActor(prisma as never, clientActor);

    expect(prisma.emergencyRequest.findMany).toHaveBeenCalledTimes(1);
    expect(requests).toHaveLength(1);
  });
});
