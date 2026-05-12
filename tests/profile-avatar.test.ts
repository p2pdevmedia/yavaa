import { describe, expect, it } from 'vitest';

import {
  buildProfileAvatarBlobPath,
  getPrivateProfileAvatarSrc,
  isAllowedProfileAvatarContentType,
  isProfileAvatarBlobPathForUser
} from '@/lib/profile-avatar';

describe('private profile avatar helpers', () => {
  it('builds user-scoped Vercel Blob paths for private profile photos', () => {
    expect(buildProfileAvatarBlobPath('user_001', 'Mi foto final.PNG', 'image/png')).toBe(
      'profiles/user_001/avatars/mi-foto-final.png'
    );
    expect(buildProfileAvatarBlobPath('user_001', '../../avatar.jpeg', 'image/jpeg')).toBe(
      'profiles/user_001/avatars/avatar.jpg'
    );
  });

  it('allows only web image content types supported by the mobile profile photo flow', () => {
    expect(isAllowedProfileAvatarContentType('image/jpeg')).toBe(true);
    expect(isAllowedProfileAvatarContentType('image/png')).toBe(true);
    expect(isAllowedProfileAvatarContentType('image/webp')).toBe(true);
    expect(isAllowedProfileAvatarContentType('image/svg+xml')).toBe(false);
  });

  it('keeps private avatar reads scoped to the owning user prefix', () => {
    expect(isProfileAvatarBlobPathForUser('profiles/user_001/avatars/avatar.jpg', 'user_001')).toBe(true);
    expect(isProfileAvatarBlobPathForUser('profiles/user_002/avatars/avatar.jpg', 'user_001')).toBe(false);
    expect(isProfileAvatarBlobPathForUser('profiles/user_001/avatars/nested/avatar.jpg', 'user_001')).toBe(false);
    expect(isProfileAvatarBlobPathForUser('https://example.com/avatar.jpg', 'user_001')).toBe(false);
  });

  it('routes private avatar previews through the authenticated API', () => {
    expect(getPrivateProfileAvatarSrc('profiles/user_001/avatars/avatar.jpg')).toBe(
      '/api/profile/avatar?pathname=profiles%2Fuser_001%2Favatars%2Favatar.jpg'
    );
  });
});
