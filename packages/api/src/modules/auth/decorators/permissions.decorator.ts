import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

// 权限检查类型
export enum PermissionType {
  STUDENT_DATA_ACCESS = 'student_data_access',
  CLASS_DATA_ACCESS = 'class_data_access',
  EVENT_RECORDING = 'event_recording',
  CLASS_MANAGEMENT = 'class_management',
  CONSENT_MANAGEMENT = 'consent_management',
  
  // Relationship permissions
  REVOKE_RELATIONSHIPS = 'revoke_relationships',
  APPROVE_RELATIONSHIPS = 'approve_relationships',
  
  // Audit permissions
  VIEW_OWN_AUDIT = 'view_own_audit',
  
  // Visibility permissions
  MANAGE_OWN_VISIBILITY = 'manage_own_visibility',
  
  // Class permissions
  VIEW_CLASS_STUDENT_DATA = 'view_class_student_data',
  MANAGE_CLASS = 'manage_class',
  
  // Teaching permissions
  COMMENT_ON_WORKS = 'comment_on_works',
  ASSIGN_TASKS = 'assign_tasks',
  
  // Admin permissions
  VIEW_SYSTEM_AUDIT = 'view_system_audit',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  HANDLE_APPEALS = 'handle_appeals',
  MANAGE_USERS = 'manage_users',
  
  // Data access permissions
  VIEW_STUDENT_DATA = 'view_student_data',
  VIEW_AUTHORIZED_STUDENT_DATA = 'view_authorized_student_data',
  REQUEST_STUDENT_ACCESS = 'request_student_access',
}

// Export Permission as alias for PermissionType for backward compatibility
export const Permission = PermissionType;
export type Permission = PermissionType;

// 权限装饰器
export const RequirePermission = (permission: PermissionType) => SetMetadata('permission', permission);

// Alias for backward compatibility
export const RequirePermissions = RequirePermission;

// 角色装饰器
export const RequireRoles = (...roles: string[]) => SetMetadata('roles', roles);

// 获取当前用户装饰器
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// 获取用户ID装饰器
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id || request.user?.userId;
  },
);

// 获取用户角色装饰器
export const CurrentUserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.role;
  },
);