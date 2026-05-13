import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('showcase seed', () => {
  it('targets only the approved client and worker emails', () => {
    const seed = readProjectFile('prisma/seed.mjs');

    expect(seed).toContain("email: 'mullerivan@gmail.com'");
    expect(seed).toContain("email: 'boanhernan53@gmail.com'");
    expect(seed).not.toContain('jefe@yavaa.test');
    expect(seed).not.toContain('trabajador@yavaa.test');
    expect(seed).not.toContain('ivan.muller@yavaa.showcase');
    expect(seed).not.toContain('hernan.boan@yavaa.showcase');
  });

  it('uses matching trade category slugs for Hernan and the published showcase work', () => {
    const seed = readProjectFile('prisma/seed.mjs');

    expect(seed).toContain("'carpinteria'");
    expect(seed).toContain("'zingueria'");
    expect(seed).toContain("'electricidad'");
    expect(seed).toContain("'herreria'");
    expect(seed).toContain("category: 'carpinteria'");
    expect(seed).not.toContain("category: 'Placards y muebles a medida'");
  });

  it('replaces stale role and job data for the approved showcase users', () => {
    const seed = readProjectFile('prisma/seed.mjs');

    expect(seed).toContain('prisma.userRole.deleteMany');
    expect(seed).toContain('not: role.id');
    expect(seed).toContain('removableShowcaseJobTitles');
    expect(seed).toContain("'Mural'");
    expect(seed).toContain('await prisma.jobPost.deleteMany({');
    expect(seed).toContain('clientId: client.id');
  });

  it('seeds an accepted in-progress showcase offer with messages and payments', () => {
    const seed = readProjectFile('prisma/seed.mjs');

    expect(seed).toContain("const acceptedShowcaseJobTitle = 'Placard / armario grande con cajones y puertas pendientes'");
    expect(seed).toContain("title: acceptedShowcaseJobTitle");
    expect(seed).toContain('findFirst');
    expect(seed).toContain('upsert');
    expect(seed).toContain('JobOfferStatus');
    expect(seed).toContain('JobOfferStatus.ACCEPTED');
    expect(seed).toContain('JobPostStatus.IN_PROGRESS');
    expect(seed).toContain('acceptedOfferId: acceptedOffer.id');
    expect(seed).toContain('prisma.jobOfferMessage.createMany');
    expect(seed).toContain('prisma.jobPayment.createMany');
  });

  it('associates every seeded non-zingueria job with Hernan through accepted offers', () => {
    const seed = readProjectFile('prisma/seed.mjs');

    expect(seed).toContain('const showcaseJobs = [');
    expect(seed).toContain('createAcceptedOffer');
    expect(seed).toContain("title: 'Showcase: Bajo mesada de cocina en madera/MDF'");
    expect(seed).toContain("title: 'Showcase: Mueble sobre mesada para cocina compacta'");
    expect(seed).toContain('status: JobPostStatus.IN_PROGRESS');
    expect(seed).toContain('payments: [');
    expect(seed).not.toContain("title: 'Zingueria kaleuche'");
  });

  it('seeds Juanka with curated Kaleuche work and peso-converted dollar payments', () => {
    const seed = readProjectFile('prisma/seed.mjs');

    expect(seed).toContain("email: 'Gaticajuancarlos17@gmail.com'");
    expect(seed).toContain("displayName: 'Juan Carlos Gatica'");
    expect(seed).toContain("const juankaShowcaseUsdRatePesos = 1500");
    expect(seed).toContain("title: 'Showcase: Kaleuche - electricidad, gas y terminaciones'");
    expect(seed).toContain("title: 'Showcase: Escalera de metal y refuerzos'");
    expect(seed).toContain("title: 'Showcase: Mampara y vidrios pendientes'");
    expect(seed).toContain("title: 'Showcase: Termotanque y gabinete'");
    expect(seed).toContain("amount: 700 * juankaShowcaseUsdRatePesos");
    expect(seed).toContain("amount: 400 * juankaShowcaseUsdRatePesos");
    expect(seed).toContain('Equivalente a USD 700 convertido a ARS 1.500 por dolar para el seed.');
    expect(seed).toContain('Equivalente a USD 400 convertido a ARS 1.500 por dolar para el seed.');
  });

  it('allows running only the Juanka showcase seed', () => {
    const seed = readProjectFile('prisma/seed.mjs');

    expect(seed).toContain("const seedTarget = process.env.YAVAA_SEED_TARGET ?? 'all'");
    expect(seed).toContain("if (!['all', 'hernan', 'juanka'].includes(seedTarget))");
    expect(seed).toContain("if (seedTarget === 'all' || seedTarget === 'hernan')");
    expect(seed).toContain("if (seedTarget === 'all' || seedTarget === 'juanka')");
  });
});
