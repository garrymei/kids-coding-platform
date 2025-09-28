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

// Audit event types as specified
export type AuditEventType = 
  | 'PARENT_LINK_DECISION'
  | 'CLASS_MEMBER_DECISION'
  | 'EXPORT_REPORT'
  | 'LOGIN'
  | 'PASSWORD_RESET'
  | 'EXEC_BLOCK'; // Added for M10-B execution blocking

export interface AuditEvent {
  id: string;
  ts: string;
  cid: string;
  actorId: string;
  actorRole: 'student' | 'parent' | 'teacher' | 'admin';
  action: AuditEventType;
  target?: string;          // 资源ID，如 requestId 或 classMemberId
  payload?: Record<string, any>; // 非敏感摘要
  ip?: string;
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
          ipAddress: data.ip,
          userAgent: data.userAgent,
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

  // 记录登录事件
  async logLogin(
    actorId: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'LOGIN',
      targetType: 'auth',
      targetId: actorId,
      ip,
      userAgent,
      metadata,
    });
  }

  // 记录密码重置事件
  async logPasswordReset(
    actorId: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'PASSWORD_RESET',
      targetType: 'auth',
      targetId: actorId,
      ip,
      userAgent,
      metadata,
    });
  }

  // 记录家长链接决策
  async logParentLinkDecision(
    actorId: string,
    targetId: string,
    decision: 'approve' | 'reject',
    ip?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'PARENT_LINK_DECISION',
      targetType: 'relationship',
      targetId,
      ip,
      metadata: {
        decision,
        ...metadata,
      },
    });
  }

  // 记录班级成员决策
  async logClassMemberDecision(
    actorId: string,
    classId: string,
    studentId: string,
    decision: 'add' | 'remove',
    ip?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'CLASS_MEMBER_DECISION',
      targetType: 'class',
      targetId: classId,
      ip,
      metadata: {
        studentId,
        decision,
        ...metadata,
      },
    });
  }

  // 记录报告导出
  async logExportReport(
    actorId: string,
    reportType: string,
    ip?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'EXPORT_REPORT',
      targetType: 'report',
      targetId: reportType,
      ip,
      metadata,
    });
  }

  // 记录执行器封禁事件 (for M10-B)
  async logExecBlock(
    actorId: string,
    targetId: string,
    reason: string,
    ip?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action: 'EXEC_BLOCK',
      targetType: 'execution',
      targetId,
      ip,
      metadata: {
        reason,
        ...metadata,
      },
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

  // 查询审计日志 (符合规范的分页查询接口)
  async queryAuditLogsPaginated(filters: {
    from?: string;
    to?: string;
    action?: AuditEventType;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};

    if (filters.action) {
      where.action = filters.action;
    }
    
    if (filters.from || filters.to) {
      where.ts = {};
      if (filters.from) {
        where.ts.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.ts.lte = new Date(filters.to);
      }
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const skip = (page - 1) * pageSize;

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
        take: pageSize,
        skip: skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // 转换为规范的 AuditEvent 格式
    const auditEvents: AuditEvent[] = logs.map(log => ({
      id: log.id,
      ts: log.ts.toISOString(),
      cid: '', // We don't have cid in the current model, would need migration
      actorId: log.actorId,
      actorRole: log.actor.role.name as 'student' | 'parent' | 'teacher' | 'admin',
      action: log.action as AuditEventType,
      target: log.targetId,
      payload: log.metadata ? JSON.parse(JSON.stringify(log.metadata)) : undefined,
      ip: log.ipAddress || undefined,
    }));

    return {
      items: auditEvents,
      page,
      pageSize,
      total: totalCount,
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