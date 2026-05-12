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
    expect(form).toContain("fetch('/api/job-posts/photos'");
    expect(form).toContain('Publicar y recibir ofertas');
    expect(form).toContain('Fotos opcionales');
    expect(form).not.toContain('storage aparte');
    expect(form).toContain('Subir o tomar fotos');
    expect(form).toContain('capture="environment"');
  });

  it('uses a compact one-line date and time widget instead of preset chips', () => {
    const form = readProjectFile('src/components/jobs/publish-job-form.tsx');

    expect(form).not.toContain('datetime-local');
    expect(form).not.toContain('dateOptions');
    expect(form).not.toContain('timeSlots');
    expect(form).not.toContain('Hoy');
    expect(form).not.toContain('Mañana');
    expect(form).toContain('type="date"');
    expect(form).toContain('type="time"');
    expect(form).toContain('Fecha y hora');
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
