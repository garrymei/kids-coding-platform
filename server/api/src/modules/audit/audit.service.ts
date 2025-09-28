import { Injectable } from '@nestjs/common';
import { LoggerService, AuditEntry } from '../../common/services/logger.service';

@Injectable()
export class AuditService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * 获取审计日志（模拟实现）
   * 在实际环境中，这里应该从数据库或日志存储中查询
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: AuditEntry[];
    total: number;
    hasMore: boolean;
  }> {
    // 模拟审计日志数据
    const mockLogs: AuditEntry[] = [
      {
        ts: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5分钟前
        action: 'code_execution',
        userId: 'stu_123',
        resource: 'level',
        resourceId: 'py-io-001',
        details: {
          codeLength: 45,
          result: { exitCode: 0, hasError: false, durationMs: 120 }
        },
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        ts: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10分钟前
        action: 'judging',
        userId: 'stu_123',
        resource: 'level',
        resourceId: 'py-io-001',
        details: {
          gameType: 'io',
          passed: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
        },
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        ts: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15分钟前
        action: 'data_export',
        userId: 'parent_456',
        resource: 'student_progress',
        resourceId: 'stu_123',
        details: {
          exportType: 'progress_report',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        ip: '192.168.1.200',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        ts: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20分钟前
        action: 'settings_change',
        userId: 'stu_123',
        resource: 'user_settings',
        details: {
          settingType: 'sound_enabled',
          oldValue: true,
          newValue: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString()
        },
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];

    // 应用过滤器
    let filteredLogs = mockLogs;

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.ts) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.ts) <= endDate);
    }

    // 排序（最新的在前）
    filteredLogs.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    // 分页
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    const hasMore = offset + limit < filteredLogs.length;

    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      hasMore
    };
  }

  /**
   * 导出审计日志
   */
  async exportAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    csv: string;
    filename: string;
  }> {
    const { logs } = await this.getAuditLogs({ ...filters, limit: 10000 });

    // 生成 CSV 格式
    const headers = ['时间', '操作', '用户ID', '资源', '资源ID', 'IP地址', '用户代理', '详情'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.ts,
        log.action,
        log.userId || '',
        log.resource,
        log.resourceId || '',
        log.ip || '',
        log.userAgent || '',
        JSON.stringify(log.details || {})
      ].map(field => `"${field}"`); // 转义引号
      
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

    return { csv, filename };
  }

  /**
   * 获取审计统计信息
   */
  async getAuditStats(timeRange: '24h' | '7d' | '30d'): Promise<{
    totalActions: number;
    actionBreakdown: Record<string, number>;
    userBreakdown: Record<string, number>;
    resourceBreakdown: Record<string, number>;
  }> {
    const { logs } = await this.getAuditLogs({ limit: 10000 });

    // 根据时间范围过滤
    const now = new Date();
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const filteredLogs = logs.filter(log => {
      const logTime = new Date(log.ts).getTime();
      return now.getTime() - logTime <= timeRangeMs[timeRange];
    });

    // 统计各种指标
    const actionBreakdown: Record<string, number> = {};
    const userBreakdown: Record<string, number> = {};
    const resourceBreakdown: Record<string, number> = {};

    filteredLogs.forEach(log => {
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
      if (log.userId) {
        userBreakdown[log.userId] = (userBreakdown[log.userId] || 0) + 1;
      }
      resourceBreakdown[log.resource] = (resourceBreakdown[log.resource] || 0) + 1;
    });

    return {
      totalActions: filteredLogs.length,
      actionBreakdown,
      userBreakdown,
      resourceBreakdown
    };
  }
}
