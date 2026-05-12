import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('stage 5 marketplace screens', () => {
  it('connects the protected publish job page to a mobile form and API', () => {
    const page = readProjectFile('src/app/dashboard/jefe/publicar-trabajo/page.tsx');
    const form = readProjectFile('src/components/jobs/publish-job-form.tsx');

    expect(page).toContain('PublishJobForm');
    expect(page).toContain("hasCompletedOnboarding(context.appUser.user.profile, 'jefe')");
    expect(form).toContain("fetch('/api/job-posts'");
    expect(form).toContain('Publicar y recibir ofertas');
    expect(form).toContain('Fotos opcionales');
  });

  it('connects the protected worker search page to the search API', () => {
    const page = readProjectFile('src/app/dashboard/jefe/buscar-trabajadores/page.tsx');
    const search = readProjectFile('src/components/workers/worker-search.tsx');

    expect(page).toContain('WorkerSearch');
    expect(search).toContain('/api/workers/search?');
    expect(search).toContain('fetch(searchUrl)');
    expect(search).toContain('Buscar trabajadores');
    expect(search).toContain('Precio por hora');
  });

  it('renders recent client job posts on client home', () => {
    const page = readProjectFile('src/app/dashboard/jefe/page.tsx');
    const home = readProjectFile('src/components/dashboard/client-home.tsx');

    expect(page).toContain('listClientJobPosts');
    expect(home).toContain('jobPosts');
    expect(home).toContain('Trabajos activos');
  });
});
