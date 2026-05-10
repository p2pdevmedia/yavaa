import { put } from '@vercel/blob';

const CONTRACTOR_PROFILE_FILE_MAX_BYTES = 5 * 1024 * 1024;
const CONTRACTOR_PROFILE_IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ContractorProfileFileKind = 'profile-photo' | 'dni-front' | 'dni-back';

const contractorProfileFileAccess = {
  'profile-photo': 'public',
  'dni-front': 'private',
  'dni-back': 'private'
} as const satisfies Record<ContractorProfileFileKind, 'public' | 'private'>;

const contractorProfileFileLabels = {
  'profile-photo': 'La foto laboral',
  'dni-front': 'El DNI frente',
  'dni-back': 'El DNI dorso'
} as const satisfies Record<ContractorProfileFileKind, string>;

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

export function validateContractorProfileFile(kind: ContractorProfileFileKind, file: File): string | null {
  const label = contractorProfileFileLabels[kind];

  if (file.size > CONTRACTOR_PROFILE_FILE_MAX_BYTES) {
    return `${label} no puede superar 5 MB.`;
  }

  if (!CONTRACTOR_PROFILE_IMAGE_CONTENT_TYPES.has(file.type)) {
    return `${label} debe ser JPG, PNG o WebP.`;
  }

  return null;
}

export function buildContractorProfileFileStorageKey(
  userId: string,
  kind: ContractorProfileFileKind,
  fileName: string
): string {
  const safeFileName = sanitizeStorageFileName(fileName);
  return `contractor-profiles/${userId}/${kind}/${crypto.randomUUID()}-${safeFileName}`;
}

export async function uploadContractorProfileFileToBlob(
  userId: string,
  kind: ContractorProfileFileKind,
  file: File
): Promise<{
  storageKey: string;
  storageUrl: string;
}> {
  const storageKey = buildContractorProfileFileStorageKey(userId, kind, file.name);
  const blob = await put(storageKey, file, {
    access: contractorProfileFileAccess[kind]
  });

  return {
    storageKey,
    storageUrl: blob.url
  };
}
