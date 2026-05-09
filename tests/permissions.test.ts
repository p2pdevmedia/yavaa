import { UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  canAccessOwnResource,
  canAssignRoles,
  canManageAddress,
  canManageCategoryCatalog,
  canManageUsers,
  canManageContractorProfile,
  canCreateEmergencyRequest,
  canRespondToEmergencyRequest,
  canReassignEmergencyRequest,
  canManageOwnProfile,
  canReviewContractorApplication,
  canViewAuditLog,
  canViewUserRecord,
  hasAnyRole,
  hasRole,
  type PermissionContext
} from '@/lib/permissions';

const activeClient: PermissionContext = {
  userId: 'client_001',
  status: UserStatus.ACTIVE,
  roles: ['client']
};

const activeContractor: PermissionContext = {
  userId: 'contractor_001',
  status: UserStatus.ACTIVE,
  roles: ['contractor']
};

const activeAdmin: PermissionContext = {
  userId: 'admin_001',
  status: UserStatus.ACTIVE,
  roles: ['admin', 'support']
};

const suspendedAdmin: PermissionContext = {
  userId: 'admin_002',
  status: UserStatus.SUSPENDED,
  roles: ['admin']
};

describe('permission helpers', () => {
  it('recognizes roles and ownership', () => {
    expect(hasRole(activeAdmin, 'admin')).toBe(true);
    expect(hasAnyRole(activeAdmin, ['client', 'admin'])).toBe(true);
    expect(canAccessOwnResource(activeClient, 'client_001')).toBe(true);
    expect(canManageOwnProfile(activeClient, 'client_001')).toBe(true);
    expect(canManageOwnProfile(activeClient, 'client_999')).toBe(false);
  });

  it('allows admins and support to view user records', () => {
    expect(canViewUserRecord(activeAdmin, 'client_001')).toBe(true);
    expect(canViewUserRecord(activeAdmin, 'admin_001')).toBe(true);
    expect(canViewUserRecord(activeClient, 'admin_001')).toBe(false);
  });

  it('requires the contractor role for contractor profile management', () => {
    expect(canManageContractorProfile(activeContractor, 'contractor_001')).toBe(true);
    expect(canManageContractorProfile(activeClient, 'client_001')).toBe(false);
    expect(canManageContractorProfile(activeAdmin, 'contractor_001')).toBe(true);
  });

  it('limits approval and catalog actions to active admins', () => {
    expect(canReviewContractorApplication(activeAdmin)).toBe(true);
    expect(canManageCategoryCatalog(activeAdmin)).toBe(true);
    expect(canManageUsers(activeAdmin)).toBe(true);
    expect(canAssignRoles(activeAdmin)).toBe(true);
    expect(canViewAuditLog(activeAdmin)).toBe(true);
    expect(canReviewContractorApplication(suspendedAdmin)).toBe(false);
    expect(canManageCategoryCatalog(suspendedAdmin)).toBe(false);
    expect(canManageUsers(suspendedAdmin)).toBe(false);
    expect(canAssignRoles(suspendedAdmin)).toBe(false);
    expect(canViewAuditLog(suspendedAdmin)).toBe(false);
  });

  it('lets admins manage addresses, but still blocks suspended users', () => {
    expect(canManageAddress(activeClient, 'client_001')).toBe(true);
    expect(canManageAddress(activeAdmin, 'client_001')).toBe(true);
    expect(canManageAddress(activeAdmin, 'admin_001')).toBe(true);
    expect(canManageAddress(suspendedAdmin, 'admin_002')).toBe(false);
  });

  it('allows active clients, contractors, and admins to work with emergency requests through server checks', () => {
    expect(canCreateEmergencyRequest(activeClient)).toBe(true);
    expect(canCreateEmergencyRequest(activeContractor)).toBe(false);
    expect(canRespondToEmergencyRequest(activeContractor, 'contractor_001')).toBe(true);
    expect(canRespondToEmergencyRequest(activeClient, 'contractor_001')).toBe(false);
    expect(canReassignEmergencyRequest(activeAdmin)).toBe(true);
    expect(canReassignEmergencyRequest(activeClient)).toBe(false);
  });
});
