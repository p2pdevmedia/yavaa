import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('jefe wizard mobile design', () => {
  it('renders the required jefe onboarding steps in order', () => {
    const wizard = readProjectFile('src/components/onboarding/jefe-wizard.tsx');

    expect(wizard).toContain('Tus datos');
    expect(wizard).toContain('¿Dónde necesitás ayuda?');
    expect(wizard).toContain('Agregá una foto');
    expect(wizard).toContain('Ya podés contratar');
  });

  it('submits once to the mobile-compatible jefe onboarding API', () => {
    const wizard = readProjectFile('src/components/onboarding/jefe-wizard.tsx');

    expect(wizard).toContain("fetch('/api/onboarding/jefe'");
    expect(wizard).toContain("'/dashboard/jefe'");
    expect(wizard).toContain('router.push');
  });

  it('is connected from the protected onboarding route', () => {
    const page = readProjectFile('src/app/dashboard/onboarding/[mode]/page.tsx');

    expect(page).toContain('JefeWizard');
    expect(page).toContain("mode === 'jefe'");
  });
});
