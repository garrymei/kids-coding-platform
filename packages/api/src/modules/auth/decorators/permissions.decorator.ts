import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// 权限类型定义
export enum Permission {
  // 学生权限
  MANAGE_OWN_VISIBILITY = 'manage_own_visibility',
  APPROVE_RELATIONSHIPS = 'approve_relationships',
  REVOKE_RELATIONSHIPS = 'revoke_relationships',
  VIEW_OWN_AUDIT = 'view_own_audit',
  
  // 家长权限
  VIEW_AUTHORIZED_STUDENT_DATA = 'view_authorized_student_data',
  REQUEST_STUDENT_ACCESS = 'request_student_access',
  
  // 教师权限
  VIEW_CLASS_STUDENT_DATA = 'view_class_student_data',
  COMMENT_ON_WORKS = 'comment_on_works',
  ASSIGN_TASKS = 'assign_tasks',
  MANAGE_CLASS = 'manage_class',
  
  // 管理员权限
  SYSTEM_MAINTENANCE = 'system_maintenance',
  HANDLE_APPEALS = 'handle_appeals',
  VIEW_SYSTEM_AUDIT = 'view_system_audit',
  MANAGE_USERS = 'manage_users',
}

// 数据范围定义
export enum DataScope {
  OWN_DATA = 'own_data',
  AUTHORIZED_DATA = 'authorized_data',
  CLASS_DATA = 'class_data',
  SYSTEM_DATA = 'system_data',
}

// 操作类型定义
export enum OperationType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  MANAGE = 'manage',
}

// 权限装饰器
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// 数据范围装饰器
export const RequireDataScope = (scope: DataScope) =>
  SetMetadata('data_scope', scope);

// 操作类型装饰器
export const RequireOperation = (operation: OperationType) =>
  SetMetadata('operation_type', operation);

// 资源类型装饰器
export const RequireResourceType = (resourceType: string) =>
  SetMetadata('resource_type', resourceType);
