import { UserStatus } from '@prisma/client';

export const appRoleSlugs = ['jefe', 'trabajador'] as const;

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
  return canAccessOwnResource(context, targetUserId);
}

export function canManageOwnProfile(context: PermissionContext, ownerUserId: string): boolean {
  return canAccessOwnResource(context, ownerUserId);
}

export function canSelectProfileMode(context: PermissionContext, mode: AppRoleSlug): boolean {
  return isActiveContext(context) && hasRole(context, mode);
}

export function canCompleteOnboarding(context: PermissionContext, mode: AppRoleSlug): boolean {
  return canSelectProfileMode(context, mode);
}
