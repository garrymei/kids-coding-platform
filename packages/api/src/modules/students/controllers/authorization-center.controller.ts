import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import {
  RequirePermissions,
  PermissionType,
} from '../../auth/decorators/permissions.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ApproveRequestDto,
  RejectRequestDto,
  RevokeRelationshipDto,
  LeaveClassDto,
  AuthorizationOverviewDto,
  AuditSummaryDto,
} from '../../classes/dto/class-management.dto';

@ApiTags('authorization-center')
@Controller('students/authorization-center')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AuthorizationCenterController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '获取授权中心概览' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: AuthorizationOverviewDto,
  })
  async getAuthorizationOverview(@Request() req) {
    const studentId = req.user.userId;

    // 获取待处理请求数量
    const pendingRequests = await this.prisma.consent.count({
      where: {
        studentId,
        status: 'PENDING',
      },
    });

    // 获取活跃关系数量
    const activeRelationships = await this.prisma.relationship.count({
      where: {
        studentId,
        status: 'ACTIVE',
      },
    });

    // 获取班级数量
    const classCount = await this.prisma.classEnrollment.count({
      where: {
        studentId,
        status: 'ACTIVE',
      },
    });

    // 获取最近的授权活动
    const recentActivities = await this.prisma.auditLog.findMany({
      where: {
        actorId: studentId,
        action: {
          in: [
            'approve_relationship_request',
            'reject_relationship_request',
            'revoke_relationship',
            'leave_class',
            'update_search_visibility',
          ],
        },
      },
      orderBy: { ts: 'desc' },
      take: 5,
    });

    return {
      pendingRequests,
      activeRelationships,
      classCount,
      recentActivities: recentActivities.map((activity) => ({
        action: activity.action,
        timestamp: activity.ts,
        metadata: activity.metadata,
      })),
    };
  }

  @Get('pending-requests')
  @RequirePermissions(PermissionType.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '获取待处理的关注请求' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingRequests(@Request() req) {
    const studentId = req.user.userId;

    const pendingRequests = await this.prisma.consent.findMany({
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
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pendingRequests.map((request) => ({
      id: request.id,
      requester: request.requester,
      purpose: request.purpose,
      scope: request.scope,
      reason: request.reason,
      expiresAt: request.expiresAt,
      createdAt: request.createdAt,
    }));
  }

  @Get('active-relationships')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '获取活跃的关系列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActiveRelationships(@Request() req) {
    const studentId = req.user.userId;

    const relationships = await this.prisma.relationship.findMany({
      where: {
        studentId,
        status: 'ACTIVE',
      },
      include: {
        party: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
        accessGrants: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            scope: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return relationships.map((relationship) => ({
      id: relationship.id,
      party: relationship.party,
      source: relationship.source,
      accessGrants: relationship.accessGrants,
      createdAt: relationship.createdAt,
    }));
  }

  @Get('class-relationships')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '获取班级关系列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getClassRelationships(@Request() req) {
    const studentId = req.user.userId;

    const classEnrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            ownerTeacher: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classEnrollments.map((enrollment) => ({
      id: enrollment.id,
      class: {
        id: enrollment.class.id,
        name: enrollment.class.name,
        description: enrollment.class.description,
        code: enrollment.class.code,
        teacher: enrollment.class.ownerTeacher,
      },
      status: enrollment.status,
      joinedAt: enrollment.createdAt,
      canLeave: enrollment.status === 'ACTIVE',
    }));
  }

  @Post('approve-request/:consentId')
  @RequirePermissions(PermissionType.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '批准关注请求' })
  @ApiResponse({ status: 200, description: '批准成功' })
  async approveRequest(
    @Request() req,
    @Param('consentId') consentId: string,
    @Body() approvalData: ApproveRequestDto,
  ) {
    const studentId = req.user.userId;

    // 查找待处理的请求
    const consent = await this.prisma.consent.findFirst({
      where: {
        id: consentId,
        studentId,
        status: 'PENDING',
      },
    });

    if (!consent) {
      throw new Error('请求不存在或已处理');
    }

    // 更新同意书状态
    await this.prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'APPROVED',
        scope: Array.isArray(approvalData.scopes)
          ? approvalData.scopes.join(',')
          : String(consent.scope),
        expiresAt: approvalData.expiresAt
          ? new Date(approvalData.expiresAt)
          : consent.expiresAt,
      },
    });

    // 创建关系
    const relationship = await this.prisma.relationship.create({
      data: {
        studentId,
        partyId: consent.requesterId,
        partyRole: 'PARENT', // 这里需要根据实际情况判断
        source: 'SEARCH',
        status: 'ACTIVE',
      },
    });

    // 创建访问授权
    await this.prisma.accessGrant.create({
      data: {
        granteeId: consent.requesterId,
        studentId,
        scope: Array.isArray(approvalData.scopes)
          ? approvalData.scopes.join(',')
          : String(consent.scope),
        status: 'ACTIVE',
        expiresAt: approvalData.expiresAt
          ? new Date(approvalData.expiresAt)
          : consent.expiresAt,
        relationshipId: relationship.id,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'approve_relationship_request',
        targetType: 'consent',
        targetId: consentId,
        metadata: {
          requesterId: consent.requesterId,
          scopes: approvalData.scopes || consent.scope,
          expiresAt: approvalData.expiresAt,
        },
        ts: new Date(),
      },
    });

    return {
      message: '关注请求已批准',
      relationshipId: relationship.id,
    };
  }

  @Post('reject-request/:consentId')
  @RequirePermissions(PermissionType.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '拒绝关注请求' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  async rejectRequest(
    @Request() req,
    @Param('consentId') consentId: string,
    @Body() rejectionData: RejectRequestDto,
  ) {
    const studentId = req.user.userId;

    const consent = await this.prisma.consent.findFirst({
      where: {
        id: consentId,
        studentId,
        status: 'PENDING',
      },
    });

    if (!consent) {
      throw new Error('请求不存在或已处理');
    }

    // 更新同意书状态
    await this.prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'REJECTED',
        reason: rejectionData.reason
          ? `${consent.reason} [拒绝理由: ${rejectionData.reason}]`
          : consent.reason,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'reject_relationship_request',
        targetType: 'consent',
        targetId: consentId,
        metadata: {
          requesterId: consent.requesterId,
          rejectionReason: rejectionData.reason,
        },
        ts: new Date(),
      },
    });

    return {
      message: '关注请求已拒绝',
    };
  }

  @Delete('revoke-relationship/:relationshipId')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '撤销关系' })
  @ApiResponse({ status: 200, description: '撤销成功' })
  async revokeRelationship(
    @Request() req,
    @Param('relationshipId') relationshipId: string,
    @Body() revocationData: RevokeRelationshipDto,
  ) {
    const studentId = req.user.userId;

    const relationship = await this.prisma.relationship.findFirst({
      where: {
        id: relationshipId,
        studentId,
        status: 'ACTIVE',
      },
    });

    if (!relationship) {
      throw new Error('关系不存在或已撤销');
    }

    // 撤销关系
    await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    // 撤销相关授权
    await this.prisma.accessGrant.updateMany({
      where: { relationshipId },
      data: { status: 'REVOKED' },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'revoke_relationship',
        targetType: 'relationship',
        targetId: relationshipId,
        metadata: {
          partyId: relationship.partyId,
          revocationReason: revocationData.reason,
        },
        ts: new Date(),
      },
    });

    return {
      message: '关系已撤销',
    };
  }

  @Post('leave-class/:classId')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '退出班级' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async leaveClass(
    @Request() req,
    @Param('classId') classId: string,
    @Body() leaveData: LeaveClassDto,
  ) {
    const studentId = req.user.userId;

    // 查找入班记录
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classId,
          studentId: studentId,
        },
      },
      include: {
        class: {
          include: {
            ownerTeacher: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new Error('您不在该班级中');
    }

    // 更新入班状态
    await this.prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'REVOKED' },
    });

    // 撤销相关关系
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId: studentId,
        partyId: enrollment.class.ownerTeacher.id,
        partyRole: 'TEACHER',
        source: 'CLASS_INVITE',
        status: 'ACTIVE',
      },
    });

    if (relationship) {
      // 撤销关系
      await this.prisma.relationship.update({
        where: { id: relationship.id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });

      // 撤销相关授权
      await this.prisma.accessGrant.updateMany({
        where: {
          relationshipId: relationship.id,
          status: 'ACTIVE',
        },
        data: { status: 'REVOKED' },
      });
    }

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'leave_class',
        targetType: 'class',
        targetId: classId,
        metadata: {
          className: enrollment.class.name,
          teacherId: enrollment.class.ownerTeacher.id,
          relationshipId: relationship?.id,
          leaveReason: leaveData.reason,
        },
        ts: new Date(),
      },
    });

    return {
      message: '已成功退出班级',
      className: enrollment.class.name,
      teacher: enrollment.class.ownerTeacher,
    };
  }

  @Get('audit-summary')
  @RequirePermissions(PermissionType.VIEW_OWN_AUDIT)
  @ApiOperation({ summary: '获取授权审计摘要' })
  @ApiResponse({ status: 200, description: '获取成功', type: AuditSummaryDto })
  async getAuditSummary(@Request() req, @Query() query: AuditQueryParams) {
    const studentId = req.user.userId;
    const { startDate, endDate, action } = query;

    const where: AuditLogWhereClause = {
      actorId: studentId,
    };

    if (startDate) {
      where.ts = { ...where.ts, gte: new Date(startDate) };
    }
    if (endDate) {
      where.ts = { ...where.ts, lte: new Date(endDate) };
    }
    if (action) {
      where.action = action;
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { ts: 'desc' },
      take: 50,
    });

    // 统计摘要
    const summary = {
      totalActions: auditLogs.length,
      actionsByType: auditLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {}),
      recentActions: auditLogs.slice(0, 10),
    };

    return summary;
  }
}

interface AuditQueryParams {
  startDate?: string;
  endDate?: string;
  action?: string;
}

interface AuditLogWhereClause {
  actorId: string;
  ts?: {
    gte?: Date;
    lte?: Date;
  };
  action?: string;
}
