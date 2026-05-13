import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('worker wizard mobile design', () => {
  it('renders the required worker onboarding steps in order', () => {
    const wizard = readProjectFile('src/components/onboarding/worker-wizard.tsx');

    expect(wizard).toContain('¿Cómo te llamás?');
    expect(wizard).toContain('Validemos tu identidad');
    expect(wizard).toContain('Subí fotos del DNI');
    expect(wizard).toContain('¿Dónde trabajás?');
    expect(wizard).toContain('¿Qué trabajos hacés?');
    expect(wizard).toContain('¿Cuánto cobrás por hora?');
    expect(wizard).toContain('Agregá una foto');
    expect(wizard).toContain('Tu perfil está listo');
  });

  it('submits once to the mobile-compatible worker onboarding API', () => {
    const wizard = readProjectFile('src/components/onboarding/worker-wizard.tsx');

    expect(wizard).toContain("fetch('/api/onboarding/trabajador'");
    expect(wizard).toContain("fetch('/api/profile/avatar'");
    expect(wizard).toContain("'/dashboard/trabajador'");
    expect(wizard).toContain('router.push');
  });

  it('uses private blob photo controls instead of a manual avatar URL', () => {
    const wizard = readProjectFile('src/components/onboarding/worker-wizard.tsx');

    expect(wizard).toContain('Subir foto');
    expect(wizard).toContain('Tomar foto');
    expect(wizard).toContain('capture="environment"');
    expect(wizard).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(wizard).not.toContain('URL de foto opcional');
  });

  it('uses shared wizard shell, progress and map preview components', () => {
    const page = readProjectFile('src/app/dashboard/onboarding/[mode]/page.tsx');
    const shell = readProjectFile('src/components/onboarding/onboarding-shell.tsx');
    const progress = readProjectFile('src/components/onboarding/progress-bar.tsx');
    const mapPreview = readProjectFile('src/components/onboarding/mobile-map-preview.tsx');

    expect(page).toContain('WorkerWizard');
    expect(shell).toContain('sticky bottom-0');
    expect(progress).toContain('aria-valuenow');
    expect(mapPreview).toContain('Salta Capital');
  });
});
