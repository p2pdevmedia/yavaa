import { describe, expect, it } from 'vitest';

import { formatLocalDateTime } from '@/lib/date-format';

describe('local date formatting', () => {
  it('formats ISO timestamps in the requested local timezone instead of hard-coded UTC', () => {
    expect(
      formatLocalDateTime('2026-05-09T15:00:00.000Z', {
        locale: 'es-AR',
        timeZone: 'America/Argentina/Salta'
      })
    ).toBe('09/05/2026, 12:00');
  });
});
