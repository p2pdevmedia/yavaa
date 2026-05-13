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
});
