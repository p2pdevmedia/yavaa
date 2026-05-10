import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin user contractor review UI', () => {
  it('lets admins review a pending contractor profile from the user detail screen', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/dashboard/admin-user-detail.tsx'),
      'utf8'
    );

    expect(source).toContain('Verificación de contratista');
    expect(source).toContain('/api/admin/contractors/${currentUser.contractorProfile.id}');
    expect(source).toContain('Aprobar contratista');
    expect(source).toContain('Rechazar contratista');
    expect(source).toContain('PENDING_REVIEW');
  });
});
