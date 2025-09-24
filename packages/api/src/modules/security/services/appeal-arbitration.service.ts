import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export enum AppealStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export enum AppealType {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  EXCESSIVE_DATA_VIEW = 'EXCESSIVE_DATA_VIEW',
  PRIVACY_VIOLATION = 'PRIVACY_VIOLATION',
  PERMISSION_ABUSE = 'PERMISSION_ABUSE',
  OTHER = 'OTHER',
}

export interface AppealSubmission {
  studentId: string;
  targetUserId: string;
  appealType: AppealType;
  description: string;
  evidence?: any;
  requestedAction: string;
}

export interface AppealReview {
  appealId: string;
  reviewerId: string;
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  actions?: string[];
}

@Injectable()
export class AppealArbitrationService {
  constructor(private readonly prisma: PrismaService) {}

  // 学生提交申诉
  async submitAppeal(
    studentId: string,
    submission: AppealSubmission,
  ): Promise<string> {
    // 验证学生身份
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student || student.role.name !== 'student') {
      throw new ForbiddenException('只有学生可以提交申诉');
    }

    // 验证目标用户存在
    const targetUser = await this.prisma.user.findUnique({
      where: { id: submission.targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    // 检查是否已有相同申诉
    const existingAppeal = await this.prisma.appeal.findFirst({
      where: {
        studentId,
        targetUserId: submission.targetUserId,
        status: {
          in: [AppealStatus.PENDING, AppealStatus.UNDER_REVIEW],
        },
      },
    });

    if (existingAppeal) {
      throw new ForbiddenException('已存在相同申诉，请等待处理结果');
    }

    // 创建申诉记录
    const appeal = await this.prisma.appeal.create({
      data: {
        studentId,
        targetUserId: submission.targetUserId,
        appealType: submission.appealType,
        description: submission.description,
        evidence: submission.evidence || {},
        requestedAction: submission.requestedAction,
        status: AppealStatus.PENDING,
        submittedAt: new Date(),
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'submit_appeal',
        targetType: 'appeal',
        targetId: appeal.id,
        metadata: {
          targetUserId: submission.targetUserId,
          appealType: submission.appealType,
          description: submission.description,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return appeal.id;
  }

  // 管理员审核申诉
  async reviewAppeal(
    appealId: string,
    reviewerId: string,
    review: AppealReview,
  ): Promise<void> {
    // 验证管理员身份
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      include: { role: true },
    });

    if (!reviewer || reviewer.role.name !== 'admin') {
      throw new ForbiddenException('只有管理员可以审核申诉');
    }

    // 获取申诉信息
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
      include: {
        student: {
          select: {
            displayName: true,
            email: true,
          },
        },
        targetUser: {
          select: {
            displayName: true,
            email: true,
            role: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!appeal) {
      throw new NotFoundException('申诉不存在');
    }

    if (appeal.status !== AppealStatus.PENDING) {
      throw new ForbiddenException('申诉状态不允许审核');
    }

    // 更新申诉状态
    await this.prisma.appeal.update({
      where: { id: appealId },
      data: {
        status:
          review.decision === 'APPROVED'
            ? AppealStatus.APPROVED
            : AppealStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewReason: review.reason,
        reviewActions: review.actions || [],
      },
    });

    // 如果申诉被批准，执行相应操作
    if (review.decision === 'APPROVED') {
      await this.executeAppealActions(appealId, review.actions || []);
    }

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'review_appeal',
        targetType: 'appeal',
        targetId: appealId,
        metadata: {
          decision: review.decision,
          reason: review.reason,
          actions: review.actions,
          studentId: appeal.studentId,
          targetUserId: appeal.targetUserId,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // 执行申诉处理操作
  private async executeAppealActions(
    appealId: string,
    actions: string[],
  ): Promise<void> {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
    });

    if (!appeal) {
      return;
    }

    for (const action of actions) {
      switch (action) {
        case 'REVOKE_PERMISSIONS':
          await this.revokeAllPermissions(
            appeal.targetUserId,
            appeal.studentId,
          );
          break;
        case 'SUSPEND_ACCOUNT':
          await this.suspendUser(appeal.targetUserId);
          break;
        case 'WARNING_NOTICE':
          await this.sendWarningNotice(appeal.targetUserId);
          break;
        case 'AUDIT_REVIEW':
          await this.triggerAuditReview(appeal.targetUserId);
          break;
        default:
          // 记录未知操作
          await this.prisma.auditLog.create({
            data: {
              actorId: 'system',
              action: 'unknown_appeal_action',
              targetType: 'appeal',
              targetId: appealId,
              metadata: {
                action,
                timestamp: new Date().toISOString(),
              },
            },
          });
      }
    }
  }

  // 撤销所有权限
  private async revokeAllPermissions(
    targetUserId: string,
    studentId: string,
  ): Promise<void> {
    const grants = await this.prisma.accessGrant.findMany({
      where: {
        granteeId: targetUserId,
        studentId,
        status: 'ACTIVE',
      },
    });

    for (const grant of grants) {
      await this.prisma.accessGrant.update({
        where: { id: grant.id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedBy: 'system',
        },
      });
    }

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        actorId: 'system',
        action: 'revoke_all_permissions',
        targetType: 'user',
        targetId: targetUserId,
        metadata: {
          studentId,
          revokedGrants: grants.length,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // 暂停用户账号
  private async suspendUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
      },
    });

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        actorId: 'system',
        action: 'suspend_user',
        targetType: 'user',
        targetId: userId,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // 发送警告通知
  private async sendWarningNotice(userId: string): Promise<void> {
    // 这里可以集成通知服务
    // 暂时记录到审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: 'system',
        action: 'send_warning_notice',
        targetType: 'user',
        targetId: userId,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // 触发审计审查
  private async triggerAuditReview(userId: string): Promise<void> {
    // 标记用户需要审计审查
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        needsAuditReview: true,
        auditReviewRequestedAt: new Date(),
      },
    });

    // 记录操作日志
    await this.prisma.auditLog.create({
      data: {
        actorId: 'system',
        action: 'trigger_audit_review',
        targetType: 'user',
        targetId: userId,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // 获取申诉列表
  async getAppeals(query: {
    status?: AppealStatus;
    appealType?: AppealType;
    studentId?: string;
    targetUserId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    appeals: any[];
    total: number;
  }> {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.appealType) {
      where.appealType = query.appealType;
    }

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.targetUserId) {
      where.targetUserId = query.targetUserId;
    }

    const [appeals, total] = await Promise.all([
      this.prisma.appeal.findMany({
        where,
        include: {
          student: {
            select: {
              displayName: true,
              email: true,
            },
          },
          targetUser: {
            select: {
              displayName: true,
              email: true,
              role: {
                select: { name: true },
              },
            },
          },
          reviewer: {
            select: {
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0,
      }),
      this.prisma.appeal.count({ where }),
    ]);

    return { appeals, total };
  }

  // 获取申诉详情
  async getAppealDetails(appealId: string): Promise<any> {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
      include: {
        student: {
          select: {
            displayName: true,
            email: true,
            role: {
              select: { name: true },
            },
          },
        },
        targetUser: {
          select: {
            displayName: true,
            email: true,
            role: {
              select: { name: true },
            },
          },
        },
        reviewer: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!appeal) {
      throw new NotFoundException('申诉不存在');
    }

    return appeal;
  }

  // 获取申诉统计
  async getAppealStats(): Promise<{
    totalAppeals: number;
    pendingAppeals: number;
    approvedAppeals: number;
    rejectedAppeals: number;
    appealsByType: Record<string, number>;
    appealsByStatus: Record<string, number>;
  }> {
    const [
      totalAppeals,
      pendingAppeals,
      approvedAppeals,
      rejectedAppeals,
      appealsByType,
      appealsByStatus,
    ] = await Promise.all([
      this.prisma.appeal.count(),
      this.prisma.appeal.count({ where: { status: AppealStatus.PENDING } }),
      this.prisma.appeal.count({ where: { status: AppealStatus.APPROVED } }),
      this.prisma.appeal.count({ where: { status: AppealStatus.REJECTED } }),
      this.getAppealsByType(),
      this.getAppealsByStatus(),
    ]);

    return {
      totalAppeals,
      pendingAppeals,
      approvedAppeals,
      rejectedAppeals,
      appealsByType,
      appealsByStatus,
    };
  }

  // 按类型统计申诉
  private async getAppealsByType(): Promise<Record<string, number>> {
    const appeals = await this.prisma.appeal.groupBy({
      by: ['appealType'],
      _count: {
        appealType: true,
      },
    });

    return appeals.reduce(
      (acc, appeal) => {
        acc[appeal.appealType] = appeal._count.appealType;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  // 按状态统计申诉
  private async getAppealsByStatus(): Promise<Record<string, number>> {
    const appeals = await this.prisma.appeal.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return appeals.reduce(
      (acc, appeal) => {
        acc[appeal.status] = appeal._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  // 关闭申诉
  async closeAppeal(
    appealId: string,
    closedBy: string,
    reason?: string,
  ): Promise<void> {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
    });

    if (!appeal) {
      throw new NotFoundException('申诉不存在');
    }

    if (appeal.status === AppealStatus.CLOSED) {
      throw new ForbiddenException('申诉已关闭');
    }

    await this.prisma.appeal.update({
      where: { id: appealId },
      data: {
        status: AppealStatus.CLOSED,
        closedAt: new Date(),
        closedBy,
        closeReason: reason,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: closedBy,
        action: 'close_appeal',
        targetType: 'appeal',
        targetId: appealId,
        metadata: {
          reason,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // 获取用户申诉历史
  async getUserAppealHistory(
    userId: string,
    role: 'student' | 'target',
  ): Promise<any[]> {
    const where =
      role === 'student' ? { studentId: userId } : { targetUserId: userId };

    return this.prisma.appeal.findMany({
      where,
      include: {
        student: {
          select: {
            displayName: true,
            email: true,
          },
        },
        targetUser: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
