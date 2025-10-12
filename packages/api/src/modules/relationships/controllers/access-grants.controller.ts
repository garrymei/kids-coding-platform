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
  NotFoundException,
  ForbiddenException,
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

@ApiTags('access-grants')
@Controller('access-grants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AccessGrantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('my-grants')
  @RequirePermissions(PermissionType.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '获取我的访问授权' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyGrants(@Request() req) {
    const granteeId = req.user.userId;

    const grants = await this.prisma.accessGrant.findMany({
      where: { granteeId },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            nickname: true,
            school: true,
            className: true,
          },
        },
        relationship: {
          select: {
            id: true,
            source: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return grants.map((grant) => ({
      id: grant.id,
      student: grant.student,
      scope: grant.scope,
      status: grant.status,
      expiresAt: grant.expiresAt,
      relationship: grant.relationship,
      createdAt: grant.createdAt,
      updatedAt: grant.updatedAt,
    }));
  }

  @Get('student-grants/:studentId')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '获取学生对我的授权' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentGrants(
    @Request() req,
    @Param('studentId') studentId: string,
  ) {
    const studentIdFromToken = req.user.userId;

    // 验证学生身份
    if (studentId !== studentIdFromToken) {
      throw new ForbiddenException('只能查看自己的授权');
    }

    const grants = await this.prisma.accessGrant.findMany({
      where: { studentId },
      include: {
        grantee: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
        relationship: {
          select: {
            id: true,
            source: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return grants.map((grant) => ({
      id: grant.id,
      grantee: grant.grantee,
      scope: grant.scope,
      status: grant.status,
      expiresAt: grant.expiresAt,
      relationship: grant.relationship,
      createdAt: grant.createdAt,
      updatedAt: grant.updatedAt,
    }));
  }

  @Put('grants/:grantId')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '更新访问授权' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateGrant(
    @Request() req,
    @Param('grantId') grantId: string,
    @Body()
    updateData: {
      scope?: string[];
      expiresAt?: string;
    },
  ) {
    const studentId = req.user.userId;

    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        id: grantId,
        studentId, // 只有学生可以更新自己的授权
        status: 'ACTIVE',
      },
    });

    if (!grant) {
      throw new NotFoundException('授权不存在或已失效');
    }

    // 更新授权
    const updatedGrant = await this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        scope: Array.isArray(updateData.scope)
          ? updateData.scope.join(',')
          : (updateData.scope ?? grant.scope),
        expiresAt: updateData.expiresAt
          ? new Date(updateData.expiresAt)
          : grant.expiresAt,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'update_access_grant',
        targetType: 'access_grant',
        targetId: grantId,
        metadata: {
          granteeId: grant.granteeId,
          oldScope: grant.scope,
          newScope: Array.isArray(updateData.scope)
            ? updateData.scope.join(',')
            : (updateData.scope ?? grant.scope),
          oldExpiresAt: grant.expiresAt,
          newExpiresAt: updateData.expiresAt
            ? new Date(updateData.expiresAt)
            : grant.expiresAt,
        },
        ts: new Date(),
      },
    });

    return {
      message: '访问授权已更新',
      grant: updatedGrant,
    };
  }

  @Post('grants/:grantId/revoke')
  @RequirePermissions(PermissionType.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '撤销访问授权' })
  @ApiResponse({ status: 200, description: '撤销成功' })
  async revokeGrant(
    @Request() req,
    @Param('grantId') grantId: string,
    @Body() revocationData: { reason?: string },
  ) {
    const actorId = req.user.userId;

    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        id: grantId,
        OR: [
          { studentId: actorId }, // 学生可以撤销自己的授权
          { granteeId: actorId }, // 被授权者可以撤销自己的访问
        ],
        status: 'ACTIVE',
      },
    });

    if (!grant) {
      throw new NotFoundException('授权不存在或已失效');
    }

    // 撤销授权
    await this.prisma.accessGrant.update({
      where: { id: grantId },
      data: { status: 'REVOKED' },
    });

    // 如果学生撤销授权，同时撤销关系
    if (grant.studentId === actorId) {
      const relationship = await this.prisma.relationship.findFirst({
        where: {
          studentId: grant.studentId,
          partyId: grant.granteeId,
          status: 'ACTIVE',
        },
      });

      if (relationship) {
        await this.prisma.relationship.update({
          where: { id: relationship.id },
          data: {
            status: 'REVOKED',
            revokedAt: new Date(),
          },
        });
      }
    }

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: actorId,
        action: 'revoke_access_grant',
        targetType: 'access_grant',
        targetId: grantId,
        metadata: {
          granteeId: grant.granteeId,
          studentId: grant.studentId,
          scope: grant.scope,
          revocationReason: revocationData.reason,
          revokedBy: grant.studentId === actorId ? 'student' : 'grantee',
        },
        ts: new Date(),
      },
    });

    return {
      message: '访问授权已撤销',
      grantId,
      revokedBy: grant.studentId === actorId ? 'student' : 'grantee',
    };
  }

  @Get('check-access/:studentId')
  @RequirePermissions(PermissionType.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '检查访问权限' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async checkAccess(
    @Request() req,
    @Param('studentId') studentId: string,
    @Body() checkData: { scope: string },
  ) {
    const granteeId = req.user.userId;

    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        granteeId,
        studentId,
        scope: { contains: checkData.scope },
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return {
      hasAccess: !!grant,
      scope: checkData.scope,
      studentId,
      granteeId,
      expiresAt: grant?.expiresAt,
    };
  }

  @Get('access-history/:studentId')
  @RequirePermissions(PermissionType.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '获取访问历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAccessHistory(
    @Request() req,
    @Param('studentId') studentId: string,
    @Body()
    historyData: { startDate?: string; endDate?: string; limit?: number },
  ) {
    const granteeId = req.user.userId;

    // 验证是否有访问权限
    const hasAccess = await this.prisma.accessGrant.findFirst({
      where: {
        granteeId,
        studentId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException('无权限访问该学生数据');
    }

    // 查询访问历史
    const where: any = {
      actorId: granteeId,
      targetType: 'student',
      targetId: studentId,
      action: {
        in: [
          'view_student_data',
          'view_student_progress',
          'view_student_works',
        ],
      },
    };

    if (historyData.startDate) {
      where.ts = { ...where.ts, gte: new Date(historyData.startDate) };
    }
    if (historyData.endDate) {
      where.ts = { ...where.ts, lte: new Date(historyData.endDate) };
    }

    const history = await this.prisma.auditLog.findMany({
      where,
      orderBy: { ts: 'desc' },
      take: historyData.limit || 50,
    });

    return {
      studentId,
      granteeId,
      history: history.map((record) => ({
        action: record.action,
        timestamp: record.ts,
        metadata: record.metadata,
      })),
      totalCount: history.length,
    };
  }
}
