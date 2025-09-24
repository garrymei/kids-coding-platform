import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AuditLogData {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLoggerService {
  constructor(private readonly prisma: PrismaService) {}

  // 记录审计日志
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: data.actorId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          metadata: data.metadata || {},
          // 这里需要添加ip和userAgent字段到AuditLog模型
          // ip: data.ip,
          // userAgent: data.userAgent,
          ts: new Date(),
        },
      });
    } catch (error) {
      // 审计日志记录失败不应该影响主业务流程
      console.error('Failed to log audit event:', error);
    }
  }

  // 记录数据访问日志
  async logDataAccess(
    actorId: string,
    targetStudentId: string,
    dataType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'view_student_data',
      targetType: 'student',
      targetId: targetStudentId,
      metadata: {
        dataType,
        ...metadata,
      },
    });
  }

  // 记录权限变更日志
  async logPermissionChange(
    actorId: string,
    targetUserId: string,
    changeType: 'grant' | 'revoke' | 'update',
    oldPermissions: string[],
    newPermissions: string[],
    reason?: string
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'permission_change',
      targetType: 'user',
      targetId: targetUserId,
      metadata: {
        changeType,
        oldPermissions,
        newPermissions,
        reason,
        changes: this.calculatePermissionChanges(oldPermissions, newPermissions),
      },
    });
  }

  // 记录关系变更日志
  async logRelationshipChange(
    actorId: string,
    relationshipId: string,
    changeType: 'create' | 'update' | 'revoke',
    oldStatus?: string,
    newStatus?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'relationship_change',
      targetType: 'relationship',
      targetId: relationshipId,
      metadata: {
        changeType,
        oldStatus,
        newStatus,
        ...metadata,
      },
    });
  }

  // 记录搜索日志
  async logSearch(
    actorId: string,
    searchType: string,
    keyword: string,
    resultCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'search_students',
      targetType: 'search',
      targetId: 'students',
      metadata: {
        searchType,
        keyword,
        resultCount,
        ...metadata,
      },
    });
  }

  // 记录申请日志
  async logRequest(
    actorId: string,
    requestType: 'create' | 'approve' | 'reject',
    targetId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: `relationship_request_${requestType}`,
      targetType: 'consent',
      targetId,
      metadata,
    });
  }

  // 记录系统操作日志
  async logSystemOperation(
    actorId: string,
    operation: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: `system_${operation}`,
      targetType,
      targetId,
      metadata,
    });
  }

  // 计算权限变更
  private calculatePermissionChanges(oldPermissions: string[], newPermissions: string[]): {
    added: string[];
    removed: string[];
    unchanged: string[];
  } {
    const added = newPermissions.filter(p => !oldPermissions.includes(p));
    const removed = oldPermissions.filter(p => !newPermissions.includes(p));
    const unchanged = oldPermissions.filter(p => newPermissions.includes(p));

    return { added, removed, unchanged };
  }

  // 查询审计日志
  async queryAuditLogs(filters: {
    actorId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.targetType) {
      where.targetType = filters.targetType;
    }
    if (filters.targetId) {
      where.targetId = filters.targetId;
    }
    if (filters.startDate || filters.endDate) {
      where.ts = {};
      if (filters.startDate) {
        where.ts.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.ts.lte = filters.endDate;
      }
    }

    const [logs, totalCount] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { ts: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      totalCount,
      hasMore: (filters.offset || 0) + (filters.limit || 100) < totalCount,
    };
  }

  // 导出审计日志
  async exportAuditLogs(filters: {
    actorId?: string;
    action?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.targetType) {
      where.targetType = filters.targetType;
    }
    if (filters.startDate || filters.endDate) {
      where.ts = {};
      if (filters.startDate) {
        where.ts.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.ts.lte = filters.endDate;
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { ts: 'desc' },
    });

    // 转换为CSV格式
    const csvData = logs.map(log => ({
      timestamp: log.ts.toISOString(),
      actorId: log.actorId,
      actorName: log.actor.displayName,
      actorEmail: log.actor.email,
      actorRole: log.actor.role.name,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: JSON.stringify(log.metadata),
    }));

    return csvData;
  }

  // 获取审计统计
  async getAuditStatistics(filters: {
    startDate?: Date;
    endDate?: Date;
    actorId?: string;
  }) {
    const where: any = {};

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.startDate || filters.endDate) {
      where.ts = {};
      if (filters.startDate) {
        where.ts.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.ts.lte = filters.endDate;
      }
    }

    const [
      totalLogs,
      actionStats,
      targetTypeStats,
      dailyStats,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.getActionStatistics(where),
      this.getTargetTypeStatistics(where),
      this.getDailyStatistics(where),
    ]);

    return {
      totalLogs,
      actionStats,
      targetTypeStats,
      dailyStats,
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    };
  }

  private async getActionStatistics(where: any) {
    const logs = await this.prisma.auditLog.findMany({
      where,
      select: { action: true },
    });

    const stats = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([action, count]) => ({
      action,
      count,
    }));
  }

  private async getTargetTypeStatistics(where: any) {
    const logs = await this.prisma.auditLog.findMany({
      where,
      select: { targetType: true },
    });

    const stats = logs.reduce((acc, log) => {
      acc[log.targetType] = (acc[log.targetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([targetType, count]) => ({
      targetType,
      count,
    }));
  }

  private async getDailyStatistics(where: any) {
    const logs = await this.prisma.auditLog.findMany({
      where,
      select: { ts: true },
    });

    const stats = logs.reduce((acc, log) => {
      const date = log.ts.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([date, count]) => ({
      date,
      count,
    }));
  }
}
