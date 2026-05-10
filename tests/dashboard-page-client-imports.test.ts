import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dashboardPages = [
  'admin/page.tsx',
  'bookings/page.tsx',
  'perfil/page.tsx',
  'urgencias/page.tsx'
];

describe('dashboard route client references', () => {
  test('each concrete dashboard page renders the dashboard client boundary directly for the RSC manifest', () => {
    for (const page of dashboardPages) {
      const source = readFileSync(join(process.cwd(), 'src/app/dashboard', page), 'utf8');

      expect(source).toContain(
        "import { DashboardPanelClient } from '@/components/dashboard/dashboard-panel-client';"
      );
      expect(source).toContain('<DashboardPanelClient');
    }
  });

  test('legacy address and notification routes redirect into the app-style profile surface', () => {
    const redirects = [
      ['direcciones/page.tsx', "'/dashboard/perfil'"],
      ['notificaciones/page.tsx', "'/dashboard/perfil'"]
    ] as const;

    for (const [page, target] of redirects) {
      const source = readFileSync(join(process.cwd(), 'src/app/dashboard', page), 'utf8');

      expect(source).toContain("import { redirect } from 'next/navigation';");
      expect(source).toContain(`redirect(${target})`);
    }
  });
});
