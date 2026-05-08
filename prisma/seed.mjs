import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserStatus } from '@prisma/client';

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

async function main() {
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
      bio: 'Deterministic seed account for phase 00 validation.'
    },
    create: {
      userId: foundationAdmin.id,
      firstName: 'Foundation',
      lastName: 'Admin',
      bio: 'Deterministic seed account for phase 00 validation.'
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
