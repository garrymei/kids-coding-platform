# 审计日志与导出需求文档

## 概述

本文档定义了儿童编程平台的审计日志系统需求，包括审计字段定义、导出功能、合规要求和技术实现。

## 审计字段定义

### 核心审计字段

```typescript
interface AuditLog {
  // 基础标识
  id: string;                    // 审计日志唯一标识
  actorId: string;              // 操作者用户ID
  action: string;               // 操作类型
  targetType: string;           // 目标资源类型
  targetId: string;             // 目标资源ID
  
  // 时间信息
  timestamp: Date;              // 操作时间戳
  duration?: number;            // 操作耗时（毫秒）
  
  // 上下文信息
  ipAddress?: string;           // 操作者IP地址
  userAgent?: string;           // 用户代理字符串
  sessionId?: string;           // 会话ID
  
  // 操作详情
  metadata: {
    // 数据访问相关
    dataType?: string;          // 访问的数据类型
    scope?: string[];           // 访问权限范围
    resourcePath?: string;      // 资源路径
    
    // 授权相关
    authorizationType?: string; // 授权类型
    authorizationId?: string;   // 授权记录ID
    expiresAt?: Date;           // 授权过期时间
    
    // 结果相关
    success: boolean;           // 操作是否成功
    errorCode?: string;         // 错误代码
    errorMessage?: string;      // 错误信息
    
    // 数据变更相关
    changes?: Record<string, any>; // 数据变更详情
    previousValue?: any;        // 变更前值
    newValue?: any;             // 变更后值
    
    // 业务相关
    businessContext?: {
      classId?: string;         // 班级ID
      courseId?: string;        // 课程ID
      assignmentId?: string;    // 作业ID
      workId?: string;          // 作品ID
    };
  };
}
```

### 操作类型定义

#### 数据访问操作
```typescript
const DATA_ACCESS_ACTIONS = {
  // 学生数据访问
  VIEW_STUDENT_PROGRESS: 'view_student_progress',
  VIEW_STUDENT_WORKS: 'view_student_works',
  VIEW_STUDENT_BADGES: 'view_student_badges',
  VIEW_STUDENT_COURSES: 'view_student_courses',
  
  // 数据导出
  EXPORT_STUDENT_DATA: 'export_student_data',
  EXPORT_CLASS_DATA: 'export_class_data',
  EXPORT_AUDIT_LOGS: 'export_audit_logs',
  
  // 数据修改
  UPDATE_STUDENT_PROGRESS: 'update_student_progress',
  UPDATE_STUDENT_WORKS: 'update_student_works',
} as const;
```

#### 授权管理操作
```typescript
const AUTHORIZATION_ACTIONS = {
  // 授权创建
  CREATE_ACCESS_GRANT: 'create_access_grant',
  CREATE_RELATIONSHIP: 'create_relationship',
  CREATE_CONSENT: 'create_consent',
  
  // 授权修改
  UPDATE_ACCESS_GRANT: 'update_access_grant',
  UPDATE_RELATIONSHIP: 'update_relationship',
  UPDATE_CONSENT: 'update_consent',
  
  // 授权撤销
  REVOKE_ACCESS_GRANT: 'revoke_access_grant',
  REVOKE_RELATIONSHIP: 'revoke_relationship',
  REVOKE_CONSENT: 'revoke_consent',
  
  // 授权过期
  EXPIRE_ACCESS_GRANT: 'expire_access_grant',
  EXPIRE_CONSENT: 'expire_consent',
} as const;
```

#### 系统管理操作
```typescript
const SYSTEM_ACTIONS = {
  // 用户管理
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTRATION: 'user_registration',
  USER_ROLE_CHANGE: 'user_role_change',
  
  // 班级管理
  CLASS_CREATE: 'class_create',
  CLASS_UPDATE: 'class_update',
  CLASS_DELETE: 'class_delete',
  CLASS_ENROLLMENT: 'class_enrollment',
  
  // 系统配置
  CONFIG_UPDATE: 'config_update',
  PERMISSION_UPDATE: 'permission_update',
} as const;
```

## 审计日志记录规范

### 记录时机

1. **数据访问时**
   - 每次查看学生数据
   - 每次导出数据
   - 每次修改数据

2. **授权变更时**
   - 创建、修改、撤销授权
   - 授权过期
   - 关系建立或解除

3. **系统操作时**
   - 用户登录/登出
   - 角色变更
   - 系统配置修改

### 记录内容要求

1. **完整性**
   - 记录所有必要的上下文信息
   - 包含操作前后的状态
   - 记录操作结果和错误信息

2. **准确性**
   - 时间戳精确到毫秒
   - 用户身份准确识别
   - 操作类型明确分类

3. **可追溯性**
   - 支持按用户、时间、操作类型查询
   - 支持关联查询和统计分析
   - 支持数据导出和报告生成

## 导出功能需求

### 导出格式

1. **CSV格式**
   - 支持Excel打开
   - 包含所有审计字段
   - 支持中文编码

2. **JSON格式**
   - 结构化数据
   - 包含完整元数据
   - 支持程序处理

3. **PDF格式**
   - 格式化报告
   - 包含图表和统计
   - 适合打印和存档

### 导出范围

1. **按时间范围**
   - 指定日期范围
   - 支持相对时间（如最近30天）
   - 支持自定义时间点

2. **按用户范围**
   - 指定用户ID
   - 按角色筛选
   - 按班级筛选

3. **按操作类型**
   - 指定操作类型
   - 按敏感度筛选
   - 按结果筛选

### 导出权限

1. **管理员权限**
   - 导出所有审计日志
   - 导出系统级操作
   - 导出用户行为分析

2. **教师权限**
   - 导出班级相关日志
   - 导出学生数据访问记录
   - 导出教学相关操作

3. **家长权限**
   - 导出自己孩子的数据访问记录
   - 导出授权变更历史
   - 导出隐私相关操作

## 合规要求

### 数据保护法规

1. **GDPR要求**
   - 数据主体有权访问其个人数据的处理记录
   - 数据控制者必须记录数据处理活动
   - 审计日志必须包含数据处理的法律依据

2. **COPPA要求**
   - 记录儿童数据的收集和使用
   - 记录家长同意的获取过程
   - 记录数据删除和匿名化操作

3. **中国个人信息保护法**
   - 记录个人信息的处理活动
   - 记录同意的获取和撤销
   - 记录数据跨境传输情况

### 技术合规措施

1. **数据完整性**
   - 使用数字签名防止篡改
   - 定期备份审计日志
   - 实施访问控制

2. **数据保留**
   - 审计日志保留至少2年
   - 敏感操作日志保留5年
   - 支持长期归档

3. **数据安全**
   - 加密存储敏感信息
   - 限制访问权限
   - 监控异常访问

## 技术实现

### 数据库设计

```sql
-- 审计日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    metadata JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);
```

### API接口设计

```typescript
// 审计日志查询接口
interface AuditLogQuery {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// 导出接口
interface ExportRequest {
  format: 'csv' | 'json' | 'pdf';
  query: AuditLogQuery;
  includeMetadata?: boolean;
  groupBy?: string[];
}

// 审计服务接口
interface AuditService {
  // 记录审计日志
  log(data: AuditLogData): Promise<void>;
  
  // 查询审计日志
  query(query: AuditLogQuery): Promise<AuditLog[]>;
  
  // 导出审计日志
  export(request: ExportRequest): Promise<Buffer>;
  
  // 获取统计信息
  getStatistics(query: AuditLogQuery): Promise<AuditStatistics>;
}
```

### 性能优化

1. **索引优化**
   - 创建复合索引
   - 使用部分索引
   - 定期维护索引

2. **分区策略**
   - 按时间分区
   - 按操作类型分区
   - 按用户角色分区

3. **缓存策略**
   - 缓存常用查询结果
   - 缓存统计信息
   - 使用Redis缓存

## 监控与告警

### 监控指标

1. **性能指标**
   - 审计日志写入延迟
   - 查询响应时间
   - 导出处理时间

2. **业务指标**
   - 审计日志数量
   - 异常操作频率
   - 数据访问模式

3. **安全指标**
   - 未授权访问尝试
   - 异常操作模式
   - 数据泄露风险

### 告警规则

1. **性能告警**
   - 写入延迟超过1秒
   - 查询超时
   - 导出失败

2. **安全告警**
   - 大量未授权访问
   - 异常操作模式
   - 数据泄露风险

3. **业务告警**
   - 审计日志缺失
   - 数据不一致
   - 合规风险

## 报告与分析

### 标准报告

1. **数据访问报告**
   - 按用户统计访问次数
   - 按数据类型统计访问量
   - 按时间统计访问趋势

2. **授权管理报告**
   - 授权创建和撤销统计
   - 授权过期情况
   - 权限使用分析

3. **系统操作报告**
   - 用户登录统计
   - 系统配置变更
   - 错误操作统计

### 自定义分析

1. **用户行为分析**
   - 用户操作模式
   - 异常行为检测
   - 风险用户识别

2. **数据使用分析**
   - 数据访问热点
   - 权限使用效率
   - 数据泄露风险

3. **合规性分析**
   - 法规遵循情况
   - 隐私保护效果
   - 审计覆盖度

## 维护与更新

### 日常维护

1. **数据清理**
   - 清理过期日志
   - 压缩历史数据
   - 归档长期数据

2. **性能优化**
   - 分析慢查询
   - 优化索引
   - 调整配置

3. **监控检查**
   - 检查系统状态
   - 验证数据完整性
   - 测试导出功能

### 定期更新

1. **功能更新**
   - 新增审计字段
   - 优化查询性能
   - 增强导出功能

2. **合规更新**
   - 更新法规要求
   - 调整保留策略
   - 加强安全措施

3. **技术升级**
   - 升级数据库版本
   - 优化存储结构
   - 提升处理能力

---

**文档版本**: v1.0  
**最后更新**: 2024-01-02  
**维护人员**: 安全团队
