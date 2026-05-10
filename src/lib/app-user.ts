import { type UserStatus } from '@prisma/client';

import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';
import { appRoleSlugs, type AppRoleSlug, type PermissionContext } from '@/lib/permissions';

export type AppUserIdentity = {
  id: string;
  email: string | null;
};

export type AppUserRole = {
  slug: AppRoleSlug;
  name: string;
};

export type AppUserProfile = {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
};

export type AppUserAddress = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  notes: string | null;
  type: string;
  isDefault: boolean;
  market: {
    id: string;
    slug: string;
    city: string;
    province: string;
    country: string;
  } | null;
};

export type AppUserContractorCategory = {
  category: {
    id: string;
    slug: string;
    name: string;
    group: string | null;
  };
  isPrimary: boolean;
};

export type AppUserContractorWorkZone = {
  workZone: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    market: {
      id: string;
      slug: string;
      city: string;
      province: string;
      country: string;
    };
  };
};

export type AppUserContractorProfile = {
  id: string;
  approvalStatus: string;
  acceptsEmergencies: boolean;
  dniNumber: string | null;
  dniFrontUrl: string | null;
  dniBackUrl: string | null;
  profilePhotoUrl: string | null;
  reviewNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  addressId: string | null;
  categories: AppUserContractorCategory[];
  workZones: AppUserContractorWorkZone[];
};

export type AppUserSummary = {
  id: string;
  email: string;
  supabaseAuthId: string | null;
  displayName: string | null;
  status: UserStatus;
  roles: AppRoleSlug[];
  profile: AppUserProfile | null;
  addresses: AppUserAddress[];
  contractorProfile: AppUserContractorProfile | null;
};

export type ResolvedAppUser = {
  configured: boolean;
  matchedBy: 'supabase_auth_id' | 'email' | null;
  identity: AppUserIdentity | null;
  user: AppUserSummary | null;
  permissionContext: PermissionContext | null;
};

type AppUserRecordQuery = {
  id: string;
  email: string;
  supabaseAuthId: string | null;
  displayName: string | null;
  status: UserStatus;
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    bio: string | null;
  } | null;
  addresses: Array<{
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    notes: string | null;
    type: string;
    isDefault: boolean;
    market: {
      id: string;
      slug: string;
      city: string;
      province: string;
      country: string;
    } | null;
  }>;
  roles: Array<{
    role: {
      slug: string;
      name: string;
    };
  }>;
  contractorProfile: {
    id: string;
    approvalStatus: string;
    acceptsEmergencies: boolean;
    dniNumber: string | null;
    dniFrontUrl: string | null;
    dniBackUrl: string | null;
    profilePhotoUrl: string | null;
    reviewNotes: string | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewedByUserId: string | null;
    addressId: string | null;
    categories: Array<{
      isPrimary: boolean;
      category: {
        id: string;
        slug: string;
        name: string;
        group: string | null;
      };
    }>;
    workZones: Array<{
      workZone: {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        market: {
          id: string;
          slug: string;
          city: string;
          province: string;
          country: string;
        };
      };
    }>;
  } | null;
};

function isAppRoleSlug(role: string): role is AppRoleSlug {
  return (appRoleSlugs as ReadonlyArray<string>).includes(role);
}

function toIsoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function mapPermissionContext(user: AppUserSummary): PermissionContext {
  return {
    userId: user.id,
    status: user.status,
    roles: user.roles
  };
}

function mapAppUserRecord(record: AppUserRecordQuery | null): AppUserSummary | null {
  if (!record) {
    return null;
  }

  const roles = record.roles
    .map((userRole) => userRole.role.slug)
    .filter((slug): slug is AppRoleSlug => isAppRoleSlug(slug));

  const addresses = record.addresses.map((address) => ({
    id: address.id,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    notes: address.notes,
    type: address.type,
    isDefault: address.isDefault,
    market: address.market
      ? {
          id: address.market.id,
          slug: address.market.slug,
          city: address.market.city,
          province: address.market.province,
          country: address.market.country
        }
      : null
  }));
  const profile = record.profile
    ? {
        firstName: record.profile.firstName,
        lastName: record.profile.lastName,
        avatarUrl: record.profile.avatarUrl,
        phone: record.profile.phone,
        bio: record.profile.bio
      }
    : null;

  const contractorProfile = record.contractorProfile
    ? {
        id: record.contractorProfile.id,
        approvalStatus: record.contractorProfile.approvalStatus,
        acceptsEmergencies: record.contractorProfile.acceptsEmergencies,
        dniNumber: record.contractorProfile.dniNumber,
        dniFrontUrl: record.contractorProfile.dniFrontUrl,
        dniBackUrl: record.contractorProfile.dniBackUrl,
        profilePhotoUrl: profile?.avatarUrl ?? record.contractorProfile.profilePhotoUrl,
        reviewNotes: record.contractorProfile.reviewNotes,
        submittedAt: toIsoOrNull(record.contractorProfile.submittedAt),
        reviewedAt: toIsoOrNull(record.contractorProfile.reviewedAt),
        reviewedByUserId: record.contractorProfile.reviewedByUserId,
        addressId: record.contractorProfile.addressId,
        categories: record.contractorProfile.categories.map((link) => ({
          category: {
            id: link.category.id,
            slug: link.category.slug,
            name: link.category.name,
            group: link.category.group
          },
          isPrimary: link.isPrimary
        })),
        workZones: record.contractorProfile.workZones.map((link) => ({
          workZone: {
            id: link.workZone.id,
            slug: link.workZone.slug,
            name: link.workZone.name,
            description: link.workZone.description,
            market: {
              id: link.workZone.market.id,
              slug: link.workZone.market.slug,
              city: link.workZone.market.city,
              province: link.workZone.market.province,
              country: link.workZone.market.country
            }
          }
        }))
      }
    : null;

  return {
    id: record.id,
    email: record.email,
    supabaseAuthId: record.supabaseAuthId,
    displayName: record.displayName,
    status: record.status,
    roles,
    profile,
    addresses,
    contractorProfile
  };
}

export async function resolveAppUser(identity: AppUserIdentity): Promise<ResolvedAppUser> {
  if (!hasDatabaseEnv()) {
    return {
      configured: false,
      matchedBy: null,
      identity,
      user: null,
      permissionContext: null
    };
  }

  const prisma = getPrismaClient();
  const matchBySupabaseAuthId = await prisma.user.findFirst({
    where: { supabaseAuthId: identity.id },
    select: {
      id: true,
      email: true,
      supabaseAuthId: true,
      displayName: true,
      status: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
          bio: true
        }
      },
      addresses: {
        select: {
          id: true,
          label: true,
          line1: true,
          line2: true,
          city: true,
          province: true,
          postalCode: true,
          notes: true,
          type: true,
          isDefault: true,
          market: {
            select: {
              id: true,
              slug: true,
              city: true,
              province: true,
              country: true
            }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      },
      roles: {
        select: {
          role: {
            select: {
              slug: true,
              name: true
            }
          }
        }
      },
      contractorProfile: {
        select: {
          id: true,
          approvalStatus: true,
          acceptsEmergencies: true,
          dniNumber: true,
          dniFrontUrl: true,
          dniBackUrl: true,
          profilePhotoUrl: true,
          reviewNotes: true,
          submittedAt: true,
          reviewedAt: true,
          reviewedByUserId: true,
          addressId: true,
          categories: {
            select: {
              isPrimary: true,
              category: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  group: true
                }
              }
            },
            orderBy: [{ isPrimary: 'desc' }]
          },
          workZones: {
            select: {
              workZone: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  description: true,
                  market: {
                    select: {
                      id: true,
                      slug: true,
                      city: true,
                      province: true,
                      country: true
                    }
                  }
                }
              }
            },
            orderBy: [{ createdAt: 'asc' }]
          }
        }
      }
    }
  });

  if (matchBySupabaseAuthId) {
    const user = mapAppUserRecord(matchBySupabaseAuthId);

    return {
      configured: true,
      matchedBy: 'supabase_auth_id',
      identity,
      user,
      permissionContext: user ? mapPermissionContext(user) : null
    };
  }

  if (!identity.email) {
    return {
      configured: true,
      matchedBy: null,
      identity,
      user: null,
      permissionContext: null
    };
  }

  const matchByEmail = await prisma.user.findFirst({
    where: { email: identity.email },
    select: {
      id: true,
      email: true,
      supabaseAuthId: true,
      displayName: true,
      status: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
          bio: true
        }
      },
      addresses: {
        select: {
          id: true,
          label: true,
          line1: true,
          line2: true,
          city: true,
          province: true,
          postalCode: true,
          notes: true,
          type: true,
          isDefault: true,
          market: {
            select: {
              id: true,
              slug: true,
              city: true,
              province: true,
              country: true
            }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      },
      roles: {
        select: {
          role: {
            select: {
              slug: true,
              name: true
            }
          }
        }
      },
      contractorProfile: {
        select: {
          id: true,
          approvalStatus: true,
          acceptsEmergencies: true,
          dniNumber: true,
          dniFrontUrl: true,
          dniBackUrl: true,
          profilePhotoUrl: true,
          reviewNotes: true,
          submittedAt: true,
          reviewedAt: true,
          reviewedByUserId: true,
          addressId: true,
          categories: {
            select: {
              isPrimary: true,
              category: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  group: true
                }
              }
            },
            orderBy: [{ isPrimary: 'desc' }]
          },
          workZones: {
            select: {
              workZone: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  description: true,
                  market: {
                    select: {
                      id: true,
                      slug: true,
                      city: true,
                      province: true,
                      country: true
                    }
                  }
                }
              }
            },
            orderBy: [{ createdAt: 'asc' }]
          }
        }
      }
    }
  });

  const user = mapAppUserRecord(matchByEmail);

  return {
    configured: true,
    matchedBy: user ? 'email' : null,
    identity,
    user,
    permissionContext: user ? mapPermissionContext(user) : null
  };
}
