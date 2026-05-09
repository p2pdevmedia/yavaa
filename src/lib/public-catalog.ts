import { CategoryStatus } from '@prisma/client';

import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';

export type PublicCatalogCategory = {
  id: string;
  slug: string;
  name: string;
  group: string | null;
  isInitial: boolean;
};

export type PublicCatalogMarket = {
  id: string;
  slug: string;
  country: string;
  city: string;
  province: string;
  isPrimary: boolean;
  workZones: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }>;
};

const demoCategories: PublicCatalogCategory[] = [
  { id: 'demo-category-construction', slug: 'construction', name: 'Construction', group: 'construction', isInitial: true },
  { id: 'demo-category-home-services', slug: 'home-services', name: 'Home Services', group: 'home services', isInitial: true },
  { id: 'demo-category-psychologists', slug: 'psychologists', name: 'Psychologists', group: 'health', isInitial: true },
  { id: 'demo-category-teachers', slug: 'teachers', name: 'Teachers', group: 'education', isInitial: true },
  {
    id: 'demo-category-massage-therapists',
    slug: 'massage-therapists',
    name: 'Massage Therapists',
    group: 'wellness',
    isInitial: true
  },
  { id: 'demo-category-wellness', slug: 'wellness', name: 'Wellness', group: 'wellness', isInitial: true },
  { id: 'demo-category-delivery', slug: 'delivery', name: 'Delivery', group: 'logistics', isInitial: true },
  { id: 'demo-category-errands', slug: 'errands', name: 'Errands', group: 'assistance', isInitial: true },
  { id: 'demo-category-technology', slug: 'technology', name: 'Technology', group: 'technology', isInitial: true }
];

const demoMarkets: PublicCatalogMarket[] = [
  {
    id: 'demo-market-san-martin-de-los-andes',
    slug: 'san-martin-de-los-andes',
    country: 'Argentina',
    city: 'San Martin de los Andes',
    province: 'Neuquen',
    isPrimary: true,
    workZones: [
      {
        id: 'demo-work-zone-central',
        slug: 'central',
        name: 'Centro',
        description: 'Zona central de San Martin de los Andes'
      }
    ]
  }
];

export async function listPublicCatalogCategories(): Promise<PublicCatalogCategory[]> {
  if (!hasDatabaseEnv()) {
    return demoCategories;
  }

  const prisma = getPrismaClient();
  const categories = await prisma.category.findMany({
    where: {
      status: CategoryStatus.ACTIVE
    },
    select: {
      id: true,
      slug: true,
      name: true,
      group: true,
      isInitial: true
    },
    orderBy: [
      { isInitial: 'desc' },
      { name: 'asc' }
    ]
  });

  return categories;
}

export async function listPublicCatalogMarkets(): Promise<PublicCatalogMarket[]> {
  if (!hasDatabaseEnv()) {
    return demoMarkets;
  }

  const prisma = getPrismaClient();
  const markets = await prisma.market.findMany({
    select: {
      id: true,
      slug: true,
      country: true,
      city: true,
      province: true,
      isPrimary: true,
      workZones: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      }
    },
    orderBy: [
      { isPrimary: 'desc' },
      { city: 'asc' }
    ]
  });

  return markets;
}
