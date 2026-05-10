import { describe, expect, it, vi } from 'vitest';

import { resolveAddressMarketId } from '@/lib/address-markets';

describe('address market resolution', () => {
  it('keeps an explicit market id from native clients', async () => {
    const findFirst = vi.fn();
    const prisma = {
      market: {
        findFirst
      }
    };

    await expect(
      resolveAddressMarketId(prisma, {
        marketId: '99999999-9999-4999-8999-999999999999',
        city: 'Salta',
        province: 'Salta'
      })
    ).resolves.toBe('99999999-9999-4999-8999-999999999999');
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('matches a market by city and province when iPhone omits market id', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: '99999999-9999-4999-8999-999999999999'
    });
    const prisma = {
      market: {
        findFirst
      }
    };

    await expect(
      resolveAddressMarketId(prisma, {
        city: ' Salta ',
        province: ' salta '
      })
    ).resolves.toBe('99999999-9999-4999-8999-999999999999');

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        city: {
          equals: 'Salta',
          mode: 'insensitive'
        },
        province: {
          equals: 'salta',
          mode: 'insensitive'
        }
      },
      select: {
        id: true
      }
    });
  });
});
