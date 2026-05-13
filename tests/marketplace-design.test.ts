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

  it('does not force future dates when editing existing job posts', () => {
    const publishForm = readProjectFile('src/components/jobs/publish-job-form.tsx');
    const editForm = readProjectFile('src/components/jobs/edit-job-form.tsx');

    expect(publishForm).toContain('min={todayDate}');
    expect(editForm).not.toContain('min={todayDate}');
  });

  it('connects the protected worker search page to the search API', () => {
    const page = readProjectFile('src/app/dashboard/jefe/buscar-trabajadores/page.tsx');
    const search = readProjectFile('src/components/workers/worker-search.tsx');

    expect(page).toContain('WorkerSearch');
    expect(search).toContain('/api/workers/search?');
    expect(search).toContain('fetch(searchUrl)');
    expect(search).toContain('Buscar trabajadores');
    expect(search).toContain('Precio por hora');
    expect(search).toContain('Ver perfil público');
    expect(search).toContain('Estrellas');
    expect(search).toContain('Historial de trabajos');
    expect(search).toContain('Sin calificaciones todavía');
  });

  it('renders grouped client job posts on client home', () => {
    const page = readProjectFile('src/app/dashboard/jefe/page.tsx');
    const home = readProjectFile('src/components/dashboard/client-home.tsx');

    expect(page).toContain('listClientDashboardJobPosts');
    expect(home).toContain('jobPosts');
    expect(home).toContain('Trabajos activos');
    expect(home).toContain('Trabajos en progreso');
    expect(home).toContain('Trabajos terminados');
  });

  it('renders client offer management on job detail pages', () => {
    const page = readProjectFile('src/app/dashboard/jefe/trabajos/[jobPostId]/page.tsx');
    const actions = readProjectFile('src/components/jobs/client-offer-actions.tsx');
    const chat = readProjectFile('src/components/jobs/offer-chat.tsx');
    const payments = readProjectFile('src/components/jobs/job-payment-form.tsx');
    const workerReadyAction = readProjectFile('src/components/jobs/worker-ready-action.tsx');
    const clientReviewActions = readProjectFile('src/components/jobs/client-review-actions.tsx');
    const messagesRoute = readProjectFile('src/app/api/job-offers/[offerId]/messages/route.ts');
    const paymentsRoute = readProjectFile('src/app/api/job-offers/[offerId]/payments/route.ts');
    const receiptsRoute = readProjectFile('src/app/api/job-offers/[offerId]/payments/receipts/route.ts');
    const readyRoute = readProjectFile('src/app/api/job-offers/[offerId]/ready/route.ts');
    const reviewRoute = readProjectFile('src/app/api/job-offers/[offerId]/review/route.ts');
    const workerPage = readProjectFile('src/app/dashboard/trabajador/trabajos/[jobPostId]/page.tsx');

    expect(page).toContain('getClientJobPostForDetail');
    expect(page).not.toContain('getActiveClientJobPost');
    expect(page).toContain('listClientJobOffers');
    expect(page).toContain('Ofertas recibidas');
    expect(page).toContain('OfferChat');
    expect(page).toContain('JobPaymentForm');
    expect(page).toContain('ClientReviewActions');
    expect(page).toContain('initialPayments={offer.payments}');
    expect(page).toContain('canMessageOffer');
    expect(page).toContain('jobPostStatus === JobPostStatus.PUBLISHED');
    expect(page).toContain('jobPostStatus === JobPostStatus.IN_PROGRESS');
    expect(page).toContain('jobPostStatus === JobPostStatus.READY_FOR_REVIEW');
    expect(actions).toContain('Aceptar oferta');
    expect(actions).toContain('Rechazar');
    expect(actions).toContain("fetch(`/api/job-offers/${offerId}`");
    expect(chat).toContain("fetch(`/api/job-offers/${offerId}/messages`");
    expect(chat).toContain('aria-invalid');
    expect(chat).toContain('aria-busy={isSubmitting}');
    expect(chat).toContain('role="status"');
    expect(payments).toContain("fetch(`/api/job-offers/${offerId}/payments/receipts`");
    expect(payments).toContain("fetch(`/api/job-offers/${offerId}/payments`");
    expect(payments).toContain('Comprobante opcional');
    expect(payments).toContain('aria-invalid');
    expect(payments).toContain('role="status"');
    expect(payments).toContain('serializePaidAtForPayload');
    expect(payments).not.toContain('paidAt: new Date(paidAt).toISOString()');
    expect(workerReadyAction).toContain("fetch(`/api/job-offers/${offerId}/ready`");
    expect(workerReadyAction).toContain('Marcar trabajo listo');
    expect(workerReadyAction).toContain('aria-busy={isSubmitting}');
    expect(workerReadyAction).toContain('role="status"');
    expect(clientReviewActions).toContain("fetch(`/api/job-offers/${offerId}/review`");
    expect(clientReviewActions).toContain('Aceptar trabajo');
    expect(clientReviewActions).toContain('Falta algo');
    expect(clientReviewActions).toContain('needs_changes');
    expect(clientReviewActions).toContain('aria-invalid');
    expect(clientReviewActions).toContain('role="status"');
    expect(messagesRoute).toContain('listOfferMessages(auth, offerId)');
    expect(messagesRoute).toContain('addOfferMessage(auth, offerId, json.body)');
    expect(paymentsRoute).toContain('listJobPayments(auth, offerId)');
    expect(paymentsRoute).toContain('createJobPayment(auth, offerId, json.body)');
    expect(receiptsRoute).toContain("access: 'private'");
    expect(receiptsRoute).toContain('getJobPaymentReceiptPath');
    expect(readyRoute).toContain('markJobOfferReady(auth, offerId)');
    expect(reviewRoute).toContain('reviewReadyJobOffer(auth, offerId, json.body)');
    expect(workerPage).toContain('getWorkerJobPostForDetail');
    expect(workerPage).toContain('WorkerReadyAction');
    expect(workerPage).toContain('jobPost.status === JobPostStatus.IN_PROGRESS');
  });
});
