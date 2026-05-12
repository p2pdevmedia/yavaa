import { describe, expect, it } from 'vitest';

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
