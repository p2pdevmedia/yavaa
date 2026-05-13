import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

describe('worker post-wizard home design', () => {
  it('shows verification, hourly rate, categories, nearby jobs, active work and finished work', () => {
    const workerHome = readProjectFile('src/components/dashboard/worker-home.tsx');

    expect(workerHome).toContain('Verificación');
    expect(workerHome).toContain('Precio por hora');
    expect(workerHome).toContain('Rubros');
    expect(workerHome).toContain('Trabajos cercanos');
    expect(workerHome).toContain('Trabajos en curso');
    expect(workerHome).toContain('Trabajos terminados');
    expect(workerHome).toContain('jobPosts.length > 0');
    expect(workerHome).toContain('acceptedJobPosts');
    expect(workerHome).toContain('JobPostStatus.IN_PROGRESS');
    expect(workerHome).toContain('JobPostStatus.READY_FOR_REVIEW');
    expect(workerHome).toContain('JobPostStatus.CLOSED');
    expect(workerHome).toContain('/dashboard/trabajador/trabajos/');
    expect(workerHome).toContain('aria-label={`Abrir trabajo ${jobPost.title}`}');
    expect(workerHome).toContain('absolute inset-0');
    expect(workerHome).not.toContain('>Ver trabajo</Link>');
  });

  it('renders private profile photos through the authenticated avatar API', () => {
    const workerHome = readProjectFile('src/components/dashboard/worker-home.tsx');

    expect(workerHome).toContain('getPrivateProfileAvatarSrc');
    expect(workerHome).toContain('profile?.avatarUrl');
    expect(workerHome).toContain('Foto de perfil de');
  });

  it('uses the worker home component from the protected trabajador route', () => {
    const page = readProjectFile('src/app/dashboard/trabajador/page.tsx');

    expect(page).toContain('WorkerHome');
    expect(page).toContain('listPublishedWorkerJobPosts');
    expect(page).toContain('listAcceptedWorkerJobPosts(context.appUser.user.id)');
    expect(page).toContain("hasCompletedOnboarding(context.appUser.user.profile, 'trabajador')");
  });

  it('has a protected worker job detail page with the offer form', () => {
    const page = readProjectFile('src/app/dashboard/trabajador/trabajos/[jobPostId]/page.tsx');
    const form = readProjectFile('src/components/jobs/worker-offer-form.tsx');
    const readyAction = readProjectFile('src/components/jobs/worker-ready-action.tsx');
    const offerSummary = readProjectFile('src/components/jobs/worker-offer-summary.tsx');
    const offerChat = readProjectFile('src/components/jobs/worker-offer-chat.tsx');
    const jobPayments = readProjectFile('src/components/jobs/worker-job-payments.tsx');

    expect(page).toContain('getDashboardPageContext(`/dashboard/trabajador/trabajos/${jobPostId}`)');
    expect(page).toContain('getWorkerJobPostForDetail(context.appUser.user.id, jobPostId)');
    expect(page).toContain('notFound()');
    expect(page).toContain('WorkerOfferForm');
    expect(page).toContain('WorkerReadyAction');
    expect(page).toContain('WorkerOfferSummary');
    expect(page).toContain('WorkerOfferChat');
    expect(page).toContain('WorkerJobPayments');
    expect(page).toContain('initialMessages={acceptedOffer.messages}');
    expect(page).toContain('initialPayments={acceptedOffer.payments}');
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
    expect(offerSummary).toContain('Tu oferta');
    expect(offerSummary).toContain('formatAmountCents');
    expect(offerChat).toContain('Chat con el cliente');
    expect(offerChat).toContain("fetch(`/api/job-offers/${offerId}/messages`");
    expect(offerChat).toContain('aria-busy={isSubmitting}');
    expect(jobPayments).toContain('Pagos del trabajo');
    expect(jobPayments).toContain("fetch(`/api/job-offers/${offerId}/payments/receipts`");
    expect(jobPayments).toContain("fetch(`/api/job-offers/${offerId}/payments`");
    expect(jobPayments).toContain('Registrar pago');
    expect(jobPayments).toContain('serializePaidAtForPayload');
  });

  it('shows active work payment progress with budget paid and remaining colors', () => {
    const workerHome = readProjectFile('src/components/dashboard/worker-home.tsx');
    const paymentProgress = readProjectFile('src/components/dashboard/job-payment-progress.tsx');

    expect(workerHome).toContain('JobPaymentProgress');
    expect(paymentProgress).toContain('Presupuesto');
    expect(paymentProgress).toContain('Pagado');
    expect(paymentProgress).toContain('Falta pagar');
    expect(paymentProgress).toContain('text-green-700');
    expect(paymentProgress).toContain('text-yellow-700');
    expect(paymentProgress).toContain('text-red-700');
    expect(paymentProgress).toContain('getPaymentProgress');
  });
});
