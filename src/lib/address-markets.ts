type MarketLookupClient = {
  market: {
    findFirst(args: {
      where: {
        city: {
          equals: string;
          mode: 'insensitive';
        };
        province: {
          equals: string;
          mode: 'insensitive';
        };
      };
      select: {
        id: true;
      };
    }): Promise<{ id: string } | null>;
  };
};

type AddressMarketInput = {
  marketId?: string | null;
  city?: string | null;
  province?: string | null;
};

function trimmed(value: string | null | undefined): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

export async function resolveAddressMarketId(
  prisma: MarketLookupClient,
  input: AddressMarketInput
): Promise<string | null | undefined> {
  if (input.marketId !== undefined) {
    return input.marketId;
  }

  const city = trimmed(input.city);
  const province = trimmed(input.province);
  if (!city || !province) {
    return undefined;
  }

  const market = await prisma.market.findFirst({
    where: {
      city: {
        equals: city,
        mode: 'insensitive'
      },
      province: {
        equals: province,
        mode: 'insensitive'
      }
    },
    select: {
      id: true
    }
  });

  return market?.id ?? null;
}
