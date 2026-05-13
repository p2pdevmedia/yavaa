import { describe, expect, it } from 'vitest';

import {
  getJobPaymentReceiptPath,
  isAllowedJobPaymentReceiptContentType,
  isJobPaymentReceiptPathForOffer,
  isJobPaymentReceiptPathForUser,
  verifyJobPaymentReceiptMagicBytes
} from '@/lib/job-payment-receipts';
import {
  buildJobPhotoBlobPath,
  getPrivateJobPhotoSrc,
  isAllowedJobPhotoContentType,
  isJobPhotoBlobPathForUser
} from '@/lib/job-photos';

describe('job photo blob helpers', () => {
  it('builds private job photo paths under the owning user prefix', () => {
    expect(buildJobPhotoBlobPath('user_001', 'Pared Final.PNG', 'image/png')).toBe(
      'jobs/user_001/photos/pared-final.png'
    );
  });

  it('only allows supported image content types', () => {
    expect(isAllowedJobPhotoContentType('image/jpeg')).toBe(true);
    expect(isAllowedJobPhotoContentType('text/plain')).toBe(false);
  });

  it('authorizes reads only inside the current user job photo prefix', () => {
    expect(isJobPhotoBlobPathForUser('jobs/user_001/photos/pared.jpg', 'user_001')).toBe(true);
    expect(isJobPhotoBlobPathForUser('jobs/user_002/photos/pared.jpg', 'user_001')).toBe(false);
  });

  it('creates authenticated preview URLs for private job photos', () => {
    expect(getPrivateJobPhotoSrc('jobs/user_001/photos/pared.jpg')).toBe(
      '/api/job-posts/photos?pathname=jobs%2Fuser_001%2Fphotos%2Fpared.jpg'
    );
  });
});

describe('job payment receipt helpers', () => {
  it('allows payment receipt PDF and image content types', () => {
    expect(isAllowedJobPaymentReceiptContentType('application/pdf')).toBe(true);
    expect(isAllowedJobPaymentReceiptContentType('image/png')).toBe(true);
    expect(isAllowedJobPaymentReceiptContentType('image/jpeg')).toBe(true);
    expect(isAllowedJobPaymentReceiptContentType('image/webp')).toBe(true);
  });

  it('rejects unsupported payment receipt content types', () => {
    expect(isAllowedJobPaymentReceiptContentType('text/plain')).toBe(false);
    expect(isAllowedJobPaymentReceiptContentType('application/json')).toBe(false);
    expect(isAllowedJobPaymentReceiptContentType('image/svg+xml')).toBe(false);
    expect(isAllowedJobPaymentReceiptContentType('image/gif')).toBe(false);
  });

  it('verifies payment receipt magic bytes for the declared safe content type', () => {
    expect(verifyJobPaymentReceiptMagicBytes('application/pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe(true);
    expect(verifyJobPaymentReceiptMagicBytes('image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xdb]))).toBe(true);
    expect(
      verifyJobPaymentReceiptMagicBytes(
        'image/png',
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ).toBe(true);
    expect(
      verifyJobPaymentReceiptMagicBytes(
        'image/webp',
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x01, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
      )
    ).toBe(true);
    expect(verifyJobPaymentReceiptMagicBytes('image/png', new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe(false);
  });

  it('builds private payment receipt paths with extensions from the validated content type', () => {
    expect(getJobPaymentReceiptPath('user_001', 'offer_001', 'Comprobante Final.PDF', 'application/pdf')).toBe(
      'job-offers/offer_001/payments/user_001/comprobante-final.pdf'
    );
    expect(getJobPaymentReceiptPath('user_001', 'offer_001', 'Comprobante Final.html', 'image/png')).toBe(
      'job-offers/offer_001/payments/user_001/comprobante-final.png'
    );
  });

  it('authorizes receipt paths only inside the current offer namespace without traversal', () => {
    expect(
      isJobPaymentReceiptPathForOffer(
        'job-offers/offer_001/payments/user_001/comprobante-final.pdf',
        'offer_001'
      )
    ).toBe(true);
    expect(
      isJobPaymentReceiptPathForOffer(
        'job-offers/offer_999/payments/user_001/comprobante-final.pdf',
        'offer_001'
      )
    ).toBe(false);
    expect(
      isJobPaymentReceiptPathForOffer(
        'job-offers/offer_001/payments/user_001/../comprobante-final.pdf',
        'offer_001'
      )
    ).toBe(false);
    expect(
      isJobPaymentReceiptPathForOffer(
        'job-offers/offer_001/payments/user_001/%2e%2e/comprobante-final.pdf',
        'offer_001'
      )
    ).toBe(false);
  });

  it('authorizes receipt paths only inside the current offer and user namespace', () => {
    expect(
      isJobPaymentReceiptPathForUser(
        'job-offers/offer_001/payments/user_001/comprobante-final.pdf',
        'offer_001',
        'user_001'
      )
    ).toBe(true);
    expect(
      isJobPaymentReceiptPathForUser(
        'job-offers/offer_001/payments/user_002/comprobante-final.pdf',
        'offer_001',
        'user_001'
      )
    ).toBe(false);
    expect(
      isJobPaymentReceiptPathForUser(
        'job-offers/offer_001/payments/user_001/../comprobante-final.pdf',
        'offer_001',
        'user_001'
      )
    ).toBe(false);
  });
});
