import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../../auth/decorators/permissions.decorator';
import { RateLimitService } from '../services/rate-limit.service';
import { DataMaskingService } from '../services/data-masking.service';
import {
  PermissionGranularityService,
  PermissionScope,
} from '../services/permission-granularity.service';
import { ExpirationManagementService } from '../services/expiration-management.service';
import { AuditLoggingService } from '../services/audit-logging.service';
import {
  AppealArbitrationService,
  AppealType,
  AppealStatus,
} from '../services/appeal-arbitration.service';

@ApiTags('security')
@Controller('security')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly dataMaskingService: DataMaskingService,
    private readonly permissionGranularityService: PermissionGranularityService,
    private readonly expirationManagementService: ExpirationManagementService,
    private readonly auditLoggingService: AuditLoggingService,
    private readonly appealArbitrationService: AppealArbitrationService,
  ) {}

  // 搜索限流检查
  @Post('rate-limit/check-search')
  @RequirePermissions(Permission.VIEW_STUDENT_DATA)
  @ApiOperation({ summary: '检查搜索限流' })
  @ApiResponse({
    status: 200,
    description: '限流检查结果',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean' },
        remaining: { type: 'number' },
        resetTime: { type: 'number' },
        blocked: { type: 'boolean' },
        reason: { type: 'string' },
      },
    },
  })
  async checkSearchRateLimit(@Request() req) {
    const userId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await this.rateLimitService.checkSearchRateLimit(
      userId,
      ipAddress,
    );

    if (!result.allowed) {
      throw new HttpException(
        result.reason || '请求被限流',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return result;
  }

  // 导出限流检查
  @Post('rate-limit/check-export')
  @RequirePermissions(Permission.VIEW_STUDENT_DATA)
  @ApiOperation({ summary: '检查导出限流' })
  async checkExportRateLimit(@Request() req) {
    const userId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await this.rateLimitService.checkExportRateLimit(
      userId,
      ipAddress,
    );

    if (!result.allowed) {
      throw new HttpException(
        result.reason || '导出请求被限流',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return result;
  }

  // 获取限流状态
  @Get('rate-limit/status')
  @ApiOperation({ summary: '获取限流状态' })
  async getRateLimitStatus(@Request() req) {
    const userId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    return this.rateLimitService.getRateLimitStatus(userId, ipAddress);
  }

  // 数据脱敏 - 获取学生搜索结果
  @Post('data-masking/search-students')
  @RequirePermissions(Permission.VIEW_STUDENT_DATA)
  @ApiOperation({ summary: '获取脱敏的学生搜索结果' })
  async getMaskedStudentSearchResults(
    @Request() req,
    @Body()
    searchParams: {
      type: 'name' | 'id';
      nickname?: string;
      school?: string;
      anonymousId?: string;
    },
  ) {
    const requesterId = req.user.userId;

    // 检查搜索限流
    const rateLimitResult = await this.rateLimitService.checkSearchRateLimit(
      requesterId,
      req.ip || req.connection.remoteAddress,
    );

    if (!rateLimitResult.allowed) {
      throw new HttpException(
        rateLimitResult.reason || '搜索请求被限流',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 执行搜索逻辑（这里需要调用实际的搜索服务）
    // const students = await this.searchService.searchStudents(searchParams);

    // 模拟搜索结果
    const students = [
      {
        id: 'student-1',
        displayName: '小明',
        school: '北京市第一中学',
        className: '初一(3)班',
        anonymousId: 'S-8F3K2Q',
        discoverable: true,
      },
    ];

    // 应用数据脱敏
    const maskedResults =
      await this.dataMaskingService.maskStudentSearchResults(
        students,
        requesterId,
      );

    // 记录搜索审计日志
    await this.auditLoggingService.logAuditEvent({
      actorId: requesterId,
      action: 'search_students',
      targetType: 'search',
      targetId: 'students',
      metadata: {
        searchType: searchParams.type,
        searchParams,
        resultCount: maskedResults.length,
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return maskedResults;
  }

  // 权限粒度控制 - 获取权限范围定义
  @Get('permissions/scopes')
  @ApiOperation({ summary: '获取权限范围定义' })
  async getPermissionScopes() {
    return this.permissionGranularityService.getScopeDefinitions();
  }

  // 获取默认权限范围
  @Get('permissions/default-scopes')
  @ApiOperation({ summary: '获取默认权限范围' })
  @ApiQuery({
    name: 'role',
    enum: ['parent', 'teacher'],
    description: '用户角色',
  })
  async getDefaultScopes(@Query('role') role: 'parent' | 'teacher') {
    return this.permissionGranularityService.getDefaultScopes(role);
  }

  // 验证权限范围
  @Post('permissions/validate-scopes')
  @ApiOperation({ summary: '验证权限范围' })
  async validateScopes(
    @Body() params: { scopes: PermissionScope[]; role: 'parent' | 'teacher' },
  ) {
    return this.permissionGranularityService.validateScopes(
      params.scopes,
      params.role,
    );
  }

  // 创建权限授权
  @Post('permissions/grants')
  @RequirePermissions(Permission.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '创建权限授权' })
  async createPermissionGrant(
    @Request() req,
    @Body()
    params: {
      studentId: string;
      granteeId: string;
      scopes: PermissionScope[];
      expiresAt?: string;
      reason?: string;
    },
  ) {
    const grantId =
      await this.permissionGranularityService.createPermissionGrant(
        params.studentId,
        params.granteeId,
        {
          scopes: params.scopes,
          expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
          grantedAt: new Date(),
          grantedBy: req.user.userId,
          reason: params.reason,
        },
      );

    return { grantId };
  }

  // 检查权限
  @Get('permissions/check')
  @ApiOperation({ summary: '检查权限' })
  @ApiQuery({ name: 'studentId', description: '学生ID' })
  @ApiQuery({ name: 'granteeId', description: '被授权者ID' })
  @ApiQuery({ name: 'scope', enum: PermissionScope, description: '权限范围' })
  async checkPermission(
    @Query('studentId') studentId: string,
    @Query('granteeId') granteeId: string,
    @Query('scope') scope: PermissionScope,
  ) {
    const hasPermission =
      await this.permissionGranularityService.checkPermission(
        studentId,
        granteeId,
        scope,
      );

    return { hasPermission };
  }

  // 获取用户权限
  @Get('permissions/user/:studentId/:granteeId')
  @ApiOperation({ summary: '获取用户权限' })
  async getUserPermissions(
    @Param('studentId') studentId: string,
    @Param('granteeId') granteeId: string,
  ) {
    const permissions =
      await this.permissionGranularityService.getUserPermissions(
        studentId,
        granteeId,
      );

    return { permissions };
  }

  // 修改权限范围
  @Put('permissions/grants/:grantId')
  @RequirePermissions(Permission.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '修改权限范围' })
  async modifyPermissionScope(
    @Request() req,
    @Param('grantId') grantId: string,
    @Body()
    params: {
      scopes: PermissionScope[];
      reason?: string;
    },
  ) {
    await this.permissionGranularityService.modifyPermissionScope(
      grantId,
      params.scopes,
      req.user.userId,
      params.reason,
    );

    return { success: true };
  }

  // 撤销权限
  @Post('permissions/grants/:grantId/revoke')
  @RequirePermissions(Permission.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '撤销权限' })
  async revokePermission(
    @Request() req,
    @Param('grantId') grantId: string,
    @Body() params: { reason?: string },
  ) {
    await this.permissionGranularityService.revokePermission(
      grantId,
      req.user.userId,
      params.reason,
    );

    return { success: true };
  }

  // 到期管理 - 设置权限到期时间
  @Put('expiration/grants/:grantId')
  @RequirePermissions(Permission.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '设置权限到期时间' })
  async setPermissionExpiration(
    @Request() req,
    @Param('grantId') grantId: string,
    @Body()
    params: {
      expirationDate: string;
      reason?: string;
    },
  ) {
    await this.expirationManagementService.setPermissionExpiration(
      grantId,
      new Date(params.expirationDate),
      req.user.userId,
      params.reason,
    );

    return { success: true };
  }

  // 续期权限
  @Post('expiration/grants/:grantId/renew')
  @RequirePermissions(Permission.REVOKE_RELATIONSHIPS)
  @ApiOperation({ summary: '续期权限' })
  async renewPermission(
    @Request() req,
    @Param('grantId') grantId: string,
    @Body()
    params: {
      renewalDays: number;
      reason?: string;
    },
  ) {
    await this.expirationManagementService.renewPermission(
      grantId,
      params.renewalDays,
      req.user.userId,
      params.reason,
    );

    return { success: true };
  }

  // 获取即将到期的权限
  @Get('expiration/expiring')
  @RequirePermissions(Permission.VIEW_SYSTEM_AUDIT)
  @ApiOperation({ summary: '获取即将到期的权限' })
  @ApiQuery({ name: 'days', description: '天数', required: false })
  async getExpiringPermissions(@Query('days') days?: number) {
    return this.expirationManagementService.getExpiringPermissions(days || 7);
  }

  // 获取到期统计
  @Get('expiration/stats')
  @RequirePermissions(Permission.VIEW_SYSTEM_AUDIT)
  @ApiOperation({ summary: '获取到期统计' })
  async getExpirationStats() {
    return this.expirationManagementService.getExpirationStats();
  }

  // 审计日志 - 查询审计日志
  @Get('audit/logs')
  @RequirePermissions(Permission.VIEW_SYSTEM_AUDIT)
  @ApiOperation({ summary: '查询审计日志' })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async queryAuditLogs(
    @Query('actorId') actorId?: string,
    @Query('targetType') targetType?: string,
    @Query('action') action?: string,
    @Query('severity') severity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditLoggingService.queryAuditLogs({
      actorId,
      targetType,
      action,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
  }

  // 获取审计日志统计
  @Get('audit/stats')
  @RequirePermissions(Permission.VIEW_SYSTEM_AUDIT)
  @ApiOperation({ summary: '获取审计日志统计' })
  async getAuditLogStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditLoggingService.getAuditLogStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // 导出审计日志
  @Get('audit/export')
  @RequirePermissions(Permission.VIEW_SYSTEM_AUDIT)
  @ApiOperation({ summary: '导出审计日志' })
  @ApiQuery({ name: 'format', enum: ['csv', 'json'], description: '导出格式' })
  async exportAuditLogs(
    @Query() query: any,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    // 检查导出限流
    const rateLimitResult = await this.rateLimitService.checkExportRateLimit(
      query.actorId || 'system',
      '127.0.0.1', // 这里应该从请求中获取真实IP
    );

    if (!rateLimitResult.allowed) {
      throw new HttpException(
        rateLimitResult.reason || '导出请求被限流',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const data = await this.auditLoggingService.exportAuditLogs(query, format);

    // 记录导出审计日志
    await this.auditLoggingService.logDataExport(
      query.actorId || 'system',
      'audit_logs',
      'all',
      format,
      ['audit_logs'],
      0, // 这里应该获取实际记录数
    );

    return { data, format };
  }

  // 申诉仲裁 - 提交申诉
  @Post('appeals')
  @RequirePermissions(Permission.VIEW_OWN_AUDIT)
  @ApiOperation({ summary: '提交申诉' })
  async submitAppeal(
    @Request() req,
    @Body()
    submission: {
      targetUserId: string;
      appealType: AppealType;
      description: string;
      evidence?: any;
      requestedAction: string;
    },
  ) {
    const appealId = await this.appealArbitrationService.submitAppeal(
      req.user.userId,
      {
        studentId: req.user.userId,
        ...submission,
      },
    );

    return { appealId };
  }

  // 审核申诉
  @Post('appeals/:appealId/review')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '审核申诉' })
  async reviewAppeal(
    @Request() req,
    @Param('appealId') appealId: string,
    @Body()
    review: {
      decision: 'APPROVED' | 'REJECTED';
      reason: string;
      actions?: string[];
    },
  ) {
    await this.appealArbitrationService.reviewAppeal(
      appealId,
      req.user.userId,
      {
        appealId,
        reviewerId: req.user.userId,
        ...review,
      },
    );

    return { success: true };
  }

  // 获取申诉列表
  @Get('appeals')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '获取申诉列表' })
  async getAppeals(
    @Query('status') status?: AppealStatus,
    @Query('appealType') appealType?: AppealType,
    @Query('studentId') studentId?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.appealArbitrationService.getAppeals({
      status,
      appealType,
      studentId,
      targetUserId,
      limit,
      offset,
    });
  }

  // 获取申诉详情
  @Get('appeals/:appealId')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '获取申诉详情' })
  async getAppealDetails(@Param('appealId') appealId: string) {
    return this.appealArbitrationService.getAppealDetails(appealId);
  }

  // 获取申诉统计
  @Get('appeals/stats')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '获取申诉统计' })
  async getAppealStats() {
    return this.appealArbitrationService.getAppealStats();
  }

  // 关闭申诉
  @Post('appeals/:appealId/close')
  @RequirePermissions(Permission.HANDLE_APPEALS)
  @ApiOperation({ summary: '关闭申诉' })
  async closeAppeal(
    @Request() req,
    @Param('appealId') appealId: string,
    @Body() params: { reason?: string },
  ) {
    await this.appealArbitrationService.closeAppeal(
      appealId,
      req.user.userId,
      params.reason,
    );

    return { success: true };
  }

  // 获取用户申诉历史
  @Get('appeals/history/:userId')
  @RequirePermissions(Permission.VIEW_OWN_AUDIT)
  @ApiOperation({ summary: '获取用户申诉历史' })
  @ApiQuery({ name: 'role', enum: ['student', 'target'], description: '角色' })
  async getUserAppealHistory(
    @Param('userId') userId: string,
    @Query('role') role: 'student' | 'target',
  ) {
    return this.appealArbitrationService.getUserAppealHistory(userId, role);
  }
}
