import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AuditLogEntry {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface AuditLogQuery {
  actorId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsBySeverity: Record<string, number>;
  logsByActor: Record<string, number>;
  recentActivity: any[];
}

@Injectable()
export class AuditLoggingService {
  private readonly logger = new Logger(AuditLoggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 记录审计日志
  async logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          metadata: entry.metadata || {},
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          severity: entry.severity || 'info',
          ts: new Date(),
        },
      });

      // 根据严重程度记录到应用日志
      if (entry.severity === 'critical' || entry.severity === 'error') {
        this.logger.error(
          `审计日志: ${entry.action} - ${entry.actorId} -> ${entry.targetType}:${entry.targetId}`,
          entry.metadata,
        );
      } else if (entry.severity === 'warning') {
        this.logger.warn(
          `审计日志: ${entry.action} - ${entry.actorId} -> ${entry.targetType}:${entry.targetId}`,
          entry.metadata,
        );
      } else {
        this.logger.log(
          `审计日志: ${entry.action} - ${entry.actorId} -> ${entry.targetType}:${entry.targetId}`,
        );
      }
    } catch (error) {
      this.logger.error('记录审计日志失败:', error);
      // 审计日志记录失败不应该影响业务流程，但需要记录错误
    }
  }

  // 记录数据查看事件
  async logDataView(
    viewerId: string,
    targetType: string,
    targetId: string,
    dataType: string,
    scope: string[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      actorId: viewerId,
      action: 'view_data',
      targetType,
      targetId,
      metadata: {
        dataType,
        scope,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity: 'info',
    });
  }

  // 记录数据导出事件
  async logDataExport(
    exporterId: string,
    targetType: string,
    targetId: string,
    exportType: string,
    scope: string[],
    recordCount: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      actorId: exporterId,
      action: 'export_data',
      targetType,
      targetId,
      metadata: {
        exportType,
        scope,
        recordCount,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity: 'warning', // 导出操作需要更高关注度
    });
  }

  // 记录权限变更事件
  async logPermissionChange(
    actorId: string,
    targetType: string,
    targetId: string,
    changeType: 'grant' | 'revoke' | 'modify' | 'expire',
    oldScope?: string[],
    newScope?: string[],
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      actorId,
      action: `permission_${changeType}`,
      targetType,
      targetId,
      metadata: {
        changeType,
        oldScope,
        newScope,
        reason,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    });
  }

  // 记录安全事件
  async logSecurityEvent(
    actorId: string,
    eventType: string,
    description: string,
    severity: 'warning' | 'error' | 'critical',
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      actorId,
      action: 'security_event',
      targetType: 'security',
      targetId: actorId,
      metadata: {
        eventType,
        description,
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity,
    });
  }

  // 查询审计日志
  async queryAuditLogs(query: AuditLogQuery): Promise<{
    logs: any[];
    total: number;
  }> {
    const where: any = {};

    if (query.actorId) {
      where.actorId = query.actorId;
    }

    if (query.targetType) {
      where.targetType = query.targetType;
    }

    if (query.targetId) {
      where.targetId = query.targetId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.startDate || query.endDate) {
      where.ts = {};
      if (query.startDate) {
        where.ts.gte = query.startDate;
      }
      if (query.endDate) {
        where.ts.lte = query.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { ts: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // 获取审计日志统计
  async getAuditLogStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AuditLogStats> {
    const where: any = {};
    if (startDate || endDate) {
      where.ts = {};
      if (startDate) {
        where.ts.gte = startDate;
      }
      if (endDate) {
        where.ts.lte = endDate;
      }
    }

    const [
      totalLogs,
      logsByAction,
      logsBySeverity,
      logsByActor,
      recentActivity,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.getLogsByAction(where),
      this.getLogsBySeverity(where),
      this.getLogsByActor(where),
      this.getRecentActivity(where),
    ]);

    return {
      totalLogs,
      logsByAction,
      logsBySeverity,
      logsByActor,
      recentActivity,
    };
  }

  // 按操作类型统计
  private async getLogsByAction(where: any): Promise<Record<string, number>> {
    const logs = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
    });

    return logs.reduce(
      (acc, log) => {
        acc[log.action] = log._count.action;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  // 按严重程度统计
  private async getLogsBySeverity(where: any): Promise<Record<string, number>> {
    const logs = await this.prisma.auditLog.groupBy({
      by: ['severity'],
      where,
      _count: {
        severity: true,
      },
    });

    return logs.reduce(
      (acc, log) => {
        acc[log.severity] = log._count.severity;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  // 按操作者统计
  private async getLogsByActor(where: any): Promise<Record<string, number>> {
    const logs = await this.prisma.auditLog.groupBy({
      by: ['actorId'],
      where,
      _count: {
        actorId: true,
      },
      orderBy: {
        _count: {
          actorId: 'desc',
        },
      },
      take: 10,
    });

    return logs.reduce(
      (acc, log) => {
        acc[log.actorId] = log._count.actorId;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  // 获取最近活动
  private async getRecentActivity(where: any): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where,
      orderBy: { ts: 'desc' },
      take: 20,
      select: {
        actorId: true,
        action: true,
        targetType: true,
        targetId: true,
        severity: true,
        ts: true,
        metadata: true,
      },
    });
  }

  // 导出审计日志
  async exportAuditLogs(
    query: AuditLogQuery,
    format: 'csv' | 'json' = 'csv',
  ): Promise<string> {
    const { logs } = await this.queryAuditLogs({
      ...query,
      limit: 10000, // 限制导出数量
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV格式
    if (logs.length === 0) {
      return 'timestamp,actorId,action,targetType,targetId,severity,ipAddress,metadata\n';
    }

    const headers = [
      'timestamp',
      'actorId',
      'action',
      'targetType',
      'targetId',
      'severity',
      'ipAddress',
      'metadata',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map((log) =>
        [
          log.ts.toISOString(),
          log.actorId,
          log.action,
          log.targetType,
          log.targetId,
          log.severity,
          log.ipAddress || '',
          JSON.stringify(log.metadata || {}),
        ]
          .map((field) => `"${field}"`)
          .join(','),
      ),
    ];

    return csvRows.join('\n');
  }

  // 清理旧审计日志
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        ts: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`清理了 ${result.count} 条超过 ${daysToKeep} 天的审计日志`);
    return result.count;
  }

  // 获取用户活动摘要
  async getUserActivitySummary(
    userId: string,
    days: number = 30,
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActions: any[];
    dataViews: number;
    dataExports: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where = {
      actorId: userId,
      ts: {
        gte: startDate,
      },
    };

    const [totalActions, actionsByType, recentActions, dataViews, dataExports] =
      await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.getLogsByAction(where),
        this.getRecentActivity(where),
        this.prisma.auditLog.count({
          where: {
            ...where,
            action: 'view_data',
          },
        }),
        this.prisma.auditLog.count({
          where: {
            ...where,
            action: 'export_data',
          },
        }),
      ]);

    return {
      totalActions,
      actionsByType,
      recentActions: recentActions.slice(0, 10),
      dataViews,
      dataExports,
    };
  }

  // 检测异常活动
  async detectAnomalousActivity(
    userId: string,
    hours: number = 24,
  ): Promise<{
    isAnomalous: boolean;
    reasons: string[];
    stats: any;
  }> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const where = {
      actorId: userId,
      ts: {
        gte: startDate,
      },
    };

    const [totalActions, dataViews, dataExports, uniqueTargets] =
      await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.count({
          where: {
            ...where,
            action: 'view_data',
          },
        }),
        this.prisma.auditLog.count({
          where: {
            ...where,
            action: 'export_data',
          },
        }),
        this.prisma.auditLog.findMany({
          where,
          select: { targetId: true },
          distinct: ['targetId'],
        }),
      ]);

    const reasons: string[] = [];
    let isAnomalous = false;

    // 检测异常指标
    if (totalActions > 1000) {
      reasons.push(`活动量异常: ${totalActions} 次操作`);
      isAnomalous = true;
    }

    if (dataViews > 500) {
      reasons.push(`数据查看异常: ${dataViews} 次查看`);
      isAnomalous = true;
    }

    if (dataExports > 10) {
      reasons.push(`数据导出异常: ${dataExports} 次导出`);
      isAnomalous = true;
    }

    if (uniqueTargets.length > 100) {
      reasons.push(`访问目标异常: ${uniqueTargets.length} 个不同目标`);
      isAnomalous = true;
    }

    return {
      isAnomalous,
      reasons,
      stats: {
        totalActions,
        dataViews,
        dataExports,
        uniqueTargets: uniqueTargets.length,
      },
    };
  }
}
