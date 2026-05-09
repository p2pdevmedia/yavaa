import { PrismaPg } from '@prisma/adapter-pg';
import {
  AddressType,
  ContractorApprovalStatus,
  PrismaClient,
  UserStatus
} from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl
  })
});

const seedRoles = [
  { slug: 'client', name: 'Client', description: 'Requests services and manages bookings.' },
  { slug: 'contractor', name: 'Contractor', description: 'Offers services and accepts work.' },
  { slug: 'admin', name: 'Admin', description: 'Operates moderation, approvals, and support.' },
  { slug: 'support', name: 'Support', description: 'Helps with operational follow-up.' }
];

const seedMarket = {
  slug: 'san-martin-de-los-andes',
  country: 'Argentina',
  province: 'Neuquen',
  city: 'San Martin de los Andes',
  isPrimary: true
};

const seedWorkZones = [
  {
    slug: 'central',
    name: 'Centro',
    description: 'Zona central de San Martin de los Andes'
  }
];

const seedCategories = [
  { slug: 'construction', name: 'Construction', group: 'construction' },
  { slug: 'home-services', name: 'Home Services', group: 'home services' },
  { slug: 'psychologists', name: 'Psychologists', group: 'health' },
  { slug: 'teachers', name: 'Teachers', group: 'education' },
  { slug: 'massage-therapists', name: 'Massage Therapists', group: 'wellness' },
  { slug: 'wellness', name: 'Wellness', group: 'wellness' },
  { slug: 'delivery', name: 'Delivery', group: 'logistics' },
  { slug: 'errands', name: 'Errands', group: 'assistance' },
  { slug: 'technology', name: 'Technology', group: 'technology' }
];

async function main() {
  await prisma.market.upsert({
    where: { slug: seedMarket.slug },
    update: {
      country: seedMarket.country,
      province: seedMarket.province,
      city: seedMarket.city,
      isPrimary: seedMarket.isPrimary
    },
    create: seedMarket
  });

  const market = await prisma.market.findUnique({
    where: { slug: seedMarket.slug }
  });

  if (!market) {
    throw new Error('Seed market could not be loaded.');
  }

  await Promise.all(
    seedWorkZones.map((workZone) =>
      prisma.workZone.upsert({
        where: {
          marketId_slug: {
            marketId: market.id,
            slug: workZone.slug
          }
        },
        update: {
          name: workZone.name,
          description: workZone.description
        },
        create: {
          marketId: market.id,
          slug: workZone.slug,
          name: workZone.name,
          description: workZone.description
        }
      })
    )
  );

  await Promise.all(
    seedCategories.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          group: category.group,
          status: 'ACTIVE',
          isInitial: true
        },
        create: {
          slug: category.slug,
          name: category.name,
          group: category.group,
          status: 'ACTIVE',
          isInitial: true
        }
      })
    )
  );

  const roles = await Promise.all(
    seedRoles.map((role) =>
      prisma.role.upsert({
        where: { slug: role.slug },
        update: {
          name: role.name,
          description: role.description
        },
        create: {
          slug: role.slug,
          name: role.name,
          description: role.description
        }
      })
    )
  );

  const foundationAdmin = await prisma.user.upsert({
    where: { email: 'foundation-admin@yavaa.test' },
    update: {
      displayName: 'Foundation Admin',
      status: UserStatus.ACTIVE
    },
    create: {
      email: 'foundation-admin@yavaa.test',
      displayName: 'Foundation Admin',
      status: UserStatus.ACTIVE
    }
  });

  await prisma.profile.upsert({
    where: { userId: foundationAdmin.id },
    update: {
      firstName: 'Foundation',
      lastName: 'Admin',
      bio: 'Deterministic seed account for stage 1 validation.'
    },
    create: {
      userId: foundationAdmin.id,
      firstName: 'Foundation',
      lastName: 'Admin',
      bio: 'Deterministic seed account for stage 1 validation.'
    }
  });

  const foundationContractor = await prisma.user.upsert({
    where: { email: 'foundation-contractor@yavaa.test' },
    update: {
      displayName: 'Foundation Contractor',
      status: UserStatus.ACTIVE
    },
    create: {
      email: 'foundation-contractor@yavaa.test',
      displayName: 'Foundation Contractor',
      status: UserStatus.ACTIVE
    }
  });

  await prisma.profile.upsert({
    where: { userId: foundationContractor.id },
    update: {
      firstName: 'Carlos',
      lastName: 'Perez',
      phone: '+54 9 2972 555000',
      bio: 'Deterministic seed contractor account for stage 2 validation.'
    },
    create: {
      userId: foundationContractor.id,
      firstName: 'Carlos',
      lastName: 'Perez',
      phone: '+54 9 2972 555000',
      bio: 'Deterministic seed contractor account for stage 2 validation.'
    }
  });

  const adminRole = roles.find((role) => role.slug === 'admin');
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: foundationAdmin.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: foundationAdmin.id,
        roleId: adminRole.id
      }
    });
  }

  const contractorRole = roles.find((role) => role.slug === 'contractor');
  if (contractorRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: foundationContractor.id,
          roleId: contractorRole.id
        }
      },
      update: {},
      create: {
        userId: foundationContractor.id,
        roleId: contractorRole.id
      }
    });
  }

  const contractorAddress = await prisma.address.upsert({
    where: {
      id: '11111111-1111-1111-1111-111111111111'
    },
    update: {
      label: 'Main workshop',
      line1: 'Av. San Martin 123',
      city: market.city,
      province: market.province,
      postalCode: '8370',
      notes: 'Primary contractor address used for stage 2 validation.',
      type: AddressType.WORK,
      isDefault: true,
      marketId: market.id
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      userId: foundationContractor.id,
      marketId: market.id,
      label: 'Main workshop',
      line1: 'Av. San Martin 123',
      city: market.city,
      province: market.province,
      postalCode: '8370',
      notes: 'Primary contractor address used for stage 2 validation.',
      type: AddressType.WORK,
      isDefault: true
    }
  });

  const contractorProfile = await prisma.contractorProfile.upsert({
    where: { userId: foundationContractor.id },
    update: {
      addressId: contractorAddress.id,
      approvalStatus: ContractorApprovalStatus.PENDING_REVIEW,
      dniNumber: '12345678',
      dniFrontUrl: 'https://example.com/seeds/dni-front.jpg',
      dniBackUrl: 'https://example.com/seeds/dni-back.jpg',
      profilePhotoUrl: 'https://example.com/seeds/profile-photo.jpg',
      reviewNotes: 'Pending review in deterministic seed dataset.',
      submittedAt: new Date('2026-01-01T12:00:00.000Z'),
      reviewedAt: null,
      reviewedByUserId: null
    },
    create: {
      userId: foundationContractor.id,
      addressId: contractorAddress.id,
      approvalStatus: ContractorApprovalStatus.PENDING_REVIEW,
      dniNumber: '12345678',
      dniFrontUrl: 'https://example.com/seeds/dni-front.jpg',
      dniBackUrl: 'https://example.com/seeds/dni-back.jpg',
      profilePhotoUrl: 'https://example.com/seeds/profile-photo.jpg',
      reviewNotes: 'Pending review in deterministic seed dataset.',
      submittedAt: new Date('2026-01-01T12:00:00.000Z')
    }
  });

  const homeServicesCategory = await prisma.category.findUnique({
    where: { slug: 'home-services' }
  });

  if (homeServicesCategory) {
    await prisma.contractorCategory.upsert({
      where: {
        contractorProfileId_categoryId: {
          contractorProfileId: contractorProfile.id,
          categoryId: homeServicesCategory.id
        }
      },
      update: {
        isPrimary: true
      },
      create: {
        contractorProfileId: contractorProfile.id,
        categoryId: homeServicesCategory.id,
        isPrimary: true
      }
    });
  }

  const workZone = await prisma.workZone.findUnique({
    where: {
      marketId_slug: {
        marketId: market.id,
        slug: 'central'
      }
    }
  });

  if (workZone) {
    await prisma.contractorWorkZone.upsert({
      where: {
        contractorProfileId_workZoneId: {
          contractorProfileId: contractorProfile.id,
          workZoneId: workZone.id
        }
      },
      update: {},
      create: {
        contractorProfileId: contractorProfile.id,
        workZoneId: workZone.id
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
