import { ContractorApprovalStatus, Prisma, UserStatus } from '@prisma/client';

import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';
import { isDatabaseUnavailableError, shouldUsePublicDemoFallback } from '@/lib/public-db-fallback';

export type PublicProviderSearchFilters = {
  category?: string | null;
  market?: string | null;
  query?: string | null;
};

export type PublicProviderCard = {
  contractorProfileId: string;
  displayName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  acceptsEmergencies: boolean;
  marketSlug: string | null;
  marketCity: string | null;
  marketProvince: string | null;
  categories: Array<{
    slug: string;
    name: string;
    group: string | null;
    isPrimary: boolean;
  }>;
};

export type PublicProviderProfile = PublicProviderCard & {
  phone: string | null;
  workZones: Array<{
    slug: string;
    name: string;
    description: string | null;
  }>;
};

type PublicProviderRecord = {
  id: string;
  acceptsEmergencies: boolean;
  profilePhotoUrl: string | null;
  user: {
    displayName: string | null;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      bio: string | null;
      phone: string | null;
    } | null;
  };
  categories: Array<{
    isPrimary: boolean;
    category: {
      slug: string;
      name: string;
      group: string | null;
    };
  }>;
  workZones: Array<{
    workZone: {
      slug: string;
      name: string;
      description: string | null;
      market: {
        slug: string;
        city: string;
        province: string;
      };
    };
  }>;
};

const demoPublicProviderId = '33333333-3333-3333-3333-333333333333';
const demoPublicProvider = {
  contractorProfileId: demoPublicProviderId,
  displayName: 'Carlos Perez',
  bio: 'Approved deterministic contractor used by public discovery tests.',
  phone: '+5492975550101',
  profilePhotoUrl: null,
  acceptsEmergencies: true,
  marketSlug: 'san-martin-de-los-andes',
  marketCity: 'San Martin de los Andes',
  marketProvince: 'Neuquen',
  categories: [
    {
      slug: 'home-services',
      name: 'Home Services',
      group: 'home services',
      isPrimary: true
    }
  ],
  workZones: [
    {
      slug: 'central',
      name: 'Centro',
      description: 'Zona central de San Martin de los Andes'
    }
  ]
} as const satisfies PublicProviderProfile;

function buildDisplayName(record: PublicProviderRecord): string {
  const firstName = record.user.profile?.firstName?.trim();
  const lastName = record.user.profile?.lastName?.trim();
  const composedName = [firstName, lastName].filter((value): value is string => Boolean(value)).join(' ').trim();

  if (composedName) {
    return composedName;
  }

  if (record.user.displayName?.trim()) {
    return record.user.displayName.trim();
  }

  return 'Proveedor';
}

function mapCategories(
  categories: PublicProviderRecord['categories']
): PublicProviderCard['categories'] {
  return [...categories]
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return left.isPrimary ? -1 : 1;
      }

      return left.category.name.localeCompare(right.category.name);
    })
    .map((link) => ({
      slug: link.category.slug,
      name: link.category.name,
      group: link.category.group,
      isPrimary: link.isPrimary
    }));
}

function mapWorkZones(
  workZones: PublicProviderRecord['workZones']
): PublicProviderProfile['workZones'] {
  return [...workZones]
    .sort((left, right) => {
      const marketSort = left.workZone.market.city.localeCompare(right.workZone.market.city);

      if (marketSort !== 0) {
        return marketSort;
      }

      return left.workZone.name.localeCompare(right.workZone.name);
    })
    .map((link) => ({
      slug: link.workZone.slug,
      name: link.workZone.name,
      description: link.workZone.description
    }));
}

function mapProviderRecord(record: PublicProviderRecord): PublicProviderCard {
  const primarySourceWorkZone =
    [...record.workZones]
      .sort((left, right) => {
        const marketSort = left.workZone.market.city.localeCompare(right.workZone.market.city);

        if (marketSort !== 0) {
          return marketSort;
        }

        return left.workZone.name.localeCompare(right.workZone.name);
      })[0]?.workZone ?? null;

  return {
    contractorProfileId: record.id,
    displayName: buildDisplayName(record),
    bio: record.user.profile?.bio ?? null,
    profilePhotoUrl: record.user.profile?.avatarUrl ?? record.profilePhotoUrl,
    acceptsEmergencies: record.acceptsEmergencies,
    marketSlug: primarySourceWorkZone ? primarySourceWorkZone.market.slug : null,
    marketCity: primarySourceWorkZone ? primarySourceWorkZone.market.city : null,
    marketProvince: primarySourceWorkZone ? primarySourceWorkZone.market.province : null,
    categories: mapCategories(record.categories)
  };
}

function mapProviderProfile(record: PublicProviderRecord): PublicProviderProfile {
  const workZones = mapWorkZones(record.workZones);

  return {
    ...mapProviderRecord(record),
    phone: record.user.profile?.phone ?? null,
    workZones
  };
}

function providerMatchesTextSearch(provider: PublicProviderProfile, query: string | null): boolean {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const searchableValues = [
    provider.displayName,
    provider.bio,
    provider.marketCity,
    provider.marketProvince,
    provider.marketSlug,
    ...provider.categories.flatMap((category) => [category.name, category.group, category.slug]),
    ...provider.workZones.flatMap((workZone) => [workZone.name, workZone.description, workZone.slug])
  ];

  return searchableValues.some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
}

export async function listPublicProviders(
  filters: PublicProviderSearchFilters
): Promise<{ items: PublicProviderCard[] }> {
  const category = filters.category?.trim() ?? null;
  const market = filters.market?.trim() ?? null;
  const query = filters.query?.trim() ?? null;

  if (!hasDatabaseEnv()) {
    const matchesCategory = !category || demoPublicProvider.categories.some((item) => item.slug === category);
    const matchesMarket = !market || demoPublicProvider.marketSlug === market;
    const matchesQuery = providerMatchesTextSearch(demoPublicProvider, query);

    return {
      items: matchesCategory && matchesMarket && matchesQuery ? [demoPublicProvider] : []
    };
  }

  try {
    const prisma = getPrismaClient();
    const textSearchMode = 'insensitive' as const;
    const textSearchClauses: Prisma.ContractorProfileWhereInput[] = query
      ? [
          {
            user: {
              displayName: {
                contains: query,
                mode: textSearchMode
              }
            }
          },
          {
            user: {
              profile: {
                is: {
                  firstName: {
                    contains: query,
                    mode: textSearchMode
                  }
                }
              }
            }
          },
          {
            user: {
              profile: {
                is: {
                  lastName: {
                    contains: query,
                    mode: textSearchMode
                  }
                }
              }
            }
          },
          {
            user: {
              profile: {
                is: {
                  bio: {
                    contains: query,
                    mode: textSearchMode
                  }
                }
              }
            }
          },
          {
            categories: {
              some: {
                category: {
                  name: {
                    contains: query,
                    mode: textSearchMode
                  }
                }
              }
            }
          },
          {
            workZones: {
              some: {
                workZone: {
                  name: {
                    contains: query,
                    mode: textSearchMode
                  }
                }
              }
            }
          },
          {
            workZones: {
              some: {
                workZone: {
                  market: {
                    city: {
                      contains: query,
                      mode: textSearchMode
                    }
                  }
                }
              }
            }
          }
        ]
      : [];
    const where: Prisma.ContractorProfileWhereInput = {
      approvalStatus: ContractorApprovalStatus.APPROVED,
      user: {
        status: UserStatus.ACTIVE
      },
      ...(textSearchClauses.length > 0 ? { OR: textSearchClauses } : {}),
      ...(category
        ? {
            categories: {
              some: {
                category: {
                  slug: category
                }
              }
            }
          }
        : {}),
      ...(market
        ? {
            workZones: {
              some: {
                workZone: {
                  market: {
                    slug: market
                  }
                }
              }
            }
          }
        : {})
    };

    const records = (await prisma.contractorProfile.findMany({
      where,
      select: {
        id: true,
        acceptsEmergencies: true,
        profilePhotoUrl: true,
        user: {
          select: {
            displayName: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                bio: true,
                phone: true
              }
            }
          }
        },
        categories: {
          select: {
            isPrimary: true,
            category: {
              select: {
                slug: true,
                name: true,
                group: true
              }
            }
          }
        },
        workZones: {
          select: {
            workZone: {
              select: {
                slug: true,
                name: true,
                description: true,
                market: {
                  select: {
                    slug: true,
                    city: true,
                    province: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        user: {
          displayName: 'asc'
        }
      }
    })) as PublicProviderRecord[];

    if (records.length === 0 && shouldUsePublicDemoFallback()) {
      const matchesCategory = !category || demoPublicProvider.categories.some((item) => item.slug === category);
      const matchesMarket = !market || demoPublicProvider.marketSlug === market;
      const matchesQuery = providerMatchesTextSearch(demoPublicProvider, query);

      return {
        items: matchesCategory && matchesMarket && matchesQuery ? [demoPublicProvider] : []
      };
    }

    return {
      items: records.map(mapProviderRecord)
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const matchesCategory = !category || demoPublicProvider.categories.some((item) => item.slug === category);
      const matchesMarket = !market || demoPublicProvider.marketSlug === market;
      const matchesQuery = providerMatchesTextSearch(demoPublicProvider, query);

      return {
        items: shouldUsePublicDemoFallback() && matchesCategory && matchesMarket && matchesQuery ? [demoPublicProvider] : []
      };
    }

    throw error;
  }
}

export async function getPublicProviderProfile(
  contractorProfileId: string
): Promise<PublicProviderProfile | null> {
  if (!hasDatabaseEnv()) {
    return contractorProfileId === demoPublicProviderId ? demoPublicProvider : null;
  }

  try {
    const prisma = getPrismaClient();
    const record = (await prisma.contractorProfile.findFirst({
      where: {
        id: contractorProfileId,
        approvalStatus: ContractorApprovalStatus.APPROVED,
        user: {
          status: UserStatus.ACTIVE
        }
      },
      select: {
        id: true,
        acceptsEmergencies: true,
        profilePhotoUrl: true,
        user: {
          select: {
            displayName: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                bio: true,
                phone: true
              }
            }
          }
        },
        categories: {
          select: {
            isPrimary: true,
            category: {
              select: {
                slug: true,
                name: true,
                group: true
              }
            }
          }
        },
        workZones: {
          select: {
            workZone: {
              select: {
                slug: true,
                name: true,
                description: true,
                market: {
                  select: {
                    slug: true,
                    city: true,
                    province: true
                  }
                }
              }
            }
          }
        }
      }
    })) as PublicProviderRecord | null;

    if (!record) {
      return shouldUsePublicDemoFallback() && contractorProfileId === demoPublicProviderId ? demoPublicProvider : null;
    }

    return mapProviderProfile(record);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return shouldUsePublicDemoFallback() && contractorProfileId === demoPublicProviderId ? demoPublicProvider : null;
    }

    throw error;
  }
}
