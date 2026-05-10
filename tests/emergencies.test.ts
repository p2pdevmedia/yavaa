import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordAuditLog } from '@/lib/audit';
import {
  cancelEmergencyRequest,
  createEmergencyRequest,
  listEmergencyRequestsForActor,
  reassignEmergencyRequest,
  republishEmergencyRequest,
  resolveEmergencyRequest,
  respondToEmergencyRequest,
  updateEmergencyRequest,
  type EmergencyRequestActor
} from '@/lib/emergencies';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const mockedRecordAuditLog = vi.mocked(recordAuditLog);

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
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

function buildMockPrisma(options: { status?: string } = {}) {
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
    resolvedAt: Date | null;
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
    status: options.status ?? 'DISPATCHING',
    dispatchRound: 1,
    expiresAt: new Date('2026-05-09T12:30:00.000Z'),
    description: 'Pipe burst and water is flooding the kitchen',
    acceptedAt: null,
    cancelledAt: null,
    resolvedAt: null,
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
      create: vi.fn().mockImplementation(async ({ data }: { data: { clientUserId: string; categoryId: string; addressId: string; description: string; status: string; dispatchRound: number; expiresAt: Date } }) => {
        requestRow = {
          ...requestRow,
          id: '99999999-9999-4999-8999-000000000001',
          status: data.status,
          dispatchRound: data.dispatchRound,
          expiresAt: data.expiresAt,
          description: data.description,
          acceptedAt: null,
          cancelledAt: null,
          resolvedAt: null,
          category: {
            ...requestRow.category,
            id: data.categoryId
          },
          address: {
            ...requestRow.address,
            id: data.addressId
          },
          candidates: []
        };

        return requestRow;
      }),
      findMany: vi.fn().mockImplementation(async () => [requestRow]),
      findUnique: vi.fn().mockImplementation(async () => requestRow),
      update: vi.fn().mockImplementation(async ({ data }: { data: { status?: string; assignedContractorProfileId?: string | null; acceptedAt?: Date | null; cancelledAt?: Date | null; resolvedAt?: Date | null; dispatchRound?: number; expiresAt?: Date; description?: string; categoryId?: string; addressId?: string } }) => {
        requestRow = {
          ...requestRow,
          status: data.status ?? requestRow.status,
          assignedContractorProfile:
            data.assignedContractorProfileId === contractorProfileId ? contractorProfile : requestRow.assignedContractorProfile,
          acceptedAt: data.acceptedAt ?? requestRow.acceptedAt,
          cancelledAt: data.cancelledAt ?? requestRow.cancelledAt,
          resolvedAt: data.resolvedAt ?? requestRow.resolvedAt,
          dispatchRound: data.dispatchRound ?? requestRow.dispatchRound,
          expiresAt: data.expiresAt ?? requestRow.expiresAt,
          description: data.description ?? requestRow.description,
          category: data.categoryId
            ? {
                id: data.categoryId,
                slug: 'updated-category',
                name: 'Updated Category'
              }
            : requestRow.category,
          address: data.addressId
            ? {
                ...requestRow.address,
                id: data.addressId,
                label: 'Updated Home'
              }
            : requestRow.address
        };

        return requestRow;
      })
    },
    emergencyRequestCandidate: {
      createMany: vi.fn().mockImplementation(async ({ data }: { data: Array<{ emergencyRequestId: string; contractorProfileId: string; dispatchRound: number; status: string; notifiedAt: Date }> }) => {
        requestRow = {
          ...requestRow,
          candidates: data.map((candidateData, index) => ({
            id: index === 0 ? candidateId : `${candidateId}-${index}`,
            contractorProfileId: candidateData.contractorProfileId,
            dispatchRound: candidateData.dispatchRound,
            status: candidateData.status,
            notifiedAt: candidateData.notifiedAt,
            respondedAt: null,
            responseNote: null,
            contractorProfile
          }))
        };

        return { count: data.length };
      }),
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
      findFirst: vi.fn().mockResolvedValue(contractorProfile),
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-09T12:00:00.000Z'));
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
    expect(tx.emergencyRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          expiresAt: new Date('2026-05-10T12:00:00.000Z')
        })
      })
    );
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

  it('lets a client edit their own open emergency request', async () => {
    const { prisma } = buildMockPrisma();

    const request = await updateEmergencyRequest(
      prisma as never,
      clientActor,
      '44444444-4444-4444-8444-444444444444',
      {
        categoryId: '88888888-8888-4888-8888-888888888888',
        addressId: '66666666-6666-4666-8666-666666666666',
        description: 'Updated urgent plumbing issue in the kitchen'
      }
    );

    expect(request.description).toBe('Updated urgent plumbing issue in the kitchen');
    expect(prisma.address.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: '66666666-6666-4666-8666-666666666666',
          userId: clientActor.userId
        })
      })
    );
    expect(mockedRecordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'emergency_request.updated',
        actorUserId: clientActor.userId
      })
    );
  });

  it('lets a client extend their own expired emergency by a full dispatch day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-09T13:00:00.000Z'));
    const { prisma, tx } = buildMockPrisma({ status: 'EXPIRED' });

    const request = await republishEmergencyRequest(
      prisma as never,
      clientActor,
      '44444444-4444-4444-8444-444444444444'
    );

    expect(request.id).toBe('44444444-4444-4444-8444-444444444444');
    expect(request.status).toBe('DISPATCHING');
    expect(request.description).toBe('Pipe burst and water is flooding the kitchen');
    expect(tx.emergencyRequest.create).not.toHaveBeenCalled();
    expect(tx.emergencyRequestCandidate.createMany).toHaveBeenCalledTimes(1);
    expect(tx.emergencyRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DISPATCHING',
          expiresAt: new Date('2026-05-10T13:00:00.000Z')
        })
      })
    );
    expect(mockedRecordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'emergency_request.extended',
        actorUserId: clientActor.userId,
        entityId: '44444444-4444-4444-8444-444444444444',
        metadata: expect.objectContaining({
          extendedEmergencyRequestId: request.id
        })
      })
    );
  });

  it('lets a client delete their own expired emergency request', async () => {
    const { prisma } = buildMockPrisma({ status: 'EXPIRED' });

    const request = await cancelEmergencyRequest(
      prisma as never,
      clientActor,
      '44444444-4444-4444-8444-444444444444'
    );

    expect(request.status).toBe('CANCELLED_BY_CLIENT');
    expect(prisma.emergencyRequest.update).toHaveBeenCalledTimes(1);
  });

  it('lets a client mark their own accepted emergency request as resolved', async () => {
    const { prisma } = buildMockPrisma();

    await respondToEmergencyRequest(
      prisma as never,
      contractorActor,
      '44444444-4444-4444-8444-444444444444',
      'accept'
    );
    vi.clearAllMocks();

    const request = await resolveEmergencyRequest(
      prisma as never,
      clientActor,
      '44444444-4444-4444-8444-444444444444'
    );

    expect(request.status).toBe('RESOLVED_BY_CLIENT');
    expect(prisma.emergencyRequest.update).toHaveBeenCalledTimes(1);
    expect(mockedRecordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'emergency_request.resolved',
        actorUserId: clientActor.userId
      })
    );
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

  it('excludes cancelled emergencies from the client emergency list', async () => {
    const { prisma } = buildMockPrisma();

    await listEmergencyRequestsForActor(prisma as never, clientActor, { mode: 'client' });

    expect(prisma.emergencyRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          clientUserId: clientActor.userId,
          status: {
            not: 'CANCELLED_BY_CLIENT'
          }
        }
      })
    );
  });

  it('does not fall back to the admin-wide emergency list when client mode is unavailable', async () => {
    const { prisma } = buildMockPrisma();

    await listEmergencyRequestsForActor(prisma as never, adminActor, { mode: 'client' });

    expect(prisma.emergencyRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [] }
      })
    );
  });

  it('lists contractor-visible emergencies when a dual-role actor is browsing as contractor', async () => {
    const { prisma } = buildMockPrisma();
    const dualRoleActor: EmergencyRequestActor = {
      ...contractorActor,
      roles: ['client', 'contractor']
    };

    await listEmergencyRequestsForActor(prisma as never, dualRoleActor, { mode: 'contractor' });

    expect(prisma.emergencyRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: expect.arrayContaining([
            expect.objectContaining({
              assignedContractorProfile: {
                userId: dualRoleActor.userId
              }
            }),
            expect.objectContaining({
              candidates: {
                some: {
                  contractorProfile: {
                    userId: dualRoleActor.userId
                  }
                }
              }
            })
          ])
        }
      })
    );
  });

  it('lists compatible open emergencies for contractors before they are dispatch candidates', async () => {
    const { prisma } = buildMockPrisma();

    await listEmergencyRequestsForActor(prisma as never, contractorActor, { mode: 'contractor' });

    expect(prisma.contractorProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: contractorActor.userId,
          approvalStatus: 'APPROVED',
          acceptsEmergencies: true
        })
      })
    );
    expect(prisma.emergencyRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: expect.arrayContaining([
            expect.objectContaining({
              assignedContractorProfile: {
                userId: contractorActor.userId
              }
            }),
            expect.objectContaining({
              candidates: {
                some: {
                  contractorProfile: {
                    userId: contractorActor.userId
                  }
                }
              }
            }),
            expect.objectContaining({
              status: {
                in: ['OPEN', 'DISPATCHING', 'REASSIGNMENT_NEEDED']
              },
              assignedContractorProfileId: null,
              categoryId: {
                in: ['88888888-8888-4888-8888-888888888888']
              },
              address: {
                marketId: {
                  in: ['99999999-9999-4999-8999-999999999999']
                }
              }
            })
          ])
        }
      })
    );
  });
});
