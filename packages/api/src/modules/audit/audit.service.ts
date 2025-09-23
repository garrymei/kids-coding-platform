import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData) {
    return this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        metadata: data.metadata || {},
      },
    });
  }

  // 记录查看学生数据
  async logStudentDataView(actorId: string, studentId: string, dataType: string, metadata?: Record<string, any>) {
    return this.log({
      actorId,
      action: 'view_student_data',
      targetType: 'student',
      targetId: studentId,
      metadata: {
        dataType,
        ...metadata,
      },
    });
  }

  // 记录授权操作
  async logAccessGrant(actorId: string, targetId: string, action: 'grant' | 'revoke' | 'update', metadata?: Record<string, any>) {
    return this.log({
      actorId,
      action: `access_${action}`,
      targetType: 'access_grant',
      targetId,
      metadata,
    });
  }

  // 记录关系操作
  async logRelationshipChange(actorId: string, relationshipId: string, action: 'create' | 'update' | 'revoke', metadata?: Record<string, any>) {
    return this.log({
      actorId,
      action: `relationship_${action}`,
      targetType: 'relationship',
      targetId: relationshipId,
      metadata,
    });
  }

  // 记录班级操作
  async logClassOperation(actorId: string, classId: string, action: string, metadata?: Record<string, any>) {
    return this.log({
      actorId,
      action: `class_${action}`,
      targetType: 'class',
      targetId: classId,
      metadata,
    });
  }

  // 记录同意书操作
  async logConsentChange(actorId: string, consentId: string, action: 'create' | 'approve' | 'reject' | 'expire', metadata?: Record<string, any>) {
    return this.log({
      actorId,
      action: `consent_${action}`,
      targetType: 'consent',
      targetId: consentId,
      metadata,
    });
  }

  // 获取审计日志
  async getAuditLogs(
    actorId?: string,
    targetType?: string,
    targetId?: string,
    action?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = {};
    
    if (actorId) where.actorId = actorId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (action) where.action = action;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  // 获取用户相关的审计日志
  async getUserAuditLogs(userId: string, limit: number = 50, offset: number = 0) {
    return this.prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: userId },
          { targetId: userId },
        ],
      },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }
}
