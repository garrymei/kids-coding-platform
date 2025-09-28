import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../services/permissions.service';
import { PermissionType } from '../decorators/permissions.decorator';
import { Role } from '../roles.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 检查角色权限
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = user.role || user.Role?.name;
      if (!requiredRoles.includes(userRole)) {
        this.logger.warn(`Access denied for user ${user.id}: role ${userRole} not in ${requiredRoles.join(', ')}`);
        throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
      }
    }

    // 检查特定权限
    const requiredPermission = this.reflector.get<PermissionType>('permission', context.getHandler());
    if (requiredPermission) {
      const hasPermission = await this.checkPermission(context, user, requiredPermission);
      if (!hasPermission) {
        this.logger.warn(`Access denied for user ${user.id}: missing permission ${requiredPermission}`);
        throw new ForbiddenException(`Access denied. Missing permission: ${requiredPermission}`);
      }
    }

    return true;
  }

  private async checkPermission(
    context: ExecutionContext,
    user: any,
    permission: PermissionType,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = user.id || user.userId;

    switch (permission) {
      case PermissionType.STUDENT_DATA_ACCESS: {
        const studentId = request.params.id || request.params.studentId;
        if (!studentId) {
          this.logger.error('Student ID not found in request parameters');
          return false;
        }
        return await this.permissionsService.canAccessStudentData(userId, studentId);
      }

      case PermissionType.CLASS_DATA_ACCESS: {
        const classId = request.params.classId || request.body?.classId;
        if (!classId) {
          this.logger.error('Class ID not found in request');
          return false;
        }
        return await this.permissionsService.canAccessClassData(userId, classId);
      }

      case PermissionType.EVENT_RECORDING: {
        const studentId = request.body?.studentId || userId;
        return await this.permissionsService.canRecordStudentEvents(userId, studentId);
      }

      case PermissionType.CLASS_MANAGEMENT: {
        const classId = request.params.classId || request.body?.classId;
        if (!classId) {
          this.logger.error('Class ID not found in request');
          return false;
        }
        return await this.permissionsService.canManageClass(userId, classId);
      }

      case PermissionType.CONSENT_MANAGEMENT: {
        const consentId = request.params.requestId || request.params.consentId;
        if (!consentId) {
          this.logger.error('Consent ID not found in request parameters');
          return false;
        }
        return await this.permissionsService.canManageConsent(userId, consentId);
      }

      default:
        this.logger.error(`Unknown permission type: ${permission}`);
        return false;
    }
  }
}