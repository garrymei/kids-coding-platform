import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export enum PermissionScope {
  PROGRESS = 'progress', // 学习进度
  COMPLETION = 'completion', // 完成情况
  CODE_CONTENT = 'code_content', // 代码内容
  TIME_RECORDS = 'time_records', // 学习时长
  ACHIEVEMENTS = 'achievements', // 成就徽章
  ASSIGNMENTS = 'assignments', // 作业任务
  METRICS = 'metrics', // 统计数据
  WORKS = 'works', // 作品展示
}

export interface ScopeDefinition {
  name: string;
  description: string;
  sensitive: boolean;
  defaultForParent: boolean;
  defaultForTeacher: boolean;
  requiresExplicitConsent: boolean;
}

export interface PermissionConfig {
  scopes: PermissionScope[];
  expiresAt: Date | null;
  grantedAt: Date;
  grantedBy: string;
  reason?: string;
}

@Injectable()
export class PermissionGranularityService {
  private readonly scopeDefinitions: Record<PermissionScope, ScopeDefinition> =
    {
      [PermissionScope.PROGRESS]: {
        name: '学习进度',
        description: '查看学习进度、完成章节、当前学习状态',
        sensitive: false,
        defaultForParent: true,
        defaultForTeacher: true,
        requiresExplicitConsent: false,
      },
      [PermissionScope.COMPLETION]: {
        name: '完成情况',
        description: '查看任务完成数、准确率、学习成果',
        sensitive: false,
        defaultForParent: true,
        defaultForTeacher: true,
        requiresExplicitConsent: false,
      },
      [PermissionScope.CODE_CONTENT]: {
        name: '代码内容',
        description: '查看学生编写的具体代码实现',
        sensitive: true,
        defaultForParent: false,
        defaultForTeacher: false,
        requiresExplicitConsent: true,
      },
      [PermissionScope.TIME_RECORDS]: {
        name: '学习时长',
        description: '查看详细的学习时间记录',
        sensitive: true,
        defaultForParent: false,
        defaultForTeacher: true,
        requiresExplicitConsent: true,
      },
      [PermissionScope.ACHIEVEMENTS]: {
        name: '成就徽章',
        description: '查看获得的成就、徽章、奖励',
        sensitive: false,
        defaultForParent: true,
        defaultForTeacher: true,
        requiresExplicitConsent: false,
      },
      [PermissionScope.ASSIGNMENTS]: {
        name: '作业任务',
        description: '查看作业完成情况、任务分配',
        sensitive: false,
        defaultForParent: false,
        defaultForTeacher: true,
        requiresExplicitConsent: false,
      },
      [PermissionScope.METRICS]: {
        name: '统计数据',
        description: '查看学习统计数据、趋势分析',
        sensitive: false,
        defaultForParent: true,
        defaultForTeacher: true,
        requiresExplicitConsent: false,
      },
      [PermissionScope.WORKS]: {
        name: '作品展示',
        description: '查看学生创作的作品、项目展示',
        sensitive: true,
        defaultForParent: false,
        defaultForTeacher: true,
        requiresExplicitConsent: true,
      },
    };

  constructor(private readonly prisma: PrismaService) {}

  // 获取权限范围定义
  getScopeDefinitions(): Record<PermissionScope, ScopeDefinition> {
    return this.scopeDefinitions;
  }

  // 获取默认权限范围
  getDefaultScopes(role: 'parent' | 'teacher'): PermissionScope[] {
    const scopes: PermissionScope[] = [];

    Object.entries(this.scopeDefinitions).forEach(([scope, definition]) => {
      if (role === 'parent' && definition.defaultForParent) {
        scopes.push(scope as PermissionScope);
      } else if (role === 'teacher' && definition.defaultForTeacher) {
        scopes.push(scope as PermissionScope);
      }
    });

    return scopes;
  }

  // 验证权限范围
  validateScopes(
    requestedScopes: PermissionScope[],
    requesterRole: 'parent' | 'teacher',
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const scope of requestedScopes) {
      const definition = this.scopeDefinitions[scope];

      if (!definition) {
        errors.push(`未知的权限范围: ${scope}`);
        continue;
      }

      // 检查是否需要明确同意
      if (definition.requiresExplicitConsent) {
        if (requesterRole === 'parent' && !definition.defaultForParent) {
          errors.push(`家长需要学生明确同意才能访问: ${definition.name}`);
        }
      }

      // 检查敏感权限
      if (definition.sensitive && requesterRole === 'parent') {
        errors.push(`家长访问敏感权限需要特殊授权: ${definition.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // 创建权限授权
  async createPermissionGrant(
    studentId: string,
    granteeId: string,
    config: PermissionConfig,
  ): Promise<string> {
    // 验证权限范围
    const grantee = await this.prisma.user.findUnique({
      where: { id: granteeId },
    });

    if (!grantee) {
      throw new ForbiddenException('授权对象不存在');
    }

    const role = grantee.role as 'parent' | 'teacher';
    const validation = this.validateScopes(config.scopes, role);

    if (!validation.valid) {
      throw new ForbiddenException(
        `权限验证失败: ${validation.errors.join(', ')}`,
      );
    }

    // 创建权限授权记录
    const grant = await this.prisma.accessGrant.create({
      data: {
        studentId,
        granteeId,
        scope: config.scopes.join(','),
        expiresAt: config.expiresAt,
        status: 'ACTIVE',
        grantedAt: config.grantedAt,
        grantedBy: config.grantedBy,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: config.grantedBy,
        action: 'create_permission_grant',
        targetType: 'access_grant',
        targetId: grant.id,
        metadata: {
          studentId,
          granteeId,
          scopes: config.scopes,
          expiresAt: config.expiresAt?.toISOString(),
          reason: config.reason,
        },
        ts: new Date(),
      },
    });

    return grant.id;
  }

  // 检查权限
  async checkPermission(
    studentId: string,
    granteeId: string,
    requiredScope: PermissionScope,
  ): Promise<boolean> {
    const grant = await this.prisma.accessGrant.findFirst({
      where: {
        studentId,
        granteeId,
        status: 'ACTIVE',
        scope: {
          contains: requiredScope,
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return !!grant;
  }

  // 获取用户权限
  async getUserPermissions(
    studentId: string,
    granteeId: string,
  ): Promise<PermissionScope[]> {
    const grants = await this.prisma.accessGrant.findMany({
      where: {
        studentId,
        granteeId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        scope: true,
      },
    });

    // 合并所有权限范围
    const allScopes = new Set<PermissionScope>();
    grants.forEach((grant) => {
      const scopes = Array.isArray(grant.scope)
        ? grant.scope
        : String(grant.scope).split(',').filter(Boolean);
      scopes.forEach((scope) => allScopes.add(scope as PermissionScope));
    });

    return Array.from(allScopes);
  }

  // 修改权限范围
  async modifyPermissionScope(
    grantId: string,
    newScopes: PermissionScope[],
    modifiedBy: string,
    reason?: string,
  ): Promise<void> {
    const grant = await this.prisma.accessGrant.findUnique({
      where: { id: grantId },
      include: {
        grantee: {},
      },
    });

    if (!grant) {
      throw new ForbiddenException('权限授权不存在');
    }

    // 验证新的权限范围
    const role = grant.grantee.role as 'parent' | 'teacher';
    const validation = this.validateScopes(newScopes, role);

    if (!validation.valid) {
      throw new ForbiddenException(
        `权限验证失败: ${validation.errors.join(', ')}`,
      );
    }

    // 更新权限范围
    await this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        scope: newScopes.join(','),
        updatedAt: new Date(),
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: modifiedBy,
        action: 'modify_permission_scope',
        targetType: 'access_grant',
        targetId: grantId,
        metadata: {
          oldScopes: grant.scope,
          newScopes,
          reason,
          timestamp: new Date().toISOString(),
        },
        ts: new Date(),
      },
    });
  }

  // 撤销权限
  async revokePermission(
    grantId: string,
    revokedBy: string,
    reason?: string,
  ): Promise<void> {
    const grant = await this.prisma.accessGrant.findUnique({
      where: { id: grantId },
    });

    if (!grant) {
      throw new ForbiddenException('权限授权不存在');
    }

    // 更新权限状态
    await this.prisma.accessGrant.update({
      where: { id: grantId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: revokedBy,
        action: 'revoke_permission',
        targetType: 'access_grant',
        targetId: grantId,
        metadata: {
          studentId: grant.studentId,
          granteeId: grant.granteeId,
          scopes: grant.scope,
          reason,
          timestamp: new Date().toISOString(),
        },
        ts: new Date(),
      },
    });
  }

  // 检查权限是否过期
  async checkExpiredPermissions(): Promise<void> {
    const expiredGrants = await this.prisma.accessGrant.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    for (const grant of expiredGrants) {
      await this.prisma.accessGrant.update({
        where: { id: grant.id },
        data: {
          status: 'EXPIRED',
          revokedAt: new Date(),
          revokedBy: 'system',
        },
      });

      // 记录过期日志
      await this.prisma.auditLog.create({
        data: {
          actorId: 'system',
          action: 'permission_expired',
          targetType: 'access_grant',
          targetId: grant.id,
          metadata: {
            studentId: grant.studentId,
            granteeId: grant.granteeId,
            scopes: grant.scope,
            expiredAt: grant.expiresAt?.toISOString(),
          },
          ts: new Date(),
        },
      });
    }
  }

  // 获取权限统计
  async getPermissionStats(studentId: string): Promise<{
    totalGrants: number;
    activeGrants: number;
    expiredGrants: number;
    revokedGrants: number;
    scopeDistribution: Record<string, number>;
  }> {
    const grants = await this.prisma.accessGrant.findMany({
      where: { studentId },
    });

    const stats = {
      totalGrants: grants.length,
      activeGrants: grants.filter((g) => g.status === 'ACTIVE').length,
      expiredGrants: grants.filter((g) => g.status === 'EXPIRED').length,
      revokedGrants: grants.filter((g) => g.status === 'REVOKED').length,
      scopeDistribution: {} as Record<string, number>,
    };

    // 统计权限范围分布
    grants.forEach((grant) => {
      const scopes = Array.isArray(grant.scope)
        ? grant.scope
        : String(grant.scope).split(',').filter(Boolean);
      scopes.forEach((scope) => {
        stats.scopeDistribution[scope] =
          (stats.scopeDistribution[scope] || 0) + 1;
      });
    });

    return stats;
  }

  // 批量撤销权限
  async batchRevokePermissions(
    grantIds: string[],
    revokedBy: string,
    reason?: string,
  ): Promise<void> {
    for (const grantId of grantIds) {
      await this.revokePermission(grantId, revokedBy, reason);
    }
  }

  // 获取权限历史
  async getPermissionHistory(
    studentId: string,
    granteeId?: string,
  ): Promise<
    Array<{
      id: string;
      studentId: string;
      granteeId: string;
      scopes: string[];
      status: string;
      grantedAt: Date;
      expiresAt: Date | null;
      revokedAt: Date | null;
      grantedBy: string;
      revokedBy: string | null;
      reason: string | null;
    }>
  > {
    const where: { studentId: string; granteeId?: string } = { studentId };
    if (granteeId) {
      where.granteeId = granteeId;
    }

    const grants = await this.prisma.accessGrant.findMany({
      where,
      orderBy: { grantedAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, email: true } },
        grantee: { select: { id: true, name: true, email: true } },
      },
    });

    return grants.map((grant) => ({
      id: grant.id,
      studentId: grant.studentId,
      granteeId: grant.granteeId,
      scopes: JSON.parse(grant.scope),
      status: grant.status,
      grantedAt: grant.grantedAt,
      expiresAt: grant.expiresAt,
      revokedAt: grant.revokedAt,
      grantedBy: grant.grantedBy || 'system',
      revokedBy: grant.revokedBy,
      reason: null, // Add reason field if needed in schema
    }));
  }
}
