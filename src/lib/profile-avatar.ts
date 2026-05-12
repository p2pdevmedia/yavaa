export const profileAvatarContentTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const profileAvatarMaxBytes = 5 * 1024 * 1024;

export type ProfileAvatarContentType = (typeof profileAvatarContentTypes)[number];

const extensionByContentType: Record<ProfileAvatarContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function slugifyFileBase(fileName: string): string {
  const leafName = fileName.split(/[\\/]/).pop() ?? 'avatar';
  const baseName = leafName.replace(/\.[^.]+$/, '');
  const slug = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'avatar';
}

export function isAllowedProfileAvatarContentType(contentType: string): contentType is ProfileAvatarContentType {
  return (profileAvatarContentTypes as ReadonlyArray<string>).includes(contentType);
}

export function buildProfileAvatarBlobPath(
  userId: string,
  fileName: string,
  contentType: ProfileAvatarContentType
): string {
  return `profiles/${userId}/avatars/${slugifyFileBase(fileName)}.${extensionByContentType[contentType]}`;
}

export function isProfileAvatarBlobPath(value: string): boolean {
  return /^profiles\/[^/]+\/avatars\/[^/]+$/.test(value) && value.length <= 300;
}

export function isProfileAvatarBlobPathForUser(value: string, userId: string): boolean {
  const prefix = `profiles/${userId}/avatars/`;
  return value.startsWith(prefix) && isProfileAvatarBlobPath(value);
}

export function getPrivateProfileAvatarSrc(pathname: string): string {
  return `/api/profile/avatar?pathname=${encodeURIComponent(pathname)}`;
}
