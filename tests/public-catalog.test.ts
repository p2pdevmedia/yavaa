import { describe, expect, it, vi } from 'vitest';

import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';
import { listPublicCatalogCategories, listPublicCatalogLocations, listPublicCatalogMarkets } from '@/lib/public-catalog';

vi.mock('@/lib/env', () => ({
  hasDatabaseEnv: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const mockedHasDatabaseEnv = vi.mocked(hasDatabaseEnv);
const mockedGetPrismaClient = vi.mocked(getPrismaClient);

describe('public catalog', () => {
  it('falls back to demo categories when the database is unreachable', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findMany = vi.fn().mockRejectedValue({
      code: 'P1001'
    });

    mockedGetPrismaClient.mockReturnValue({
      category: {
        findMany
      }
    } as never);

    const categories = await listPublicCatalogCategories();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(categories).toHaveLength(9);
    expect(categories[0]).toMatchObject({
      slug: 'construction',
      name: 'Construction'
    });
  });

  it('falls back to demo markets when the database is unreachable', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findMany = vi.fn().mockRejectedValue({
      code: 'P1001'
    });

    mockedGetPrismaClient.mockReturnValue({
      market: {
        findMany
      }
    } as never);

    const markets = await listPublicCatalogMarkets();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(markets).toHaveLength(1);
    expect(markets[0]).toMatchObject({
      slug: 'san-martin-de-los-andes',
      city: 'San Martin de los Andes'
    });
  });

  it('uses Argentina municipality data for address selectors', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const locations = await listPublicCatalogLocations([]);
    const provinceNames = new Set(locations.map((location) => location.provinceName));
    const salta = locations.find((location) => location.provinceName === 'Salta' && location.cityName === 'Salta');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(provinceNames.size).toBe(24);
    expect(locations.length).toBeGreaterThan(2000);
    expect(salta).toMatchObject({
      provinceId: '66',
      provinceName: 'Salta',
      cityName: 'Salta'
    });
    expect(salta?.latitude).toEqual(expect.any(Number));
    expect(salta?.longitude).toEqual(expect.any(Number));

    vi.unstubAllGlobals();
  });
});
