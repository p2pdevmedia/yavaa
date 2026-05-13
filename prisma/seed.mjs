import { PrismaPg } from '@prisma/adapter-pg';
import {
  IdentityVerificationStatus,
  JobOfferStatus,
  JobPostStatus,
  OnboardingRole,
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
  { slug: 'jefe', name: 'Jefe', description: 'Organiza y solicita trabajo.' },
  { slug: 'trabajador', name: 'Trabajador', description: 'Ofrece trabajo y coordina servicios.' }
];

const acceptedShowcaseJobTitle = 'Placard / armario grande con cajones y puertas pendientes';

const removableShowcaseJobTitles = [
  'Mural',
  'Showcase: Baranda, piso y reparación general de cabaña',
  'Showcase: Bajo mesada de cocina en madera/MDF',
  'Showcase: Mueble sobre mesada para cocina compacta',
  'Showcase: Revestimiento de pared y contramarcos',
  'Showcase: Aislación de ventanas con poliuretano y contramarcos',
  'Showcase: Placard / armario grande con cajones y puertas pendientes'
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

async function setOnlyRole(user, roleSlug, roles) {
  const role = roles.find((candidate) => candidate.slug === roleSlug);

  if (!role) {
    throw new Error(`Seed role not found: ${roleSlug}`);
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({
      where: {
        userId: user.id,
        roleId: {
          not: role.id
        }
      }
    }),
    prisma.userRole.upsert({
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
    })
  ]);
}

function money(amount) {
  return new Intl.NumberFormat('es-AR').format(amount);
}

function showcaseDescription({ contractor, budget, payments, source, notes }) {
  return [
    `Trabajo real de showcase para portfolio de Yavaa. Resuelto por ${contractor}.`,
    budget ? `Presupuesto registrado: ARS ${money(budget)}.` : null,
    payments ? `Pagos relacionados registrados: ARS ${money(payments)}.` : null,
    source ? `Base del caso: ${source}.` : null,
    notes
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function seedHernanShowcase({ client, contractor }) {
  await prisma.jobPost.updateMany({
    where: {
      clientId: client.id,
      title: { in: [...removableShowcaseJobTitles, acceptedShowcaseJobTitle] }
    },
    data: {
      acceptedOfferId: null
    }
  });

  await prisma.jobPost.deleteMany({
    where: {
      clientId: client.id,
      title: { in: removableShowcaseJobTitles }
    }
  });

  const existingAcceptedJob = await prisma.jobPost.findFirst({
    where: {
      clientId: client.id,
      title: acceptedShowcaseJobTitle
    },
    select: {
      id: true
    }
  });

  const activeJob = existingAcceptedJob
    ? await prisma.jobPost.update({
        where: {
          id: existingAcceptedJob.id
        },
        data: {
          category: 'carpinteria',
          description: showcaseDescription({
            contractor: contractor.displayName ?? 'Hernán Esteban Boan',
            budget: 1100000,
            payments: 400000,
            source: 'presupuesto del 05/05/2026 y aclaración del 07/05/2026',
            notes:
              'Placard/armario grande para casa chica, pensado para guardar ropa, platos y objetos. Presupuesto detectado: ARS 400.000 de materiales + ARS 700.000 de mano de obra. El 07/05 se aclara que las puertas no estaban contempladas: 2 corredizas y 3 superiores quedarían como extra fuera del presupuesto original. Este caso queda en curso para mostrar oferta aceptada, chat y pagos parciales.'
          }),
          addressText: 'San Martín de los Andes, Neuquén',
          desiredTime: new Date('2026-05-05T10:20:00-03:00'),
          status: JobPostStatus.PUBLISHED
        }
      })
    : await prisma.jobPost.create({
        data: {
          clientId: client.id,
          title: acceptedShowcaseJobTitle,
          category: 'carpinteria',
          description: showcaseDescription({
            contractor: contractor.displayName ?? 'Hernán Esteban Boan',
            budget: 1100000,
            payments: 400000,
            source: 'presupuesto del 05/05/2026 y aclaración del 07/05/2026',
            notes:
              'Placard/armario grande para casa chica, pensado para guardar ropa, platos y objetos. Presupuesto detectado: ARS 400.000 de materiales + ARS 700.000 de mano de obra. El 07/05 se aclara que las puertas no estaban contempladas: 2 corredizas y 3 superiores quedarían como extra fuera del presupuesto original. Este caso queda en curso para mostrar oferta aceptada, chat y pagos parciales.'
          }),
          addressText: 'San Martín de los Andes, Neuquén',
          desiredTime: new Date('2026-05-05T10:20:00-03:00'),
          status: JobPostStatus.PUBLISHED
        }
      });

  await prisma.jobOffer.deleteMany({
    where: {
      jobPostId: activeJob.id
    }
  });

  const acceptedOffer = await prisma.jobOffer.create({
    data: {
      jobPostId: activeJob.id,
      workerId: contractor.id,
      amountCents: 110000000,
      status: JobOfferStatus.ACCEPTED,
      createdAt: new Date('2026-05-05T11:15:00-03:00')
    }
  });

  await prisma.jobPost.update({
    where: {
      id: activeJob.id
    },
    data: {
      acceptedOfferId: acceptedOffer.id,
      status: JobPostStatus.IN_PROGRESS
    }
  });

  await prisma.jobOfferMessage.createMany({
    data: [
      {
        offerId: acceptedOffer.id,
        authorId: contractor.id,
        body:
          'Hola Iván, puedo tomar el placard grande. Mantengo el presupuesto de materiales y mano de obra, dejando las puertas corredizas y superiores como extra si las definimos después.',
        createdAt: new Date('2026-05-05T11:20:00-03:00')
      },
      {
        offerId: acceptedOffer.id,
        authorId: client.id,
        body:
          'Dale Hernán, acepto la oferta. Priorizá que quede usable para guardar ropa y platos, y vamos viendo las puertas cuando avancemos.',
        createdAt: new Date('2026-05-05T11:42:00-03:00')
      },
      {
        offerId: acceptedOffer.id,
        authorId: contractor.id,
        body:
          'Perfecto. Compro materiales y arranco con estructura, cajones y divisiones. Te voy pasando avances por acá.',
        createdAt: new Date('2026-05-05T12:05:00-03:00')
      },
      {
        offerId: acceptedOffer.id,
        authorId: client.id,
        body:
          'Te dejo pagos parciales cargados para materiales y avance. Avisame antes de cerrar medidas finales.',
        createdAt: new Date('2026-05-06T09:10:00-03:00')
      }
    ]
  });

  await prisma.jobPayment.createMany({
    data: [
      {
        offerId: acceptedOffer.id,
        createdById: client.id,
        amountCents: 25000000,
        paidAt: new Date('2026-05-05T13:30:00-03:00'),
        description: 'Anticipo para compra de materiales del placard.'
      },
      {
        offerId: acceptedOffer.id,
        createdById: client.id,
        amountCents: 15000000,
        paidAt: new Date('2026-05-06T18:45:00-03:00'),
        description: 'Pago parcial por avance de estructura y cajones.'
      }
    ]
  });

  await prisma.jobPost.createMany({
    data: [
      {
        clientId: client.id,
        title: 'Showcase: Baranda, piso y reparación general de cabaña',
        category: 'carpinteria',
        description: showcaseDescription({
          contractor: contractor.displayName ?? 'Hernán Esteban Boan',
          budget: 750000,
          payments: 950000,
          source: 'chat de obra abril 2026',
          notes:
            'Incluye baranda de escalera, reparación de sector de piso/agujero y extras de terminación. Presupuesto inicial de ARS 500.000, luego ajustado a ARS 750.000 con extras. Pagos asociados detectados: 08/04 ARS 250.000, 10/04 ARS 100.000, 17/04 ARS 300.000 aprox. y 22/04 ARS 300.000 aprox.'
        }),
        addressText: 'San Martín de los Andes, Neuquén',
        desiredTime: new Date('2026-04-08T12:00:00-03:00'),
        status: JobPostStatus.CLOSED
      },
      {
        clientId: client.id,
        title: 'Showcase: Bajo mesada de cocina en madera/MDF',
        category: 'carpinteria',
        description: showcaseDescription({
          contractor: contractor.displayName ?? 'Hernán Esteban Boan',
          budget: 950000,
          payments: 850000,
          source: 'presupuesto del 24/04/2026 y pagos del 24/04, 29/04 y 30/04',
          notes:
            'Bajo mesada con diseño funcional para casa chica, cajones y compra de materiales. Presupuesto: ARS 650.000 de mano de obra + ARS 300.000 de materiales. Pagos relacionados: ARS 400.000 de anticipo, ARS 300.000 de avance y ARS 150.000 a Hernán para manejo de fin de semana. Además hubo ARS 300.000 enviados a MDN SRL para materiales.'
        }),
        addressText: 'San Martín de los Andes, Neuquén',
        desiredTime: new Date('2026-04-24T17:00:00-03:00'),
        status: JobPostStatus.CLOSED
      },
      {
        clientId: client.id,
        title: 'Showcase: Mueble sobre mesada para cocina compacta',
        category: 'carpinteria',
        description: showcaseDescription({
          contractor: contractor.displayName ?? 'Hernán Esteban Boan',
          budget: 250000,
          payments: null,
          source: 'presupuesto del 24/04/2026',
          notes:
            'Mueble sobre mesada presupuestado con materiales incluidos. En la conversación se define que debe ser funcional, con profundidad suficiente para platos grandes y puertas para tapar desorden y proteger del polvo.'
        }),
        addressText: 'San Martín de los Andes, Neuquén',
        desiredTime: new Date('2026-04-24T17:15:00-03:00'),
        status: JobPostStatus.CLOSED
      },
      {
        clientId: client.id,
        title: 'Showcase: Revestimiento de pared y contramarcos',
        category: 'carpinteria',
        description: showcaseDescription({
          contractor: contractor.displayName ?? 'Hernán Esteban Boan',
          budget: 650000,
          payments: null,
          source: 'presupuesto del 24/04/2026',
          notes:
            'Revestimiento de pared y contramarco de puerta en MDF ranurado, con material incluido. El trabajo forma parte de la mejora general para que la cabaña tome forma de casa y quede más prolija visualmente.'
        }),
        addressText: 'San Martín de los Andes, Neuquén',
        desiredTime: new Date('2026-04-24T17:30:00-03:00'),
        status: JobPostStatus.CLOSED
      },
      {
        clientId: client.id,
        title: 'Showcase: Aislación de ventanas con poliuretano y contramarcos',
        category: 'carpinteria',
        description: showcaseDescription({
          contractor: contractor.displayName ?? 'Hernán Esteban Boan',
          budget: 50000,
          payments: 250000,
          source: 'presupuesto del 03/05/2026 y pago del 04/05/2026',
          notes:
            'Aislación de ventanas con poliuretano y colocación de contramarco interno en madera. Precio informado: ARS 50.000 por ventana. Pago relacionado confirmado el 04/05: ARS 250.000 a Hernán Esteban Boan / Canelaboan.'
        }),
        addressText: 'San Martín de los Andes, Neuquén',
        desiredTime: new Date('2026-05-03T12:30:00-03:00'),
        status: JobPostStatus.CLOSED
      },
    ]
  });
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

  const ivan = await upsertSeedUser({
    email: 'mullerivan@gmail.com',
    displayName: 'Iván Müller',
    profile: {
      firstName: 'Iván',
      lastName: 'Müller',
      bio: 'Cliente showcase de Yavaa. Caso real de remodelación y mejoras en una cabaña chica de San Martín de los Andes.',
      onboardingRole: OnboardingRole.JEFE,
      workerOnboardingCompletedAt: null,
      jefeOnboardingCompletedAt: new Date('2026-04-08T09:00:00-03:00'),
      identityVerificationStatus: IdentityVerificationStatus.NOT_STARTED,
      workerCategories: [],
      workerHourlyRateCents: null,
      addressText: 'San Martín de los Andes, Neuquén, Argentina'
    }
  });

  const hernan = await upsertSeedUser({
    email: 'boanhernan53@gmail.com',
    displayName: 'Hernán Esteban Boan',
    profile: {
      firstName: 'Hernán Esteban',
      lastName: 'Boan',
      phone: null,
      bio:
        'Constructor y carpintero showcase de Yavaa. Trabajos reales realizados: barandas, bajo mesada, muebles a medida, placards, contramarcos, revestimientos y aislación de ventanas. Alias de pago usado en el caso: Canelaboan.',
      onboardingRole: OnboardingRole.TRABAJADOR,
      workerOnboardingCompletedAt: new Date('2026-04-08T09:00:00-03:00'),
      jefeOnboardingCompletedAt: null,
      identityVerificationStatus: IdentityVerificationStatus.VERIFIED,
      workerCategories: ['carpinteria', 'zingueria', 'electricidad', 'herreria'],
      workerHourlyRateCents: 1500000,
      addressText: 'San Martín de los Andes, Neuquén, Argentina'
    }
  });

  for (const [user, slug] of [
    [ivan, 'jefe'],
    [hernan, 'trabajador']
  ]) {
    await setOnlyRole(user, slug, roles);
  }

  await seedHernanShowcase({ client: ivan, contractor: hernan });
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
