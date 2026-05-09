import { put } from '@vercel/blob';

function sanitizeStorageSegment(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized.length > 0 ? normalized : 'file';
}

function sanitizeStorageFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const lastDotIndex = trimmed.lastIndexOf('.');

  if (lastDotIndex > 0 && lastDotIndex < trimmed.length - 1) {
    const baseName = sanitizeStorageSegment(trimmed.slice(0, lastDotIndex));
    const extension = sanitizeStorageSegment(trimmed.slice(lastDotIndex + 1));
    return `${baseName}.${extension}`;
  }

  return sanitizeStorageSegment(trimmed);
}

export function buildBookingFileStorageKey(bookingId: string, fileName: string): string {
  const safeFileName = sanitizeStorageFileName(fileName);
  return `bookings/${bookingId}/${crypto.randomUUID()}-${safeFileName}`;
}

export async function uploadBookingFileToBlob(bookingId: string, file: File): Promise<{
  storageKey: string;
  storageUrl: string;
}> {
  const storageKey = buildBookingFileStorageKey(bookingId, file.name);
  const blob = await put(storageKey, file, {
    access: 'public'
  });

  return {
    storageKey,
    storageUrl: blob.url
  };
}
