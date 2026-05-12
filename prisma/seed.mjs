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
  { slug: 'jefe', name: 'Jefe', description: 'Organiza y solicita trabajo.' },
  { slug: 'trabajador', name: 'Trabajador', description: 'Ofrece trabajo y coordina servicios.' }
];

async function upsertSeedUser(input) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      displayName: input.displayName,
      status: UserStatus.ACTIVE
    },
    create: {
      email: input.email,
      displayName: input.displayName,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: input.profile,
    create: {
      userId: user.id,
      ...input.profile
    }
  });

  return user;
}

async function main() {
  const roles = await Promise.all(
    seedRoles.map((role) =>
      prisma.role.upsert({
        where: { slug: role.slug },
        update: {
          name: role.name,
          description: role.description
        },
        create: role
      })
    )
  );

  const jefe = await upsertSeedUser({
    email: 'jefe@yavaa.test',
    displayName: 'Jefe Principal',
    profile: {
      firstName: 'Jefe',
      lastName: 'Principal',
      bio: 'Cuenta deterministica para validar el perfil Jefe.'
    }
  });

  const trabajador = await upsertSeedUser({
    email: 'trabajador@yavaa.test',
    displayName: 'Trabajador Principal',
    profile: {
      firstName: 'Trabajador',
      lastName: 'Principal',
      bio: 'Cuenta deterministica para validar el perfil Trabajador.'
    }
  });

  for (const [user, slug] of [
    [jefe, 'jefe'],
    [trabajador, 'trabajador']
  ]) {
    const role = roles.find((candidate) => candidate.slug === slug);

    if (!role) {
      throw new Error(`Seed role not found: ${slug}`);
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id
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
