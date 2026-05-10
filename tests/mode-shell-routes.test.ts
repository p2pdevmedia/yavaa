import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('mode shell routes', () => {
  test('normal dashboard entry asks for the active mode', () => {
    const source = readProjectFile('src/app/dashboard/seleccionar-modo/page.tsx');

    expect(source).toContain('Que modo queres usar');
    expect(source).toContain('/dashboard/jefe');
    expect(source).toContain('/dashboard/trabajador');
  });

  test('jefe and trabajador route groups use separate shells', () => {
    expect(readProjectFile('src/app/dashboard/jefe/layout.tsx')).toContain('<JefeShell>');
    expect(readProjectFile('src/app/dashboard/trabajador/layout.tsx')).toContain('<TrabajadorShell>');
  });

  test('jefe shell owns its mode pages', () => {
    expect(readProjectFile('src/app/dashboard/jefe/page.tsx')).toContain('Inicio Jefe');
    expect(readProjectFile('src/app/dashboard/jefe/urgencias/page.tsx')).toContain('Publicar urgencia');
    expect(readProjectFile('src/app/dashboard/jefe/mis-casas/page.tsx')).toContain('Historial de arreglos');
    expect(readProjectFile('src/app/dashboard/jefe/trabajadores/page.tsx')).toContain('Buscar, favoritos e historial');
    expect(readProjectFile('src/app/dashboard/jefe/perfil/page.tsx')).toContain('Perfil Jefe');
  });

  test('trabajador shell owns its mode pages', () => {
    expect(readProjectFile('src/app/dashboard/trabajador/page.tsx')).toContain('Inicio Trabajador');
    expect(readProjectFile('src/app/dashboard/trabajador/urgencias/page.tsx')).toContain('Navegar urgencias');
    expect(readProjectFile('src/app/dashboard/trabajador/mis-clientes/page.tsx')).toContain('trabajos aceptados o completados');
    expect(readProjectFile('src/app/dashboard/trabajador/perfil/page.tsx')).toContain('Perfil Trabajador');
  });
});
