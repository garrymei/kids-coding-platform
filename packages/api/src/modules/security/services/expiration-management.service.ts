import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ExpirationConfig {
  defaultParentExpirationDays: number;
  defaultTeacherExpirationDays: number;
  maxExpirationDays: number;
  warningDaysBeforeExpiration: number;
  autoRenewalEnabled: boolean;
}

@Injectable()
export class ExpirationManagementService {
  private readonly logger = new Logger(ExpirationManagementService.name);

  private readonly expirationConfig: ExpirationConfig = {
    defaultParentExpirationDays: 90, // 家长默认90天
    defaultTeacherExpirationDays: 365, // 教师默认365天
    maxExpirationDays: 365, // 最大365天
    warningDaysBeforeExpiration: 7, // 到期前7天警告
    autoRenewalEnabled: false, // 默认不自动续期
  };

  constructor(private readonly prisma: PrismaService) {}

  // 计算默认到期时间
  calculateDefaultExpiration(
    role: 'parent' | 'teacher',
    customDays?: number,
  ): Date {
    const days =
      customDays ||
      (role === 'parent'
        ? this.expirationConfig.defaultParentExpirationDays
        : this.expirationConfig.defaultTeacherExpirationDays);

    // 限制最大到期时间
    const maxDays = Math.min(days, this.expirationConfig.maxExpirationDays);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + maxDays);

    return expirationDate;
  }

  // 验证到期时间
  validateExpirationDate(
    expirationDate: Date,
    role: 'parent' | 'teacher',
  ): { valid: boolean; error?: string } {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(
      maxDate.getDate() + this.expirationConfig.maxExpirationDays,
    );

    if (expirationDate <= now) {
      return {
        valid: false,
        error: '到期时间不能早于当前时间',
      };
    }

    if (expirationDate > maxDate) {
      return {
        valid: false,
        error: `到期时间不能超过${this.expirationConfig.maxExpirationDays}天`,
      };
    }

    return { valid: true };
  }

  // 设置权限到期时间
  async setPermissionExpiration(
    grantId: string,
    expirationDate: Date,
    setBy: string,
    reason?: string,
  ): Promise<void> {
    const grant = await this.prisma.accessGrant.findUnique({
      where: { id: grantId },
      include: {
        grantee: {
          include: { role: true },
        },
      },
    });

    if (!grant) {
      throw new Error('权限授权不存在');
    }

    const role = grant.grantee.role.name as 'parent' | 'teacher';
    const validation = this.validateExpirationDate(expirationDate, role);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 更新到期时间
    await this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        expiresAt: expirationDate,
        updatedAt: new Date(),
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: setBy,
        action: 'set_permission_expiration',
        targetType: 'access_grant',
        targetId: grantId,
        metadata: {
          studentId: grant.studentId,
          granteeId: grant.granteeId,
          expirationDate: expirationDate.toISOString(),
          reason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    this.logger.log(
      `权限授权 ${grantId} 到期时间已设置为 ${expirationDate.toISOString()}`,
    );
  }

  // 续期权限
  async renewPermission(
    grantId: string,
    renewalDays: number,
    renewedBy: string,
    reason?: string,
  ): Promise<void> {
    const grant = await this.prisma.accessGrant.findUnique({
      where: { id: grantId },
      include: {
        grantee: {
          include: { role: true },
        },
      },
    });

    if (!grant) {
      throw new Error('权限授权不存在');
    }

    if (grant.status !== 'ACTIVE') {
      throw new Error('只能续期活跃的权限授权');
    }

    const role = grant.grantee.role.name as 'parent' | 'teacher';
    const currentExpiration = grant.expiresAt || new Date();
    const newExpiration = new Date(currentExpiration);
    newExpiration.setDate(newExpiration.getDate() + renewalDays);

    const validation = this.validateExpirationDate(newExpiration, role);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 更新到期时间
    await this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        expiresAt: newExpiration,
        updatedAt: new Date(),
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: renewedBy,
        action: 'renew_permission',
        targetType: 'access_grant',
        targetId: grantId,
        metadata: {
          studentId: grant.studentId,
          granteeId: grant.granteeId,
          oldExpirationDate: currentExpiration.toISOString(),
          newExpirationDate: newExpiration.toISOString(),
          renewalDays,
          reason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    this.logger.log(
      `权限授权 ${grantId} 已续期 ${renewalDays} 天，新到期时间: ${newExpiration.toISOString()}`,
    );
  }

  // 获取即将到期的权限
  async getExpiringPermissions(days: number = 7): Promise<any[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    const expiringGrants = await this.prisma.accessGrant.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lte: expirationDate,
          gte: new Date(),
        },
      },
      include: {
        student: {
          select: {
            displayName: true,
            email: true,
          },
        },
        grantee: {
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

    return expiringGrants;
  }

  // 获取已过期的权限
  async getExpiredPermissions(): Promise<any[]> {
    const expiredGrants = await this.prisma.accessGrant.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date(),
        },
      },
      include: {
        student: {
          select: {
            displayName: true,
            email: true,
          },
        },
        grantee: {
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

    return expiredGrants;
  }

  // 定时任务：处理过期的权限
  // @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredPermissions(): Promise<void> {
    this.logger.log('开始处理过期的权限授权...');

    const expiredGrants = await this.getExpiredPermissions();

    for (const grant of expiredGrants) {
      try {
        // 更新权限状态为过期
        await this.prisma.accessGrant.update({
          where: { id: grant.id },
          data: {
            status: 'EXPIRED',
            revokedAt: new Date(),
            revokedBy: 'system',
          },
        });

        // 记录审计日志
        await this.prisma.auditLog.create({
          data: {
            actorId: 'system',
            action: 'permission_expired_auto',
            targetType: 'access_grant',
            targetId: grant.id,
            metadata: {
              studentId: grant.studentId,
              granteeId: grant.granteeId,
              scopes: grant.scope,
              expiredAt: grant.expiresAt?.toISOString(),
              timestamp: new Date().toISOString(),
            },
          },
        });

        this.logger.log(`权限授权 ${grant.id} 已自动过期`);
      } catch (error) {
        this.logger.error(`处理过期权限授权 ${grant.id} 时出错:`, error);
      }
    }

    this.logger.log(`处理完成，共处理 ${expiredGrants.length} 个过期权限授权`);
  }

  // 定时任务：发送到期提醒
  // @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendExpirationWarnings(): Promise<void> {
    this.logger.log('开始发送权限到期提醒...');

    const expiringGrants = await this.getExpiringPermissions(
      this.expirationConfig.warningDaysBeforeExpiration,
    );

    for (const grant of expiringGrants) {
      try {
        // 这里可以集成邮件或推送通知服务
        // 暂时记录到审计日志
        await this.prisma.auditLog.create({
          data: {
            actorId: 'system',
            action: 'expiration_warning_sent',
            targetType: 'access_grant',
            targetId: grant.id,
            metadata: {
              studentId: grant.studentId,
              granteeId: grant.granteeId,
              expirationDate: grant.expiresAt?.toISOString(),
              warningDays: this.expirationConfig.warningDaysBeforeExpiration,
              timestamp: new Date().toISOString(),
            },
          },
        });

        this.logger.log(`已发送权限到期提醒: ${grant.id}`);
      } catch (error) {
        this.logger.error(`发送到期提醒 ${grant.id} 时出错:`, error);
      }
    }

    this.logger.log(`到期提醒发送完成，共发送 ${expiringGrants.length} 个提醒`);
  }

  // 获取权限到期统计
  async getExpirationStats(): Promise<{
    totalActive: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
    expired: number;
    neverExpire: number;
  }> {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [
      totalActive,
      expiringIn7Days,
      expiringIn30Days,
      expired,
      neverExpire,
    ] = await Promise.all([
      this.prisma.accessGrant.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.accessGrant.count({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: in7Days,
            gte: now,
          },
        },
      }),
      this.prisma.accessGrant.count({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: in30Days,
            gte: now,
          },
        },
      }),
      this.prisma.accessGrant.count({
        where: {
          status: 'EXPIRED',
        },
      }),
      this.prisma.accessGrant.count({
        where: {
          status: 'ACTIVE',
          expiresAt: null,
        },
      }),
    ]);

    return {
      totalActive,
      expiringIn7Days,
      expiringIn30Days,
      expired,
      neverExpire,
    };
  }

  // 批量续期权限
  async batchRenewPermissions(
    grantIds: string[],
    renewalDays: number,
    renewedBy: string,
    reason?: string,
  ): Promise<void> {
    for (const grantId of grantIds) {
      try {
        await this.renewPermission(grantId, renewalDays, renewedBy, reason);
      } catch (error) {
        this.logger.error(`批量续期权限 ${grantId} 时出错:`, error);
      }
    }
  }

  // 获取权限到期历史
  async getExpirationHistory(grantId: string): Promise<any[]> {
    const history = await this.prisma.auditLog.findMany({
      where: {
        targetType: 'access_grant',
        targetId: grantId,
        action: {
          in: [
            'set_permission_expiration',
            'renew_permission',
            'permission_expired',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }

  // 更新到期配置
  updateExpirationConfig(config: Partial<ExpirationConfig>): void {
    Object.assign(this.expirationConfig, config);
    this.logger.log('权限到期配置已更新:', this.expirationConfig);
  }

  // 获取当前配置
  getExpirationConfig(): ExpirationConfig {
    return { ...this.expirationConfig };
  }
}
