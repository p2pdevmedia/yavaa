import { describe, expect, it } from 'vitest';

import { buildBookingFileStorageKey } from '@/lib/booking-file-storage';

describe('booking file storage helpers', () => {
  it('builds a safe booking storage key from the file name', () => {
    const key = buildBookingFileStorageKey('booking_001', 'Mi foto final!.JPG');

    expect(key).toMatch(/^bookings\/booking_001\/[0-9a-f-]{36}-mi-foto-final\.jpg$/);
  });
});
