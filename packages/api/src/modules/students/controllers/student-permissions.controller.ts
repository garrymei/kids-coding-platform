import {
  Controller,
  Get,
  Post,
  Put,
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
import { StudentsService } from '../students.service';
import { VisibilityService } from '../../auth/services/visibility.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('student-permissions')
@Controller('students/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class StudentPermissionsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly visibilityService: VisibilityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('my-data')
  @RequirePermissions(PermissionType.MANAGE_OWN_VISIBILITY)
  @ApiOperation({ summary: '查看自己的完整数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyData(@Request() req) {
    const studentId = req.user.userId;
    return this.visibilityService.filterStudentData(
      studentId,
      studentId,
      'student',
    );
  }

  @Get('visibility-settings')
  @RequirePermissions(PermissionType.MANAGE_OWN_VISIBILITY)
  @ApiOperation({ summary: '获取可见性设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getVisibilitySettings(@Request() req) {
    const studentId = req.user.userId;
    return this.studentsService.getSearchSettings(studentId);
  }

  @Put('visibility-settings')
  @RequirePermissions(PermissionType.MANAGE_OWN_VISIBILITY)
  @ApiOperation({ summary: '更新可见性设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateVisibilitySettings(@Request() req, @Body() settings: any) {
    const studentId = req.user.userId;
    return this.studentsService.updateSearchability(studentId, settings);
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

    return pendingRequests;
  }

  @Post('approve-request/:consentId')
  @RequirePermissions(PermissionType.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '批准关注请求' })
  @ApiResponse({ status: 200, description: '批准成功' })
  async approveRequest(
    @Request() req,
    @Param('consentId') consentId: string,
    @Body() approvalData: { scopes?: string[]; expiresAt?: string },
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
        scope: approvalData.scopes || consent.scope,
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
        scope: approvalData.scopes || consent.scope,
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
        action: 'approve_relationship',
        targetType: 'relationship',
        targetId: relationship.id,
        metadata: {
          requesterId: consent.requesterId,
          scopes: approvalData.scopes || consent.scope,
          expiresAt: approvalData.expiresAt,
        },
      },
    });

    return { message: '关注请求已批准', relationshipId: relationship.id };
  }

  @Post('reject-request/:consentId')
  @RequirePermissions(PermissionType.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '拒绝关注请求' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  async rejectRequest(@Request() req, @Param('consentId') consentId: string) {
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
      data: { status: 'REJECTED' },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'reject_relationship',
        targetType: 'consent',
        targetId: consentId,
        metadata: {
          requesterId: consent.requesterId,
        },
      },
    });

    return { message: '关注请求已拒绝' };
  }

  @Get('my-relationships')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '获取我的关系列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyRelationships(@Request() req) {
    const studentId = req.user.userId;

    const relationships = await this.prisma.relationship.findMany({
      where: { studentId },
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

    return relationships;
  }

  @Delete('revoke-relationship/:relationshipId')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '撤销关系' })
  @ApiResponse({ status: 200, description: '撤销成功' })
  async revokeRelationship(
    @Request() req,
    @Param('relationshipId') relationshipId: string,
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
        },
      },
    });

    return { message: '关系已撤销' };
  }

  @Get('audit-summary')
  @RequirePermissions(PermissionType.VIEW_OWN_AUDIT)
  @ApiOperation({ summary: '查看审计摘要' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAuditSummary(@Request() req, @Query() query: any) {
    const studentId = req.user.userId;
    const { startDate, endDate, action } = query;

    const where: any = {
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
      take: 50, // 限制返回数量
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
