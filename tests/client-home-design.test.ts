import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('client post-wizard home design', () => {
  it('keeps publish job as the dominant client action', () => {
    const clientHome = readProjectFile('src/components/dashboard/client-home.tsx');

    expect(clientHome).toContain('Publicá un trabajo');
    expect(clientHome).toContain('/dashboard/jefe/publicar-trabajo');
    expect(clientHome).toContain('Buscar trabajadores');
    expect(clientHome).toContain('/dashboard/jefe/buscar-trabajadores');
    expect(clientHome).toContain('Ofertas sugeridas');
  });

  it('renders private profile photos through the authenticated avatar API', () => {
    const clientHome = readProjectFile('src/components/dashboard/client-home.tsx');

    expect(clientHome).toContain('getPrivateProfileAvatarSrc');
    expect(clientHome).toContain('profile?.avatarUrl');
  });

  it('uses the client home component from the protected jefe route', () => {
    const page = readProjectFile('src/app/dashboard/jefe/page.tsx');

    expect(page).toContain('ClientHome');
    expect(page).toContain("hasCompletedOnboarding(context.appUser.user.profile, 'jefe')");
  });
});
