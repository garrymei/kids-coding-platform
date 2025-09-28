import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

// 权限检查类型
export enum PermissionType {
  STUDENT_DATA_ACCESS = 'student_data_access',
  CLASS_DATA_ACCESS = 'class_data_access',
  EVENT_RECORDING = 'event_recording',
  CLASS_MANAGEMENT = 'class_management',
  CONSENT_MANAGEMENT = 'consent_management',
}

// 权限装饰器
export const RequirePermission = (permission: PermissionType) => SetMetadata('permission', permission);

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