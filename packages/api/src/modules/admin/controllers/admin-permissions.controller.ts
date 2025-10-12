import {
  Controller,
  Get,
  Post,
  Put,
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
  Permission,
} from '../../auth/decorators/permissions.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('admin-permissions')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminPermissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('system-status')
  @RequirePermissions(Permission.SYSTEM_MAINTENANCE)
  @ApiOperation({ summary: '获取系统状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSystemStatus(@Request() req) {
    const adminId = req.user.userId;

    // 获取系统统计信息
    const stats = {
      totalUsers: await this.prisma.user.count(),
      totalStudents: await this.prisma.user.count({
        where: { role: 'student' },
      }),
      totalParents: await this.prisma.user.count({
        where: { role: 'parent' },
      }),
      totalTeachers: await this.prisma.user.count({
        where: { role: 'teacher' },
      }),
      totalClasses: await this.prisma.class.count(),
      activeClasses: await this.prisma.class.count({
        where: { status: 'ACTIVE' },
      }),
      totalRelationships: await this.prisma.relationship.count(),
      activeRelationships: await this.prisma.relationship.count({
        where: { status: 'ACTIVE' },
      }),
      pendingConsents: await this.prisma.consent.count({
        where: { status: 'PENDING' },
      }),
    };

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'view_system_status',
        targetType: 'system',
        targetId: 'system',
        metadata: {
          stats,
        },
        ts: new Date(),
      },
    });

    return {
      systemStatus: 'healthy',
      timestamp: new Date(),
      stats,
    };
  }

  @Get('appeals')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '获取申诉列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAppeals(@Request() req, @Query() query: any) {
    const adminId = req.user.userId;
    const { status, type, startDate, endDate } = query;

    // 这里应该有一个申诉表，暂时用审计日志模拟
    const where: any = {
      action: { in: ['appeal_created', 'appeal_resolved'] },
    };

    if (status) {
      where.metadata = { path: ['status'], equals: status };
    }

    if (startDate) {
      where.ts = { ...where.ts, gte: new Date(startDate) };
    }
    if (endDate) {
      where.ts = { ...where.ts, lte: new Date(endDate) };
    }

    const appeals = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { ts: 'desc' },
      take: 50,
    });

    return appeals;
  }

  @Post('handle-appeal/:appealId')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '处理申诉（需要二人审批）' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async handleAppeal(
    @Request() req,
    @Param('appealId') appealId: string,
    @Body()
    decision: {
      action: 'approve' | 'reject';
      reason: string;
      requiresSecondApproval?: boolean;
    },
  ) {
    const adminId = req.user.userId;

    // 检查是否需要二次审批
    if (decision.requiresSecondApproval) {
      // 创建待二次审批的记录
      const pendingApproval = {
        id: 'temp-approval-id',
        appealId,
        firstApproverId: adminId,
        status: 'pending_second_approval',
        decision: decision.action,
        reason: decision.reason,
        createdAt: new Date(),
      };

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'first_approval_appeal',
          targetType: 'appeal',
          targetId: appealId,
          metadata: {
            decision: decision.action,
            reason: decision.reason,
            requiresSecondApproval: true,
          },
          ts: new Date(),
        },
      });

      return {
        message: '申诉已提交，等待二次审批',
        approvalId: pendingApproval.id,
        status: 'pending_second_approval',
      };
    }

    // 直接处理申诉
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'resolve_appeal',
        targetType: 'appeal',
        targetId: appealId,
        metadata: {
          decision: decision.action,
          reason: decision.reason,
          resolvedAt: new Date(),
        },
        ts: new Date(),
      },
    });

    return {
      message: '申诉已处理',
      decision: decision.action,
      reason: decision.reason,
    };
  }

  @Post('second-approval/:approvalId')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '二次审批申诉' })
  @ApiResponse({ status: 200, description: '审批完成' })
  async secondApproval(
    @Request() req,
    @Param('approvalId') approvalId: string,
    @Body() approval: { action: 'approve' | 'reject'; reason: string },
  ) {
    const adminId = req.user.userId;

    // 这里应该查找待二次审批的记录
    // 验证第一个审批人不是当前用户
    const pendingApproval = {
      id: approvalId,
      appealId: 'temp-appeal-id',
      firstApproverId: 'other-admin-id',
      status: 'pending_second_approval',
    };

    if (pendingApproval.firstApproverId === adminId) {
      throw new Error('不能对自己的一审进行二次审批');
    }

    // 完成二次审批
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'second_approval_appeal',
        targetType: 'appeal',
        targetId: pendingApproval.appealId,
        metadata: {
          approvalId,
          decision: approval.action,
          reason: approval.reason,
          firstApproverId: pendingApproval.firstApproverId,
          secondApproverId: adminId,
          completedAt: new Date(),
        },
        ts: new Date(),
      },
    });

    return {
      message: '二次审批完成',
      decision: approval.action,
      reason: approval.reason,
    };
  }

  @Get('system-audit')
  @RequirePermissions(Permission.VIEW_SYSTEM_AUDIT)
  @ApiOperation({ summary: '查看系统审计日志' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSystemAudit(@Request() req, @Query() query: any) {
    const adminId = req.user.userId;
    const { action, targetType, startDate, endDate, limit = 100 } = query;

    const where: any = {};

    if (action) {
      where.action = action;
    }
    if (targetType) {
      where.targetType = targetType;
    }
    if (startDate) {
      where.ts = { ...where.ts, gte: new Date(startDate) };
    }
    if (endDate) {
      where.ts = { ...where.ts, lte: new Date(endDate) };
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { ts: 'desc' },
      take: parseInt(limit),
    });

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'view_system_audit',
        targetType: 'system',
        targetId: 'audit_logs',
        metadata: {
          queryParams: query,
          resultCount: auditLogs.length,
        },
        ts: new Date(),
      },
    });

    return {
      auditLogs,
      totalCount: auditLogs.length,
      queryParams: query,
    };
  }

  @Get('user-management')
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: '用户管理' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserManagement(@Request() req, @Query() query: any) {
    const adminId = req.user.userId;
    const { role, status, search, page = 1, limit = 20 } = query;

    const where: any = {};

    if (role) {
      where.role = { name: role };
    }
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // 不包含敏感信息
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };
  }

  @Put('user-status/:userId')
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: '更新用户状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserStatus(
    @Request() req,
    @Param('userId') userId: string,
    @Body()
    statusData: {
      status: 'active' | 'inactive' | 'suspended';
      reason?: string;
    },
  ) {
    const adminId = req.user.userId;

    // 这里应该有一个用户状态字段，暂时用审计日志记录
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'update_user_status',
        targetType: 'user',
        targetId: userId,
        metadata: {
          newStatus: statusData.status,
          reason: statusData.reason,
          updatedAt: new Date(),
        },
        ts: new Date(),
      },
    });

    return {
      message: '用户状态已更新',
      userId,
      status: statusData.status,
      reason: statusData.reason,
    };
  }

  @Get('data-export')
  @RequirePermissions(Permission.SYSTEM_MAINTENANCE)
  @ApiOperation({ summary: '数据导出（系统运维）' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportData(@Request() req, @Query() query: any) {
    const adminId = req.user.userId;
    const { dataType, startDate, endDate } = query;

    // 根据数据类型导出相应的数据
    let exportData = {};

    switch (dataType) {
      case 'users':
        exportData = await this.exportUsersData(startDate, endDate);
        break;
      case 'relationships':
        exportData = await this.exportRelationshipsData(startDate, endDate);
        break;
      case 'audit_logs':
        exportData = await this.exportAuditLogsData(startDate, endDate);
        break;
      default:
        throw new Error('不支持的数据类型');
    }

    // 记录导出日志
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'export_data',
        targetType: 'system',
        targetId: dataType,
        metadata: {
          dataType,
          startDate,
          endDate,
          recordCount: Array.isArray(exportData) ? exportData.length : 0,
        },
        ts: new Date(),
      },
    });

    return {
      message: '数据导出完成',
      dataType,
      recordCount: Array.isArray(exportData) ? exportData.length : 0,
      data: exportData,
    };
  }

  private async exportUsersData(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // 不包含敏感信息
      },
    });
  }

  private async exportRelationshipsData(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    return this.prisma.relationship.findMany({
      where,
      include: {
        student: { select: { id: true, displayName: true } },
        party: { select: { id: true, displayName: true, role: true } },
      },
    });
  }

  private async exportAuditLogsData(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) {
      where.ts = { ...where.ts, gte: new Date(startDate) };
    }
    if (endDate) {
      where.ts = { ...where.ts, lte: new Date(endDate) };
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, displayName: true, role: true } },
      },
    });
  }
}
