import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  RequestParentAccessDto, 
  RequestTeacherAccessDto, 
  RespondToAccessRequestDto,
  UpdateRelationshipDto,
  UpdateAccessGrantDto 
} from './dto/relationships.dto';
import { PartyRole, RelationshipSource, ConsentStatus, GrantStatus } from '@prisma/client';

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  // 家长申请查看学生数据
  async requestParentAccess(parentId: string, requestDto: RequestParentAccessDto) {
    // 查找学生
    const student = await this.prisma.user.findUnique({
      where: { email: requestDto.studentEmail },
      include: { role: true },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    if (student.role.name !== 'student') {
      throw new BadRequestException('该邮箱不是学生账号');
    }

    // 检查是否已存在关系
    const existingRelationship = await this.prisma.relationship.findUnique({
      where: {
        studentId_partyId: {
          studentId: student.id,
          partyId: parentId,
        },
      },
    });

    if (existingRelationship && existingRelationship.status === 'ACTIVE') {
      throw new ForbiddenException('您已经与该学生建立了关系');
    }

    // 创建同意书
    const consent = await this.prisma.consent.create({
      data: {
        studentId: student.id,
        requesterId: parentId,
        purpose: requestDto.purpose,
        reason: requestDto.reason,
        expiresAt: requestDto.expiresAt ? new Date(requestDto.expiresAt) : null,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return consent;
  }

  // 教师申请查看学生数据
  async requestTeacherAccess(teacherId: string, requestDto: RequestTeacherAccessDto) {
    // 查找学生
    const student = await this.prisma.user.findUnique({
      where: { email: requestDto.studentEmail },
      include: { role: true },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    if (student.role.name !== 'student') {
      throw new BadRequestException('该邮箱不是学生账号');
    }

    // 检查是否已存在关系
    const existingRelationship = await this.prisma.relationship.findUnique({
      where: {
        studentId_partyId: {
          studentId: student.id,
          partyId: teacherId,
        },
      },
    });

    if (existingRelationship && existingRelationship.status === 'ACTIVE') {
      throw new ForbiddenException('您已经与该学生建立了关系');
    }

    // 创建同意书
    const consent = await this.prisma.consent.create({
      data: {
        studentId: student.id,
        requesterId: teacherId,
        purpose: requestDto.purpose,
        reason: requestDto.reason,
        expiresAt: requestDto.expiresAt ? new Date(requestDto.expiresAt) : null,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        requester: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return consent;
  }

  // 学生响应访问请求
  async respondToAccessRequest(studentId: string, responseDto: RespondToAccessRequestDto) {
    // 查找同意书
    const consent = await this.prisma.consent.findFirst({
      where: {
        id: responseDto.consentId,
        studentId,
        status: 'PENDING',
      },
      include: {
        requester: {
          include: { role: true },
        },
      },
    });

    if (!consent) {
      throw new NotFoundException('同意书不存在或已处理');
    }

    // 更新同意书状态
    const updatedConsent = await this.prisma.consent.update({
      where: { id: responseDto.consentId },
      data: {
        status: responseDto.status as ConsentStatus,
        expiresAt: responseDto.expiresAt ? new Date(responseDto.expiresAt) : consent.expiresAt,
      },
    });

    if (responseDto.status === 'APPROVED') {
      // 创建关系
      const relationship = await this.prisma.relationship.upsert({
        where: {
          studentId_partyId: {
            studentId,
            partyId: consent.requesterId,
          },
        },
        update: {
          status: 'ACTIVE',
        },
        create: {
          studentId,
          partyId: consent.requesterId,
          partyRole: consent.requester.role.name === 'parent' ? PartyRole.PARENT : PartyRole.TEACHER,
          source: 'MANUAL',
          status: 'ACTIVE',
        },
      });

      // 创建访问授权
      if (responseDto.scopes && responseDto.scopes.length > 0) {
        await this.createAccessGrants(
          studentId,
          consent.requesterId,
          responseDto.scopes,
          relationship.id,
          responseDto.expiresAt ? new Date(responseDto.expiresAt) : null,
        );
      }
    }

    return updatedConsent;
  }

  // 获取学生的待处理请求
  async getPendingRequests(studentId: string) {
    return this.prisma.consent.findMany({
      where: {
        studentId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 获取用户的关系列表
  async getRelationships(userId: string, userRole: string) {
    if (userRole === 'student') {
      return this.prisma.relationship.findMany({
        where: {
          studentId: userId,
          status: 'ACTIVE',
        },
        include: {
          party: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          accessGrants: {
            select: {
              id: true,
              scope: true,
              status: true,
              expiresAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      return this.prisma.relationship.findMany({
        where: {
          partyId: userId,
          status: 'ACTIVE',
        },
        include: {
          student: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          accessGrants: {
            select: {
              id: true,
              scope: true,
              status: true,
              expiresAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  }

  // 更新关系状态
  async updateRelationship(relationshipId: string, userId: string, updateDto: UpdateRelationshipDto) {
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        id: relationshipId,
        OR: [
          { studentId: userId },
          { partyId: userId },
        ],
      },
    });

    if (!relationship) {
      throw new NotFoundException('关系不存在或无权限');
    }

    const updatedRelationship = await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: updateDto.status as any,
      },
    });

    // 如果关系被撤销，同时撤销相关授权
    if (updateDto.status === 'REVOKED') {
      await this.prisma.accessGrant.updateMany({
        where: {
          relationshipId,
        },
        data: {
          status: 'REVOKED',
        },
      });
    }

    return updatedRelationship;
  }

  // 更新访问授权
  async updateAccessGrant(grantId: string, userId: string, updateDto: UpdateAccessGrantDto) {
    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        id: grantId,
        granteeId: userId,
      },
    });

    if (!grant) {
      throw new NotFoundException('授权不存在或无权限');
    }

    return this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        scope: updateDto.scopes,
        expiresAt: updateDto.expiresAt ? new Date(updateDto.expiresAt) : null,
      },
    });
  }

  // 撤销访问授权
  async revokeAccessGrant(grantId: string, userId: string) {
    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        id: grantId,
        granteeId: userId,
      },
    });

    if (!grant) {
      throw new NotFoundException('授权不存在或无权限');
    }

    return this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        status: 'REVOKED',
      },
    });
  }

  // 检查用户是否有权限访问学生数据
  async checkAccessPermission(granteeId: string, studentId: string, scope: string) {
    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        granteeId,
        resourceId: studentId,
        scope: {
          has: scope,
        },
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return !!grant;
  }

  // 获取用户可访问的学生列表
  async getAccessibleStudents(granteeId: string) {
    const grants = await this.prisma.accessGrant.findMany({
      where: {
        granteeId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        grantee: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      distinct: ['resourceId'],
    });

    // 获取学生信息
    const studentIds = grants.map(grant => grant.resourceId);
    const students = await this.prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: {
          name: 'student',
        },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
      },
    });

    return students;
  }

  private async createAccessGrants(
    studentId: string,
    granteeId: string,
    scopes: string[],
    relationshipId: string,
    expiresAt?: Date,
  ) {
    const grants = scopes.map(scope => ({
      resourceType: scope.includes('progress') ? 'STUDENT_PROGRESS' : 'STUDENT_WORKS',
      resourceId: studentId,
      granteeId,
      scope: [scope],
      relationshipId,
      expiresAt,
      status: 'ACTIVE' as GrantStatus,
    }));

    return this.prisma.accessGrant.createMany({
      data: grants,
    });
  }
}
