export const jobPaymentReceiptMaxBytes = 8 * 1024 * 1024;
export const jobPaymentReceiptContentTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
] as const;

export type JobPaymentReceiptContentType = (typeof jobPaymentReceiptContentTypes)[number];

const extensionByContentType: Record<JobPaymentReceiptContentType, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function slugifyFileName(fileName: string): string {
  const leafName = fileName.split(/[\\/]/).pop() ?? 'comprobante';
  const baseName = leafName.replace(/\.[^.]+$/, '');
  const slug = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'comprobante';
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function hasSafePathSegments(pathname: string): boolean {
  if (pathname.includes('\\') || pathname.includes('//')) {
    return false;
  }

  for (const segment of pathname.split('/')) {
    const decodedSegment = safeDecode(segment);

    if (
      !segment ||
      !decodedSegment ||
      decodedSegment === '.' ||
      decodedSegment === '..' ||
      decodedSegment.includes('/') ||
      decodedSegment.includes('\\')
    ) {
      return false;
    }
  }

  return true;
}

export function isAllowedJobPaymentReceiptContentType(
  contentType: string
): contentType is JobPaymentReceiptContentType {
  return (jobPaymentReceiptContentTypes as ReadonlyArray<string>).includes(contentType);
}

function matchesPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((byte, index) => bytes[index] === byte);
}

export function verifyJobPaymentReceiptMagicBytes(
  contentType: JobPaymentReceiptContentType,
  bytes: Uint8Array
): boolean {
  if (contentType === 'application/pdf') {
    return bytes.length >= 4 && matchesPrefix(bytes, [0x25, 0x50, 0x44, 0x46]);
  }

  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && matchesPrefix(bytes, [0xff, 0xd8, 0xff]);
  }

  if (contentType === 'image/png') {
    return (
      bytes.length >= 8 &&
      matchesPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }

  return (
    bytes.length >= 12 &&
    matchesPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export function getJobPaymentReceiptPath(
  userId: string,
  offerId: string,
  filename: string,
  contentType: JobPaymentReceiptContentType
): string {
  return `job-offers/${offerId}/payments/${userId}/${slugifyFileName(filename)}.${extensionByContentType[contentType]}`;
}

export function isJobPaymentReceiptPathForOffer(pathname: string, offerId: string): boolean {
  const prefix = `job-offers/${offerId}/payments/`;

  return pathname.startsWith(prefix) && pathname.length <= 400 && hasSafePathSegments(pathname);
}

export function isJobPaymentReceiptPathForUser(pathname: string, offerId: string, userId: string): boolean {
  const prefix = `job-offers/${offerId}/payments/${userId}/`;

  return pathname.startsWith(prefix) && pathname.length <= 400 && hasSafePathSegments(pathname);
}
