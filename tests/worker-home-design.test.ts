import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('worker post-wizard home design', () => {
  it('shows verification, hourly rate, categories and nearby jobs empty state', () => {
    const workerHome = readProjectFile('src/components/dashboard/worker-home.tsx');

    expect(workerHome).toContain('Verificación');
    expect(workerHome).toContain('Precio por hora');
    expect(workerHome).toContain('Rubros');
    expect(workerHome).toContain('Trabajos cercanos');
  });

  it('uses the worker home component from the protected trabajador route', () => {
    const page = readProjectFile('src/app/dashboard/trabajador/page.tsx');

    expect(page).toContain('WorkerHome');
    expect(page).toContain("hasCompletedOnboarding(context.appUser.user.profile, 'trabajador')");
  });
});
