import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role } from '../roles.enum';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 检查用户是否可以访问学生数据
  async canAccessStudentData(requesterId: string, studentId: string): Promise<boolean> {
    try {
      // 获取请求者信息
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { Role: true },
      });

      if (!requester) {
        return false;
      }

      // 学生可以访问自己的数据
      if (requesterId === studentId) {
        return true;
      }

      // 管理员可以访问所有数据
      if (requester.Role.name === 'admin') {
        return true;
      }

      // 检查家长授权关系
      if (requester.Role.name === 'parent') {
        const consent = await this.prisma.consents.findFirst({
          where: {
            requesterId,
            studentId,
            status: 'APPROVED',
          },
        });
        return !!consent;
      }

      // 检查教师班级关系
      if (requester.Role.name === 'teacher') {
        const classMembership = await this.prisma.class_enrollments.findFirst({
          where: {
            studentId,
            status: 'ACTIVE',
            classes: {
              ownerTeacherId: requesterId,
            },
          },
        });
        return !!classMembership;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check student data access:', error);
      return false;
    }
  }

  // 检查用户是否可以访问班级数据
  async canAccessClassData(requesterId: string, classId: string): Promise<boolean> {
    try {
      // 获取请求者信息
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { Role: true },
      });

      if (!requester) {
        return false;
      }

      // 管理员可以访问所有数据
      if (requester.Role.name === 'admin') {
        return true;
      }

      // 检查是否是班级的教师
      if (requester.Role.name === 'teacher') {
        const classExists = await this.prisma.classes.findFirst({
          where: {
            id: classId,
            ownerTeacherId: requesterId,
          },
        });
        return !!classExists;
      }

      // 检查是否是班级的学生
      if (requester.Role.name === 'student') {
        const membership = await this.prisma.class_enrollments.findFirst({
          where: {
            classId,
            studentId: requesterId,
            status: 'ACTIVE',
          },
        });
        return !!membership;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check class data access:', error);
      return false;
    }
  }

  // 检查用户是否可以记录学生事件
  async canRecordStudentEvents(requesterId: string, studentId: string): Promise<boolean> {
    try {
      // 学生只能记录自己的事件
      if (requesterId === studentId) {
        return true;
      }

      // 管理员可以记录所有事件
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { Role: true },
      });

      if (requester?.Role.name === 'admin') {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check event recording permission:', error);
      return false;
    }
  }

  // 检查用户是否可以管理班级
  async canManageClass(requesterId: string, classId: string): Promise<boolean> {
    try {
      // 获取请求者信息
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { Role: true },
      });

      if (!requester) {
        return false;
      }

      // 管理员可以管理所有班级
      if (requester.Role.name === 'admin') {
        return true;
      }

      // 检查是否是班级的教师
      if (requester.Role.name === 'teacher') {
        const classExists = await this.prisma.classes.findFirst({
          where: {
            id: classId,
            ownerTeacherId: requesterId,
          },
        });
        return !!classExists;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check class management permission:', error);
      return false;
    }
  }

  // 检查用户是否可以管理授权请求
  async canManageConsent(requesterId: string, consentId: string): Promise<boolean> {
    try {
      // 获取授权请求信息
      const consent = await this.prisma.consents.findUnique({
        where: { id: consentId },
      });

      if (!consent) {
        return false;
      }

      // 学生可以管理发给自己的授权请求
      if (consent.studentId === requesterId) {
        return true;
      }

      // 家长可以管理自己发起的授权请求
      if (consent.requesterId === requesterId) {
        return true;
      }

      // 管理员可以管理所有授权请求
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { Role: true },
      });

      if (requester?.Role.name === 'admin') {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check consent management permission:', error);
      return false;
    }
  }

  // 验证角色权限
  requireRole(userRole: Role, allowedRoles: Role[]): void {
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
  }

  // 验证数据所有权
  async requireOwnership<T>(
    requesterId: string,
    resourceId: string,
    ownershipCheck: (requesterId: string, resourceId: string) => Promise<boolean>,
  ): Promise<void> {
    const hasAccess = await ownershipCheck(requesterId, resourceId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied. You do not own this resource.');
    }
  }
}

