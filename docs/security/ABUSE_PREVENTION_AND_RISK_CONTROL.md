# 滥用与风控系统设计文档

## 概述

本文档详细描述了家长/老师查看学生数据功能的滥用预防与风险控制系统，确保平台的安全性和合规性，保护学生隐私和数据安全。

## 核心风控策略

### 1. 搜索限流与防撞库

#### 1.1 限流机制

- **账号限流**: 单个用户每分钟最多10次搜索请求
- **IP限流**: 单个IP每分钟最多100次搜索请求
- **封禁机制**: 连续触发限流5次后封禁15分钟
- **滑动窗口**: 使用Redis实现精确的滑动窗口限流

#### 1.2 防撞库检测

- **搜索模式分析**: 监控用户搜索模式，检测异常搜索行为
- **匿名ID验证**: 验证匿名ID格式，防止无效搜索
- **行为分析**: 分析搜索频率、目标数量、时间分布等指标
- **自动封禁**: 检测到撞库行为时自动封禁账号

#### 1.3 实现细节

```typescript
// 限流配置
const searchRateLimitConfig = {
  windowMs: 60 * 1000,        // 1分钟窗口
  maxRequests: 10,            // 最多10次请求
  blockDurationMs: 15 * 60 * 1000, // 封禁15分钟
};

// 防撞库检测
async detectBruteForce(userId: string, ipAddress: string, searchPattern: string) {
  const patternCount = await this.redis.scard(`search_pattern:${userId}`);
  if (patternCount > 20) {
    await this.blockUser(userId, ipAddress, 'potential_brute_force_attack');
    return true;
  }
  return false;
}
```

### 2. 最小展示原则

#### 2.1 数据脱敏策略

- **默认脱敏**: 搜索结果默认不显示精确个人信息
- **分级脱敏**: 根据用户角色和关系显示不同级别的信息
- **匿名化处理**: 使用匿名ID替代真实身份信息
- **动态脱敏**: 根据权限关系动态调整脱敏程度

#### 2.2 脱敏规则

```typescript
// 脱敏配置
const maskingConfig = {
  showFullName: false,      // 默认不显示真实姓名
  showSchool: false,        // 默认不显示学校信息
  showClassName: false,     // 默认不显示班级信息
  showAvatar: false,        // 默认不显示头像
  showEmail: false,         // 默认不显示邮箱
  showPhone: false,         // 默认不显示手机号
  anonymizeId: true,        // 使用匿名ID
};

// 脱敏函数
private maskName(name: string): string {
  if (name.length <= 2) {
    return name.charAt(0) + '*';
  }
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
}
```

#### 2.3 学生端控制

- **可搜索性设置**: 学生可设置"仅匿名ID可搜"
- **搜索范围控制**: 学生可选择搜索可见范围
- **实时调整**: 学生可随时调整搜索可见性设置

### 3. 细粒度权限控制

#### 3.1 权限范围定义

```typescript
enum PermissionScope {
  PROGRESS = 'progress', // 学习进度
  COMPLETION = 'completion', // 完成情况
  CODE_CONTENT = 'code_content', // 代码内容
  TIME_RECORDS = 'time_records', // 学习时长
  ACHIEVEMENTS = 'achievements', // 成就徽章
  ASSIGNMENTS = 'assignments', // 作业任务
  METRICS = 'metrics', // 统计数据
  WORKS = 'works', // 作品展示
}
```

#### 3.2 默认权限策略

- **家长默认权限**: 学习进度、完成情况、成就徽章、统计数据
- **教师默认权限**: 学习进度、完成情况、作业任务、统计数据、学习时长
- **敏感权限**: 代码内容、作品展示需要明确同意
- **权限验证**: 每次访问都验证权限范围

#### 3.3 权限管理

- **动态调整**: 任何时候都可以缩小权限范围
- **权限继承**: 班级关系自动授予相应权限
- **权限撤销**: 学生可随时撤销任何权限
- **权限审计**: 记录所有权限变更操作

### 4. 自动到期机制

#### 4.1 到期策略

- **家长权限**: 默认90天到期
- **教师权限**: 默认365天到期
- **最大期限**: 最长不超过365天
- **到期提醒**: 到期前7天发送提醒通知

#### 4.2 到期处理

```typescript
// 定时任务处理过期权限
@Cron(CronExpression.EVERY_HOUR)
async handleExpiredPermissions() {
  const expiredGrants = await this.getExpiredPermissions();
  for (const grant of expiredGrants) {
    await this.prisma.accessGrant.update({
      where: { id: grant.id },
      data: {
        status: 'EXPIRED',
        revokedAt: new Date(),
        revokedBy: 'system',
      },
    });
  }
}
```

#### 4.3 续期机制

- **手动续期**: 学生或授权方可以申请续期
- **自动续期**: 可配置自动续期策略
- **续期限制**: 续期不能超过最大期限
- **续期审计**: 记录所有续期操作

### 5. 完整审计日志

#### 5.1 审计范围

- **数据查看**: 记录所有数据查看操作
- **数据导出**: 记录所有数据导出操作
- **权限变更**: 记录所有权限授予、修改、撤销操作
- **安全事件**: 记录所有安全相关事件

#### 5.2 审计字段

```typescript
interface AuditLogEntry {
  actorId: string; // 操作者ID
  action: string; // 操作类型
  targetType: string; // 目标类型
  targetId: string; // 目标ID
  metadata?: any; // 操作元数据
  ipAddress?: string; // IP地址
  userAgent?: string; // 用户代理
  severity?: 'info' | 'warning' | 'error' | 'critical'; // 严重程度
}
```

#### 5.3 敏感操作二次确认

- **数据导出**: 导出操作需要二次确认
- **权限撤销**: 撤销权限需要二次确认
- **账号封禁**: 封禁操作需要管理员确认
- **批量操作**: 批量操作需要特殊权限

### 6. 申诉仲裁系统

#### 6.1 申诉类型

```typescript
enum AppealType {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS', // 未授权访问
  EXCESSIVE_DATA_VIEW = 'EXCESSIVE_DATA_VIEW', // 过度数据查看
  PRIVACY_VIOLATION = 'PRIVACY_VIOLATION', // 隐私侵犯
  PERMISSION_ABUSE = 'PERMISSION_ABUSE', // 权限滥用
  OTHER = 'OTHER', // 其他
}
```

#### 6.2 申诉流程

1. **学生提交申诉**: 学生发现异常行为可提交申诉
2. **管理员审核**: 管理员审核申诉内容
3. **调查取证**: 根据申诉内容进行调查
4. **处理决定**: 做出处理决定并执行
5. **结果通知**: 通知相关方处理结果

#### 6.3 处理措施

- **撤销权限**: 撤销相关权限授权
- **账号暂停**: 暂停违规账号
- **警告通知**: 发送警告通知
- **审计审查**: 触发详细审计审查

## 技术实现

### 1. 限流服务

```typescript
@Injectable()
export class RateLimitService {
  async checkSearchRateLimit(userId: string, ipAddress: string): Promise<RateLimitResult> {
    // 检查用户限流
    const userResult = await this.checkRateLimit(`search_rate_limit:user:${userId}`, config);

    // 检查IP限流
    const ipResult = await this.checkRateLimit(`search_rate_limit:ip:${ipAddress}`, config);

    // 如果任一限流触发，则拒绝请求
    if (!userResult.allowed || !ipResult.allowed) {
      await this.recordSuspiciousActivity(userId, ipAddress, 'search_rate_limit');
      return { allowed: false, reason: '搜索频率过高，请稍后再试' };
    }

    return { allowed: true };
  }
}
```

### 2. 数据脱敏服务

```typescript
@Injectable()
export class DataMaskingService {
  async getMaskingConfig(requesterId: string, targetStudentId: string): Promise<MaskingConfig> {
    // 检查是否有授权关系
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId: targetStudentId,
        partyId: requesterId,
        status: 'ACTIVE',
      },
    });

    if (relationship) {
      // 有授权关系，根据角色显示不同信息
      return this.getAuthorizedMaskingConfig(requesterRole);
    }

    // 默认脱敏配置
    return this.getDefaultMaskingConfig();
  }
}
```

### 3. 权限粒度服务

```typescript
@Injectable()
export class PermissionGranularityService {
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
        scope: { has: requiredScope },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return !!grant;
  }
}
```

### 4. 审计日志服务

```typescript
@Injectable()
export class AuditLoggingService {
  async logDataView(
    viewerId: string,
    targetType: string,
    targetId: string,
    dataType: string,
    scope: string[],
  ): Promise<void> {
    await this.logAuditEvent({
      actorId: viewerId,
      action: 'view_data',
      targetType,
      targetId,
      metadata: { dataType, scope },
      severity: 'info',
    });
  }
}
```

### 5. 申诉仲裁服务

```typescript
@Injectable()
export class AppealArbitrationService {
  async submitAppeal(studentId: string, submission: AppealSubmission): Promise<string> {
    // 验证学生身份
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student || student.role.name !== 'student') {
      throw new ForbiddenException('只有学生可以提交申诉');
    }

    // 创建申诉记录
    const appeal = await this.prisma.appeal.create({
      data: {
        studentId,
        targetUserId: submission.targetUserId,
        appealType: submission.appealType,
        description: submission.description,
        status: AppealStatus.PENDING,
      },
    });

    return appeal.id;
  }
}
```

## 监控与告警

### 1. 实时监控指标

- **搜索频率**: 监控用户搜索频率异常
- **权限使用**: 监控权限使用模式
- **异常行为**: 监控异常访问模式
- **系统性能**: 监控系统性能指标

### 2. 告警机制

- **限流告警**: 触发限流时发送告警
- **异常行为告警**: 检测到异常行为时发送告警
- **安全事件告警**: 发生安全事件时发送告警
- **系统异常告警**: 系统异常时发送告警

### 3. 日志分析

- **行为分析**: 分析用户行为模式
- **异常检测**: 检测异常访问模式
- **趋势分析**: 分析访问趋势变化
- **风险评估**: 评估安全风险等级

## 合规性要求

### 1. 数据保护法规

- **GDPR合规**: 符合欧盟数据保护法规
- **CCPA合规**: 符合加州消费者隐私法案
- **COPPA合规**: 符合儿童在线隐私保护法案
- **本地法规**: 符合当地数据保护法规

### 2. 隐私保护措施

- **数据最小化**: 只收集必要的数据
- **目的限制**: 数据只能用于指定目的
- **存储限制**: 数据存储时间限制
- **访问控制**: 严格的访问控制机制

### 3. 透明度要求

- **隐私政策**: 清晰的隐私政策说明
- **数据使用**: 透明的数据使用说明
- **用户权利**: 明确的用户权利说明
- **投诉机制**: 有效的投诉处理机制

## 应急响应

### 1. 安全事件响应

- **事件检测**: 快速检测安全事件
- **事件评估**: 评估事件严重程度
- **事件处理**: 快速处理安全事件
- **事件恢复**: 恢复正常服务状态

### 2. 数据泄露响应

- **泄露检测**: 检测数据泄露事件
- **影响评估**: 评估泄露影响范围
- **通知机制**: 通知相关方泄露事件
- **补救措施**: 采取补救措施

### 3. 系统故障响应

- **故障检测**: 检测系统故障
- **故障隔离**: 隔离故障影响
- **故障修复**: 快速修复故障
- **服务恢复**: 恢复服务可用性

## 持续改进

### 1. 风险评估

- **定期评估**: 定期进行安全风险评估
- **威胁分析**: 分析新的安全威胁
- **漏洞扫描**: 定期进行漏洞扫描
- **渗透测试**: 定期进行渗透测试

### 2. 策略更新

- **策略审查**: 定期审查安全策略
- **策略更新**: 根据新威胁更新策略
- **培训更新**: 更新安全培训内容
- **流程优化**: 优化安全流程

### 3. 技术升级

- **技术评估**: 评估新技术应用
- **系统升级**: 升级安全系统
- **工具更新**: 更新安全工具
- **架构优化**: 优化安全架构

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 安全团队
