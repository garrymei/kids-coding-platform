import { 
  Controller, 
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions, Permission } from '../../auth/decorators/permissions.decorator';
import { AuditLoggerService, AuditEventType } from '../../audit/services/audit-logger.service';

@ApiTags('admin-audit')
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminAuditController {
  constructor(
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Get()
  @RequirePermissions(Permission.VIEW_SYSTEM_AUDIT)
  @ApiOperation({ summary: '查询审计日志' })
  @ApiQuery({ name: 'from', required: false, description: '开始时间 (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: '结束时间 (ISO 8601)' })
  @ApiQuery({ name: 'action', required: false, description: '动作类型' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页大小' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAuditLogs(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('action') action?: AuditEventType,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const adminId = req.user.userId;

    const result = await this.auditLogger.queryAuditLogsPaginated({
      from,
      to,
      action,
      page,
      pageSize,
    });

    // 记录导出操作 - Export report audit event
    await this.auditLogger.logExportReport(
      adminId,
      'audit_logs',
      req.ip,
      {
        from,
        to,
        action,
        page,
        pageSize,
      },
    );

    return result;
  }
}