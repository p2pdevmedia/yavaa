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
    expect(clientHome).toContain('Trabajos activos');
    expect(clientHome).toContain('Trabajos en progreso');
    expect(clientHome).toContain('Trabajos terminados');
    expect(clientHome).toContain('JobPostStatus.IN_PROGRESS');
    expect(clientHome).toContain('JobPostStatus.READY_FOR_REVIEW');
    expect(clientHome).toContain('JobPostStatus.CLOSED');
    expect(clientHome).toContain('jobPosts');
  });

  it('renders private profile photos through the authenticated avatar API', () => {
    const clientHome = readProjectFile('src/components/dashboard/client-home.tsx');

    expect(clientHome).toContain('getPrivateProfileAvatarSrc');
    expect(clientHome).toContain('profile?.avatarUrl');
  });

  it('opens the public jefe profile from the profile photo and exposes edit mode', () => {
    const clientHome = readProjectFile('src/components/dashboard/client-home.tsx');
    const profilePage = readProjectFile('src/app/dashboard/jefe/perfil/page.tsx');
    const onboardingPage = readProjectFile('src/app/dashboard/onboarding/[mode]/page.tsx');

    expect(clientHome).toContain('/dashboard/jefe/perfil');
    expect(profilePage).toContain('getDashboardPageContext');
    expect(profilePage).toContain("canSelectProfileMode(context.appUser.permissionContext, 'jefe')");
    expect(profilePage).toContain('Perfil público');
    expect(profilePage).toContain('/dashboard/onboarding/jefe?editar=1');
    expect(onboardingPage).toContain('searchParams');
    expect(onboardingPage).toContain("editar === '1'");
  });

  it('uses the client home component from the protected jefe route', () => {
    const page = readProjectFile('src/app/dashboard/jefe/page.tsx');

    expect(page).toContain('ClientHome');
    expect(page).toContain('listClientJobPosts');
    expect(page).toContain("hasCompletedOnboarding(context.appUser.user.profile, 'jefe')");
    expect(page).not.toContain('listActiveClientJobPosts(context.appUser.user.id, 3)');
  });

  it('links each active job post to protected detail and edit pages', () => {
    const clientHome = readProjectFile('src/components/dashboard/client-home.tsx');
    const detailPage = readProjectFile('src/app/dashboard/jefe/trabajos/[jobPostId]/page.tsx');
    const editPage = readProjectFile('src/app/dashboard/jefe/trabajos/[jobPostId]/editar/page.tsx');

    expect(clientHome).toContain('Ver');
    expect(clientHome).toContain('Editar');
    expect(clientHome).toContain('/dashboard/jefe/trabajos/');
    expect(clientHome).not.toContain('jobPosts.slice(0, 3)');
    expect(detailPage).toContain("hasRole(context.appUser.permissionContext, 'jefe')");
    expect(detailPage).toContain('getClientJobPostForDetail');
    expect(editPage).toContain("hasRole(context.appUser.permissionContext, 'jefe')");
    expect(editPage).toContain('getActiveClientJobPost');
    expect(editPage).toContain('EditJobForm');
  });
});
