import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('app shell components', () => {
  test('keeps each app mode in a separate shell component', () => {
    expect(readProjectFile('src/components/app-shell/guest-shell.tsx')).toContain("mode=\"guest\"");
    expect(readProjectFile('src/components/app-shell/jefe-shell.tsx')).toContain("mode=\"jefe\"");
    expect(readProjectFile('src/components/app-shell/trabajador-shell.tsx')).toContain("mode=\"trabajador\"");
  });

  test('uses one shared native-style bottom bar primitive', () => {
    const source = readProjectFile('src/components/app-shell/bottom-native-bar.tsx');

    expect(source).toContain('getShellNavigationItems(mode, { isAdmin })');
    expect(source).toContain('usePathname()');
    expect(source).toContain('aria-label="Navegación principal"');
    expect(source).toContain('env(safe-area-inset-bottom)');
  });

  test('passes server-resolved admin navigation into authenticated mode shells', () => {
    expect(readProjectFile('src/app/dashboard/jefe/layout.tsx')).toContain(
      'getCurrentUserCanSeeAdminNavigation()'
    );
    expect(readProjectFile('src/app/dashboard/jefe/layout.tsx')).toContain('<JefeShell isAdmin={isAdmin}>');
    expect(readProjectFile('src/app/dashboard/trabajador/layout.tsx')).toContain(
      'getCurrentUserCanSeeAdminNavigation()'
    );
    expect(readProjectFile('src/app/dashboard/trabajador/layout.tsx')).toContain(
      '<TrabajadorShell isAdmin={isAdmin}>'
    );
  });
});
