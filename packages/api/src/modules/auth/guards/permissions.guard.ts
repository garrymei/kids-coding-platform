import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, Permission, DataScope, OperationType } from '../decorators/permissions.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // 没有权限要求，直接通过
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 获取用户角色和权限
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: { role: true },
    });

    if (!userWithRole) {
      throw new ForbiddenException('用户不存在');
    }

    // 检查权限
    const hasPermission = await this.checkPermissions(
      userWithRole,
      requiredPermissions,
      request,
    );

    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }

  private async checkPermissions(
    user: any,
    requiredPermissions: Permission[],
    request: any,
  ): Promise<boolean> {
    const userRole = user.role.name;
    
    // 根据角色检查权限
    switch (userRole) {
      case 'student':
        return this.checkStudentPermissions(user, requiredPermissions, request);
      case 'parent':
        return this.checkParentPermissions(user, requiredPermissions, request);
      case 'teacher':
        return this.checkTeacherPermissions(user, requiredPermissions, request);
      case 'admin':
        return this.checkAdminPermissions(user, requiredPermissions, request);
      default:
        return false;
    }
  }

  private async checkStudentPermissions(
    user: any,
    requiredPermissions: Permission[],
    request: any,
  ): Promise<boolean> {
    const studentPermissions = [
      Permission.MANAGE_OWN_VISIBILITY,
      Permission.APPROVE_RELATIONSHIPS,
      Permission.REVOKE_RELATIONSHIPS,
      Permission.VIEW_OWN_AUDIT,
    ];

    return requiredPermissions.every(permission => 
      studentPermissions.includes(permission)
    );
  }

  private async checkParentPermissions(
    user: any,
    requiredPermissions: Permission[],
    request: any,
  ): Promise<boolean> {
    const parentPermissions = [
      Permission.VIEW_AUTHORIZED_STUDENT_DATA,
      Permission.REQUEST_STUDENT_ACCESS,
    ];

    // 检查是否有授权访问特定学生数据
    if (requiredPermissions.includes(Permission.VIEW_AUTHORIZED_STUDENT_DATA)) {
      const studentId = request.params.studentId || request.body.studentId;
      if (studentId) {
        const hasAccess = await this.checkParentStudentAccess(user.id, studentId);
        if (!hasAccess) {
          return false;
        }
      }
    }

    return requiredPermissions.every(permission => 
      parentPermissions.includes(permission)
    );
  }

  private async checkTeacherPermissions(
    user: any,
    requiredPermissions: Permission[],
    request: any,
  ): Promise<boolean> {
    const teacherPermissions = [
      Permission.VIEW_CLASS_STUDENT_DATA,
      Permission.COMMENT_ON_WORKS,
      Permission.ASSIGN_TASKS,
      Permission.MANAGE_CLASS,
    ];

    // 检查班级关系权限
    if (requiredPermissions.includes(Permission.VIEW_CLASS_STUDENT_DATA)) {
      const studentId = request.params.studentId || request.body.studentId;
      if (studentId) {
        const hasClassAccess = await this.checkTeacherStudentClassAccess(user.id, studentId);
        if (!hasClassAccess) {
          return false;
        }
      }
    }

    return requiredPermissions.every(permission => 
      teacherPermissions.includes(permission)
    );
  }

  private async checkAdminPermissions(
    user: any,
    requiredPermissions: Permission[],
    request: any,
  ): Promise<boolean> {
    const adminPermissions = [
      Permission.SYSTEM_MAINTENANCE,
      Permission.HANDLE_APPEALS,
      Permission.VIEW_SYSTEM_AUDIT,
      Permission.MANAGE_USERS,
    ];

    // 管理员不能创建关系或绕过授权
    const forbiddenPermissions = [
      Permission.APPROVE_RELATIONSHIPS,
      Permission.REQUEST_STUDENT_ACCESS,
      Permission.VIEW_AUTHORIZED_STUDENT_DATA,
      Permission.VIEW_CLASS_STUDENT_DATA,
    ];

    if (requiredPermissions.some(permission => forbiddenPermissions.includes(permission))) {
      return false;
    }

    return requiredPermissions.every(permission => 
      adminPermissions.includes(permission)
    );
  }

  private async checkParentStudentAccess(parentId: string, studentId: string): Promise<boolean> {
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId,
        partyId: parentId,
        partyRole: 'PARENT',
        status: 'ACTIVE',
      },
      include: {
        accessGrants: {
          where: {
            status: 'ACTIVE',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
    });

    return relationship && relationship.accessGrants.length > 0;
  }

  private async checkTeacherStudentClassAccess(teacherId: string, studentId: string): Promise<boolean> {
    // 检查学生是否在教师的班级中
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        class: {
          ownerTeacherId: teacherId,
          status: 'ACTIVE',
        },
      },
    });

    return !!enrollment;
  }
}
