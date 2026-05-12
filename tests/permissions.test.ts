import { UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  canAccessOwnResource,
  canCompleteOnboarding,
  canManageOwnProfile,
  canSelectProfileMode,
  canViewUserRecord,
  hasAnyRole,
  hasRole,
  type PermissionContext
} from '@/lib/permissions';

const activeJefe: PermissionContext = {
  userId: 'user_001',
  status: UserStatus.ACTIVE,
  roles: ['jefe']
};

const activeTrabajador: PermissionContext = {
  userId: 'user_002',
  status: UserStatus.ACTIVE,
  roles: ['trabajador']
};

const suspendedJefe: PermissionContext = {
  userId: 'user_003',
  status: UserStatus.SUSPENDED,
  roles: ['jefe']
};

const activeWithoutRoles: PermissionContext = {
  userId: 'user_004',
  status: UserStatus.ACTIVE,
  roles: []
};

describe('permission helpers', () => {
  it('recognizes jefe and trabajador roles', () => {
    expect(hasRole(activeJefe, 'jefe')).toBe(true);
    expect(hasRole(activeJefe, 'trabajador')).toBe(false);
    expect(hasAnyRole(activeTrabajador, ['jefe', 'trabajador'])).toBe(true);
  });

  it('keeps profile access limited to the active owner', () => {
    expect(canAccessOwnResource(activeJefe, 'user_001')).toBe(true);
    expect(canManageOwnProfile(activeJefe, 'user_001')).toBe(true);
    expect(canManageOwnProfile(activeJefe, 'user_999')).toBe(false);
    expect(canManageOwnProfile(suspendedJefe, 'user_003')).toBe(false);
  });

  it('lets users view only their own user record', () => {
    expect(canViewUserRecord(activeJefe, 'user_001')).toBe(true);
    expect(canViewUserRecord(activeJefe, 'user_002')).toBe(false);
    expect(canViewUserRecord(suspendedJefe, 'user_003')).toBe(false);
  });

  it('allows active users to select any profile mode from the selector', () => {
    expect(canSelectProfileMode(activeJefe, 'jefe')).toBe(true);
    expect(canSelectProfileMode(activeTrabajador, 'trabajador')).toBe(true);
    expect(canSelectProfileMode(activeJefe, 'trabajador')).toBe(true);
    expect(canSelectProfileMode(activeWithoutRoles, 'jefe')).toBe(true);
    expect(canSelectProfileMode(activeWithoutRoles, 'trabajador')).toBe(true);
    expect(canSelectProfileMode(suspendedJefe, 'jefe')).toBe(false);
  });

  it('allows onboarding completion only for active users with the selected role', () => {
    expect(canCompleteOnboarding(activeJefe, 'jefe')).toBe(true);
    expect(canCompleteOnboarding(activeTrabajador, 'trabajador')).toBe(true);
    expect(canCompleteOnboarding(activeJefe, 'trabajador')).toBe(false);
    expect(canCompleteOnboarding(activeWithoutRoles, 'jefe')).toBe(false);
    expect(canCompleteOnboarding(suspendedJefe, 'jefe')).toBe(false);
  });
});
