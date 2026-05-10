import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin user audit activity navigation', () => {
  it('links from the user detail page to a dedicated audit activity screen', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/dashboard/admin-user-detail.tsx'),
      'utf8'
    );

    expect(source).toContain('Ver actividad auditada');
    expect(source).toContain('/dashboard/admin/usuarios/${currentUser.id}/actividad');
    expect(source).not.toContain('currentUser.auditLogs');
  });

  it('defines a dedicated admin user audit activity page', () => {
    const pagePath = join(
      process.cwd(),
      'src/app/dashboard/admin/usuarios/[userId]/actividad/page.tsx'
    );

    expect(existsSync(pagePath)).toBe(true);

    const source = readFileSync(pagePath, 'utf8');

    expect(source).toContain('listUserAuditLogsForAdmin');
    expect(source).toContain('Actividad auditada');
  });
});
