import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('worker post-wizard home design', () => {
  it('shows verification, hourly rate, categories and nearby job results', () => {
    const workerHome = readProjectFile('src/components/dashboard/worker-home.tsx');

    expect(workerHome).toContain('Verificación');
    expect(workerHome).toContain('Precio por hora');
    expect(workerHome).toContain('Rubros');
    expect(workerHome).toContain('Trabajos cercanos');
    expect(workerHome).toContain('jobPosts.length > 0');
    expect(workerHome).toContain('/dashboard/trabajador/trabajos/');
    expect(workerHome).toContain('Ver trabajo');
  });

  it('uses the worker home component from the protected trabajador route', () => {
    const page = readProjectFile('src/app/dashboard/trabajador/page.tsx');

    expect(page).toContain('WorkerHome');
    expect(page).toContain('listPublishedWorkerJobPosts');
    expect(page).toContain("hasCompletedOnboarding(context.appUser.user.profile, 'trabajador')");
  });

  it('has a protected worker job detail page with the offer form', () => {
    const page = readProjectFile('src/app/dashboard/trabajador/trabajos/[jobPostId]/page.tsx');
    const form = readProjectFile('src/components/jobs/worker-offer-form.tsx');
    const readyAction = readProjectFile('src/components/jobs/worker-ready-action.tsx');

    expect(page).toContain('getDashboardPageContext(`/dashboard/trabajador/trabajos/${jobPostId}`)');
    expect(page).toContain('getWorkerJobPostForDetail(context.appUser.user.id, jobPostId)');
    expect(page).toContain('notFound()');
    expect(page).toContain('WorkerOfferForm');
    expect(page).toContain('WorkerReadyAction');
    expect(page).toContain('jobPost.status === JobPostStatus.PUBLISHED');
    expect(page).toContain('jobPost.status === JobPostStatus.IN_PROGRESS');
    expect(form).toContain('/api/job-offers');
    expect(form).toContain('amountPesos');
    expect(form).toContain('message');
    expect(form).toContain("const amountPesosErrorId = 'worker-offer-amountPesos-error'");
    expect(form).toContain("const messageErrorId = 'worker-offer-message-error'");
    expect(form).toContain("const jobPostErrorId = 'worker-offer-jobPost-error'");
    expect(form).toContain("const formErrorId = 'worker-offer-form-error'");
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.amountPesos?.length)}');
    expect(form).toContain('aria-describedby={fieldErrors.amountPesos?.length ? amountPesosErrorId : undefined}');
    expect(form).toContain('role="status"');
    expect(form).toContain('aria-live="polite"');
    expect(readyAction).toContain("fetch(`/api/job-offers/${offerId}/ready`");
    expect(readyAction).toContain('Marcar trabajo listo');
  });
});
