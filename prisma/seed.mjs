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
const juankaShowcaseUsdRatePesos = 1500;

const removableShowcaseJobTitles = [
  'Mural',
  'Showcase: Baranda, piso y reparación general de cabaña',
  'Showcase: Bajo mesada de cocina en madera/MDF',
  'Showcase: Mueble sobre mesada para cocina compacta',
  'Showcase: Revestimiento de pared y contramarcos',
  'Showcase: Aislación de ventanas con poliuretano y contramarcos',
  'Showcase: Placard / armario grande con cajones y puertas pendientes',
  'Showcase: Kaleuche - electricidad, gas y terminaciones',
  'Showcase: Escalera de metal y refuerzos',
  'Showcase: Mampara y vidrios pendientes',
  'Showcase: Termotanque y gabinete'
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
  const showcaseJobs = [
    {
      title: 'Showcase: Baranda, piso y reparación general de cabaña',
      amount: 750000,
      status: JobPostStatus.CLOSED,
      desiredTime: new Date('2026-04-08T12:00:00-03:00'),
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Hernán Esteban Boan',
        budget: 750000,
        payments: 950000,
        source: 'chat de obra abril 2026',
        notes:
          'Incluye baranda de escalera, reparación de sector de piso/agujero y extras de terminación. Presupuesto inicial de ARS 500.000, luego ajustado a ARS 750.000 con extras. Pagos asociados detectados: 08/04 ARS 250.000, 10/04 ARS 100.000, 17/04 ARS 300.000 aprox. y 22/04 ARS 300.000 aprox.'
      }),
      messages: [
        {
          authorId: client.id,
          body: 'Hernán, necesito cerrar baranda, reparar el piso y dejar prolija la cabaña. Avancemos con el presupuesto ajustado.'
        },
        {
          authorId: contractor.id,
          body: 'Dale Iván, tomo baranda, piso y extras de terminación. Voy marcando avances y pagos por acá.'
        }
      ],
      payments: [
        { amount: 250000, paidAt: '2026-04-08T18:00:00-03:00', description: 'Anticipo baranda y reparación general.' },
        { amount: 100000, paidAt: '2026-04-10T18:00:00-03:00', description: 'Pago parcial por avance inicial.' },
        { amount: 300000, paidAt: '2026-04-17T18:00:00-03:00', description: 'Pago parcial por avance de obra.' },
        { amount: 300000, paidAt: '2026-04-22T18:00:00-03:00', description: 'Pago final de extras y terminaciones.' }
      ]
    },
    {
      title: 'Showcase: Bajo mesada de cocina en madera/MDF',
      amount: 950000,
      status: JobPostStatus.IN_PROGRESS,
      desiredTime: new Date('2026-04-24T17:00:00-03:00'),
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Hernán Esteban Boan',
        budget: 950000,
        payments: 850000,
        source: 'presupuesto del 24/04/2026 y pagos del 24/04, 29/04 y 30/04',
        notes:
          'Bajo mesada con diseño funcional para casa chica, cajones y compra de materiales. Presupuesto: ARS 650.000 de mano de obra + ARS 300.000 de materiales. Pagos relacionados: ARS 400.000 de anticipo, ARS 300.000 de avance y ARS 150.000 a Hernán para manejo de fin de semana. Además hubo ARS 300.000 enviados a MDN SRL para materiales.'
      }),
      messages: [
        {
          authorId: contractor.id,
          body: 'Te paso el bajo mesada con mano de obra y materiales. Lo dejo funcional para casa chica, con cajones y buen espacio de guardado.'
        },
        {
          authorId: client.id,
          body: 'Aceptado. Mandame cómo vas comprando materiales y prioricemos que quede práctico para usar todos los días.'
        }
      ],
      payments: [
        { amount: 400000, paidAt: '2026-04-24T18:30:00-03:00', description: 'Anticipo bajo mesada.' },
        { amount: 300000, paidAt: '2026-04-29T18:30:00-03:00', description: 'Pago parcial por avance de bajo mesada.' },
        { amount: 150000, paidAt: '2026-04-30T18:30:00-03:00', description: 'Pago para manejo de fin de semana.' }
      ]
    },
    {
      title: 'Showcase: Mueble sobre mesada para cocina compacta',
      amount: 250000,
      status: JobPostStatus.IN_PROGRESS,
      desiredTime: new Date('2026-04-24T17:15:00-03:00'),
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Hernán Esteban Boan',
        budget: 250000,
        payments: null,
        source: 'presupuesto del 24/04/2026',
        notes:
          'Mueble sobre mesada presupuestado con materiales incluidos. En la conversación se define que debe ser funcional, con profundidad suficiente para platos grandes y puertas para tapar desorden y proteger del polvo.'
      }),
      messages: [
        {
          authorId: client.id,
          body: 'Para el mueble sobre mesada necesito profundidad real para platos grandes y puertas para que no junte polvo.'
        },
        {
          authorId: contractor.id,
          body: 'Lo tomo así. Lo dejo en curso junto con cocina para ajustar medidas antes de cerrar.'
        }
      ],
      payments: []
    },
    {
      title: 'Showcase: Revestimiento de pared y contramarcos',
      amount: 650000,
      status: JobPostStatus.CLOSED,
      desiredTime: new Date('2026-04-24T17:30:00-03:00'),
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Hernán Esteban Boan',
        budget: 650000,
        payments: null,
        source: 'presupuesto del 24/04/2026',
        notes:
          'Revestimiento de pared y contramarco de puerta en MDF ranurado, con material incluido. El trabajo forma parte de la mejora general para que la cabaña tome forma de casa y quede más prolija visualmente.'
      }),
      messages: [
        {
          authorId: contractor.id,
          body: 'Incluyo revestimiento de pared y contramarcos para emparejar visualmente la cabaña.'
        },
        {
          authorId: client.id,
          body: 'Perfecto, avancemos con esa terminación para que quede más prolijo.'
        }
      ],
      payments: []
    },
    {
      title: 'Showcase: Aislación de ventanas con poliuretano y contramarcos',
      amount: 250000,
      status: JobPostStatus.CLOSED,
      desiredTime: new Date('2026-05-03T12:30:00-03:00'),
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Hernán Esteban Boan',
        budget: 50000,
        payments: 250000,
        source: 'presupuesto del 03/05/2026 y pago del 04/05/2026',
        notes:
          'Aislación de ventanas con poliuretano y colocación de contramarco interno en madera. Precio informado: ARS 50.000 por ventana. Pago relacionado confirmado el 04/05: ARS 250.000 a Hernán Esteban Boan / Canelaboan.'
      }),
      messages: [
        {
          authorId: client.id,
          body: 'Hagamos la aislación de ventanas con poliuretano y contramarcos internos.'
        },
        {
          authorId: contractor.id,
          body: 'Queda a ARS 50.000 por ventana. Lo cierro con contramarco interno en madera.'
        }
      ],
      payments: [{ amount: 250000, paidAt: '2026-05-04T18:00:00-03:00', description: 'Pago aislación de ventanas.' }]
    },
    {
      title: acceptedShowcaseJobTitle,
      legacyTitle: 'Showcase: Placard / armario grande con cajones y puertas pendientes',
      amount: 1100000,
      status: JobPostStatus.IN_PROGRESS,
      desiredTime: new Date('2026-05-05T10:20:00-03:00'),
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Hernán Esteban Boan',
        budget: 1100000,
        payments: 400000,
        source: 'presupuesto del 05/05/2026 y aclaración del 07/05/2026',
        notes:
          'Placard/armario grande para casa chica, pensado para guardar ropa, platos y objetos. Presupuesto detectado: ARS 400.000 de materiales + ARS 700.000 de mano de obra. El 07/05 se aclara que las puertas no estaban contempladas: 2 corredizas y 3 superiores quedarían como extra fuera del presupuesto original. Este caso queda en curso para mostrar oferta aceptada, chat y pagos parciales.'
      }),
      messages: [
        {
          authorId: contractor.id,
          body:
            'Hola Iván, puedo tomar el placard grande. Mantengo el presupuesto de materiales y mano de obra, dejando las puertas corredizas y superiores como extra si las definimos después.'
        },
        {
          authorId: client.id,
          body:
            'Dale Hernán, acepto la oferta. Priorizá que quede usable para guardar ropa y platos, y vamos viendo las puertas cuando avancemos.'
        },
        {
          authorId: contractor.id,
          body: 'Perfecto. Compro materiales y arranco con estructura, cajones y divisiones. Te voy pasando avances por acá.'
        },
        {
          authorId: client.id,
          body: 'Te dejo pagos parciales cargados para materiales y avance. Avisame antes de cerrar medidas finales.'
        }
      ],
      payments: [
        { amount: 250000, paidAt: '2026-05-05T13:30:00-03:00', description: 'Anticipo para compra de materiales del placard.' },
        { amount: 150000, paidAt: '2026-05-06T18:45:00-03:00', description: 'Pago parcial por avance de estructura y cajones.' }
      ]
    }
  ];

  const seededTitles = showcaseJobs.flatMap((job) => [job.title, job.legacyTitle].filter(Boolean));

  await prisma.jobPost.updateMany({
    where: {
      clientId: client.id,
      title: { in: ['Mural', ...seededTitles] }
    },
    data: {
      acceptedOfferId: null
    }
  });

  await prisma.jobPost.deleteMany({
    where: {
      clientId: client.id,
      title: { in: ['Mural', ...showcaseJobs.map((job) => job.legacyTitle).filter(Boolean)] }
    }
  });

  async function createAcceptedOffer(jobPost, showcaseJob) {
    await prisma.jobOffer.deleteMany({
      where: {
        jobPostId: jobPost.id
      }
    });

    const acceptedOffer = await prisma.jobOffer.create({
      data: {
        jobPostId: jobPost.id,
        workerId: contractor.id,
        amountCents: showcaseJob.amount * 100,
        status: JobOfferStatus.ACCEPTED
      }
    });

    await prisma.jobPost.update({
      where: {
        id: jobPost.id
      },
      data: {
        acceptedOfferId: acceptedOffer.id,
        status: showcaseJob.status
      }
    });

    if (showcaseJob.messages.length > 0) {
      await prisma.jobOfferMessage.createMany({
        data: showcaseJob.messages.map((message, index) => ({
          offerId: acceptedOffer.id,
          authorId: message.authorId,
          body: message.body,
          createdAt: new Date(Date.UTC(2026, 4, 5, 14, 0 + index * 10, 0))
        }))
      });
    }

    if (showcaseJob.payments.length > 0) {
      await prisma.jobPayment.createMany({
        data: showcaseJob.payments.map((payment) => ({
          offerId: acceptedOffer.id,
          createdById: client.id,
          amountCents: payment.amount * 100,
          paidAt: new Date(payment.paidAt),
          description: payment.description
        }))
      });
    }
  }

  for (const showcaseJob of showcaseJobs) {
    const existingJob = await prisma.jobPost.findFirst({
      where: {
        clientId: client.id,
        title: showcaseJob.title
      },
      select: {
        id: true
      }
    });

    const jobPost = existingJob
      ? await prisma.jobPost.update({
          where: {
            id: existingJob.id
          },
          data: {
            category: 'carpinteria',
            description: showcaseJob.description,
            addressText: 'San Martín de los Andes, Neuquén',
            desiredTime: showcaseJob.desiredTime,
            status: JobPostStatus.PUBLISHED
          }
        })
      : await prisma.jobPost.create({
          data: {
            clientId: client.id,
            title: showcaseJob.title,
            category: 'carpinteria',
            description: showcaseJob.description,
            addressText: 'San Martín de los Andes, Neuquén',
            desiredTime: showcaseJob.desiredTime,
            status: JobPostStatus.PUBLISHED
          }
        });

    await createAcceptedOffer(jobPost, showcaseJob);
  }
}

async function seedJuankaShowcase({ client, contractor }) {
  const showcaseJobs = [
    {
      title: 'Showcase: Kaleuche - electricidad, gas y terminaciones',
      amount: 1000000,
      status: JobPostStatus.IN_PROGRESS,
      desiredTime: new Date('2026-04-09T19:52:00-03:00'),
      category: 'electricidad',
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Juan Carlos Gatica',
        budget: 1000000,
        payments: 1000000,
        source: 'chat de obra Kaleuche, marzo-abril 2026',
        notes:
          'Trabajo real de Kaleuche con electricidad, gas, terminaciones, reforma de baño, zanjeo para sintenax, jabalina, rejillas de ventilación y coordinación de artefactos. El chat registra discusiones de alcance, presupuesto y la decisión de avanzar el 09/04/2026 por ARS 1.000.000 para la etapa urgente.'
      }),
      messages: [
        {
          authorId: client.id,
          body:
            'Juanka, necesito cerrar Kaleuche: electricidad, gas, terminaciones y lo urgente para poder meter gente en la casa.'
        },
        {
          authorId: contractor.id,
          body:
            'Vamos para adelante. Hago reforma de baño a medias, zanjeo al pilar, jabalina, ventilaciones y gabinete del termotanque; esa etapa te la cobro un millón.'
        },
        {
          authorId: client.id,
          body: 'Dale, avancemos y dejemos todo más organizado en el sistema.'
        }
      ],
      payments: [
        {
          amount: 1000000,
          paidAt: '2026-04-17T13:40:00-03:00',
          description: 'Pago etapa Kaleuche registrado en pesos desde transferencia del 17/04/2026.'
        }
      ]
    },
    {
      title: 'Showcase: Escalera de metal y refuerzos',
      amount: 1500000,
      status: JobPostStatus.CLOSED,
      desiredTime: new Date('2026-04-23T12:19:00-03:00'),
      category: 'herreria',
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Juan Carlos Gatica',
        budget: 1500000,
        payments: 500000 + 700 * juankaShowcaseUsdRatePesos,
        source: 'chat de escalera, 20/04/2026 al 13/05/2026',
        notes:
          'Reemplazo y armado de escalones metálicos con pintura negra, colocación y dos refuerzos en el medio. El chat registra anticipo de ARS 500.000 y luego pago conversado como USD 700. El 13/05/2026 Juanka aclara que ese millón era de la escalera y que ya quedó paga.'
      }),
      messages: [
        {
          authorId: contractor.id,
          body:
            'La idea es hacer la escalera nueva con todos los escalones, pintarlos de negro y colocarlos. Un millón y medio estaba bien.'
        },
        {
          authorId: client.id,
          body: 'Vamos con esa escalera de metal.'
        },
        {
          authorId: contractor.id,
          body: 'Ya cortamos casi todos los escalones. Mañana empezamos a soldar.'
        },
        {
          authorId: client.id,
          body: 'Yo te mandé 500 de esto. El resto queda convertido y cargado en pesos para tenerlo ordenado.'
        }
      ],
      payments: [
        {
          amount: 500000,
          paidAt: '2026-04-24T18:57:00-03:00',
          description: 'Anticipo de ARS 500.000 para escalera de metal.'
        },
        {
          amount: 700 * juankaShowcaseUsdRatePesos,
          paidAt: '2026-04-29T21:24:00-03:00',
          description: 'Equivalente a USD 700 convertido a ARS 1.500 por dolar para el seed.'
        }
      ]
    },
    {
      title: 'Showcase: Mampara y vidrios pendientes',
      amount: 600000,
      status: JobPostStatus.IN_PROGRESS,
      desiredTime: new Date('2026-04-07T18:47:00-03:00'),
      category: 'terminaciones',
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Juan Carlos Gatica',
        budget: 600000,
        payments: 400 * juankaShowcaseUsdRatePesos,
        source: 'chat de mampara y pendientes, noviembre 2024 a mayo 2026',
        notes:
          'Seguimiento de mampara, medidas, vidrios y pendientes de cierre. En el mensaje del 13/05/2026 Juanka enumera Mampara como una de las cosas que todavía debía resolver, por eso queda en curso.'
      }),
      messages: [
        {
          authorId: client.id,
          body: 'Mañana vemos lo de la mampara.'
        },
        {
          authorId: contractor.id,
          body: 'Mampara y vidrios pendientes quedan en la lista para cerrar.'
        },
        {
          authorId: client.id,
          body: 'Lo cargo acá para que no se pierda entre chats, PDFs y presupuestos.'
        }
      ],
      payments: [
        {
          amount: 400 * juankaShowcaseUsdRatePesos,
          paidAt: '2026-05-13T14:44:00-03:00',
          description: 'Equivalente a USD 400 convertido a ARS 1.500 por dolar para el seed.'
        }
      ]
    },
    {
      title: 'Showcase: Termotanque y gabinete',
      amount: 1000000,
      status: JobPostStatus.IN_PROGRESS,
      desiredTime: new Date('2026-04-09T19:36:00-03:00'),
      category: 'gas',
      description: showcaseDescription({
        contractor: contractor.displayName ?? 'Juan Carlos Gatica',
        budget: 1000000,
        payments: null,
        source: 'chat de termotanque y gabinete, abril-mayo 2026',
        notes:
          'Instalación y coordinación del termotanque, gabinete, conexiones de gas, ventilaciones y validación para Camuzzi. El 25/04/2026 Juanka dice que esa semana coloca el termo y el 13/05/2026 lo vuelve a listar como pendiente.'
      }),
      messages: [
        {
          authorId: contractor.id,
          body: 'Hablo con el gasista y esta semana le pongo el termo así puede ir a Camuzzi.'
        },
        {
          authorId: client.id,
          body: 'Che, cómo viene la instalación de los artefactos en Kaleuche?'
        },
        {
          authorId: contractor.id,
          body: 'Termotanque y gabinete quedan registrados como pendiente principal junto con la mampara.'
        }
      ],
      payments: []
    }
  ];

  const seededTitles = showcaseJobs.map((job) => job.title);

  await prisma.jobPost.updateMany({
    where: {
      clientId: client.id,
      title: { in: seededTitles }
    },
    data: {
      acceptedOfferId: null
    }
  });

  async function createAcceptedOffer(jobPost, showcaseJob) {
    await prisma.jobOffer.deleteMany({
      where: {
        jobPostId: jobPost.id
      }
    });

    const acceptedOffer = await prisma.jobOffer.create({
      data: {
        jobPostId: jobPost.id,
        workerId: contractor.id,
        amountCents: showcaseJob.amount * 100,
        status: JobOfferStatus.ACCEPTED
      }
    });

    await prisma.jobPost.update({
      where: {
        id: jobPost.id
      },
      data: {
        acceptedOfferId: acceptedOffer.id,
        status: showcaseJob.status
      }
    });

    if (showcaseJob.messages.length > 0) {
      await prisma.jobOfferMessage.createMany({
        data: showcaseJob.messages.map((message, index) => ({
          offerId: acceptedOffer.id,
          authorId: message.authorId,
          body: message.body,
          createdAt: new Date(Date.UTC(2026, 4, 13, 15, 0 + index * 10, 0))
        }))
      });
    }

    if (showcaseJob.payments.length > 0) {
      await prisma.jobPayment.createMany({
        data: showcaseJob.payments.map((payment) => ({
          offerId: acceptedOffer.id,
          createdById: client.id,
          amountCents: payment.amount * 100,
          paidAt: new Date(payment.paidAt),
          description: payment.description
        }))
      });
    }
  }

  for (const showcaseJob of showcaseJobs) {
    const existingJob = await prisma.jobPost.findFirst({
      where: {
        clientId: client.id,
        title: showcaseJob.title
      },
      select: {
        id: true
      }
    });

    const jobPost = existingJob
      ? await prisma.jobPost.update({
          where: {
            id: existingJob.id
          },
          data: {
            category: showcaseJob.category,
            description: showcaseJob.description,
            addressText: 'San Martín de los Andes, Neuquén',
            desiredTime: showcaseJob.desiredTime,
            status: JobPostStatus.PUBLISHED
          }
        })
      : await prisma.jobPost.create({
          data: {
            clientId: client.id,
            title: showcaseJob.title,
            category: showcaseJob.category,
            description: showcaseJob.description,
            addressText: 'San Martín de los Andes, Neuquén',
            desiredTime: showcaseJob.desiredTime,
            status: JobPostStatus.PUBLISHED
          }
        });

    await createAcceptedOffer(jobPost, showcaseJob);
  }
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

  const juanka = await upsertSeedUser({
    email: 'Gaticajuancarlos17@gmail.com',
    displayName: 'Juan Carlos Gatica',
    profile: {
      firstName: 'Juan Carlos',
      lastName: 'Gatica',
      phone: null,
      bio:
        'Trabajador showcase de Yavaa conocido como Juanka. Historia real de trabajos en Kaleuche: electricidad, gas, herrería, termotanque, mamparas, escalera de metal y terminaciones. Email compartido por WhatsApp el 13/05/2026.',
      onboardingRole: OnboardingRole.TRABAJADOR,
      workerOnboardingCompletedAt: new Date('2026-05-13T12:00:00-03:00'),
      jefeOnboardingCompletedAt: null,
      identityVerificationStatus: IdentityVerificationStatus.NOT_STARTED,
      workerCategories: ['electricidad', 'plomeria', 'gas', 'herreria', 'albanileria', 'terminaciones'],
      workerHourlyRateCents: 1200000,
      addressText: 'San Martín de los Andes, Neuquén, Argentina'
    }
  });

  for (const [user, slug] of [
    [ivan, 'jefe'],
    [hernan, 'trabajador'],
    [juanka, 'trabajador']
  ]) {
    await setOnlyRole(user, slug, roles);
  }

  await seedHernanShowcase({ client: ivan, contractor: hernan });
  await seedJuankaShowcase({ client: ivan, contractor: juanka });
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
