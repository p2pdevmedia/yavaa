import { UserStatus } from '@prisma/client';

export const appRoleSlugs = ['client', 'contractor', 'admin', 'support'] as const;

export type AppRoleSlug = (typeof appRoleSlugs)[number];

export type PermissionContext = {
  userId: string;
  status: UserStatus;
  roles: ReadonlyArray<AppRoleSlug>;
};

function isActiveContext(context: PermissionContext): boolean {
  return context.status === UserStatus.ACTIVE;
}

export function hasRole(context: PermissionContext, role: AppRoleSlug): boolean {
  return context.roles.includes(role);
}

export function hasAnyRole(context: PermissionContext, roles: ReadonlyArray<AppRoleSlug>): boolean {
  return roles.some((role) => hasRole(context, role));
}

export function canAccessOwnResource(context: PermissionContext, ownerUserId: string): boolean {
  return isActiveContext(context) && context.userId === ownerUserId;
}

export function canViewUserRecord(context: PermissionContext, targetUserId: string): boolean {
  return (
    isActiveContext(context) &&
    (context.userId === targetUserId || hasAnyRole(context, ['admin', 'support']))
  );
}

export function canManageOwnProfile(context: PermissionContext, ownerUserId: string): boolean {
  return canAccessOwnResource(context, ownerUserId);
}

export function canManageAddress(context: PermissionContext, ownerUserId: string): boolean {
  return canAccessOwnResource(context, ownerUserId) || (isActiveContext(context) && hasRole(context, 'admin'));
}

export function canManageContractorProfile(context: PermissionContext, ownerUserId: string): boolean {
  return (
    isActiveContext(context) &&
    ((hasRole(context, 'contractor') && context.userId === ownerUserId) || hasRole(context, 'admin'))
  );
}

export function canReviewContractorApplication(context: PermissionContext): boolean {
  return isActiveContext(context) && hasRole(context, 'admin');
}

export function canManageCategoryCatalog(context: PermissionContext): boolean {
  return isActiveContext(context) && hasRole(context, 'admin');
}

export function canViewAuditLog(context: PermissionContext): boolean {
  return isActiveContext(context) && hasRole(context, 'admin');
}

export function canAssignRoles(context: PermissionContext): boolean {
  return isActiveContext(context) && hasRole(context, 'admin');
}

export function canCreateEmergencyRequest(context: PermissionContext): boolean {
  return isActiveContext(context) && hasRole(context, 'client');
}

export function canViewEmergencyRequest(
  context: PermissionContext,
  request: {
    clientUserId: string;
    assignedContractorUserId: string | null;
    notifiedContractorUserIds: ReadonlyArray<string>;
  }
): boolean {
  return (
    isActiveContext(context) &&
    (hasRole(context, 'admin') ||
      (hasRole(context, 'client') && context.userId === request.clientUserId) ||
      (hasRole(context, 'contractor') &&
        (request.assignedContractorUserId === context.userId ||
          request.notifiedContractorUserIds.includes(context.userId))))
  );
}

export function canRespondToEmergencyRequest(context: PermissionContext, contractorUserId: string): boolean {
  return isActiveContext(context) && hasRole(context, 'contractor') && context.userId === contractorUserId;
}

export function canReassignEmergencyRequest(context: PermissionContext): boolean {
  return isActiveContext(context) && hasRole(context, 'admin');
}
