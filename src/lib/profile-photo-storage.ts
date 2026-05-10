import { put } from '@vercel/blob';

const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

export function validateProfilePhotoFile(file: File): string | null {
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return 'La foto de perfil no puede superar 5 MB.';
  }

  if (!PROFILE_PHOTO_CONTENT_TYPES.has(file.type)) {
    return 'La foto de perfil debe ser JPG, PNG o WebP.';
  }

  return null;
}

export function buildProfilePhotoStorageKey(userId: string, fileName: string): string {
  const safeFileName = sanitizeStorageFileName(fileName);
  return `profiles/${userId}/${crypto.randomUUID()}-${safeFileName}`;
}

export async function uploadProfilePhotoToBlob(userId: string, file: File): Promise<{
  storageKey: string;
  storageUrl: string;
}> {
  const storageKey = buildProfilePhotoStorageKey(userId, file.name);
  const blob = await put(storageKey, file, {
    access: 'private'
  });

  return {
    storageKey,
    storageUrl: blob.url
  };
}
