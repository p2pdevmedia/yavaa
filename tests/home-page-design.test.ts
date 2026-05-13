import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('public home map-first design', () => {
  it('uses the selected map-first home direction without changing auth routing', () => {
    const page = readProjectFile('src/app/page.tsx');

    expect(page).toContain('Consegui ayuda cerca, desde hoy.');
    expect(page).toContain('Usar mi ubicación');
    expect(page).toContain('data-testid="home-map-preview"');
    expect(page).toContain('Jefe');
    expect(page).toContain('Trabajador');
    expect(page).toContain("pathname: '/sign-up'");
    expect(page).toContain("pathname: '/sign-in'");
    expect(page).toContain("'/dashboard'");
  });
});
