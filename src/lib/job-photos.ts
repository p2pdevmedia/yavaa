export const jobPhotoContentTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const jobPhotoMaxBytes = 8 * 1024 * 1024;
export const maxJobPhotos = 6;

export type JobPhotoContentType = (typeof jobPhotoContentTypes)[number];

const extensionByContentType: Record<JobPhotoContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function slugifyFileBase(fileName: string): string {
  const leafName = fileName.split(/[\\/]/).pop() ?? 'foto';
  const baseName = leafName.replace(/\.[^.]+$/, '');
  const slug = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'foto';
}

export function isAllowedJobPhotoContentType(contentType: string): contentType is JobPhotoContentType {
  return (jobPhotoContentTypes as ReadonlyArray<string>).includes(contentType);
}

export function buildJobPhotoBlobPath(userId: string, fileName: string, contentType: JobPhotoContentType): string {
  return `jobs/${userId}/photos/${slugifyFileBase(fileName)}.${extensionByContentType[contentType]}`;
}

export function isJobPhotoBlobPath(value: string): boolean {
  return /^jobs\/[^/]+\/photos\/[^/]+$/.test(value) && value.length <= 300;
}

export function isJobPhotoBlobPathForUser(value: string, userId: string): boolean {
  const prefix = `jobs/${userId}/photos/`;
  return value.startsWith(prefix) && isJobPhotoBlobPath(value);
}

export function getPrivateJobPhotoSrc(pathname: string): string {
  return `/api/job-posts/photos?pathname=${encodeURIComponent(pathname)}`;
}
