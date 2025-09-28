import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * 获取审计日志
   * GET /audit/logs
   */
  @Get('logs')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    try {
      const filters = {
        userId,
        action,
        resource,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      };

      return await this.auditService.getAuditLogs(filters);
    } catch (error) {
      throw new HttpException(
        'Failed to get audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 导出审计日志
   * GET /audit/export
   */
  @Get('export')
  async exportAuditLogs(
    @Res() res: Response,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      const filters = {
        userId,
        action,
        resource,
        startDate,
        endDate
      };

      const { csv, filename } = await this.auditService.exportAuditLogs(filters);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      throw new HttpException(
        'Failed to export audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取审计统计信息
   * GET /audit/stats
   */
  @Get('stats')
  async getAuditStats(@Query('timeRange') timeRange: '24h' | '7d' | '30d' = '24h') {
    try {
      return await this.auditService.getAuditStats(timeRange);
    } catch (error) {
      throw new HttpException(
        'Failed to get audit stats',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
