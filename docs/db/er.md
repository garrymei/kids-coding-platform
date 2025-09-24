# 数据库ER图与表说明

## 概述

本文档描述了儿童编程平台家长/老师查看学生数据功能的数据库设计，包括实体关系图（ER图）和详细的表结构说明。

## 核心实体关系图

```mermaid
erDiagram
    User ||--o{ Relationship : "student"
    User ||--o{ Relationship : "party"
    User ||--o{ AccessGrant : "grantee"
    User ||--o{ AccessGrant : "student"
    User ||--o{ Consent : "student"
    User ||--o{ Consent : "requester"
    User ||--o{ AuditLog : "actor"
    User ||--o{ MetricsSnapshot : "student"
    User ||--o{ Class : "owner"
    User ||--o{ ClassEnrollment : "student"
    User ||--o{ Appeal : "student"
    User ||--o{ Appeal : "target"
    User ||--o{ Appeal : "reviewer"

    Class ||--o{ ClassEnrollment : "class"
    Relationship ||--o{ AccessGrant : "relationship"
    Consent ||--o{ Relationship : "consent"

    User {
        string id PK
        string email UK
        string displayName
        string nickname
        string school
        string className
        boolean discoverable
        string anonymousId
        string passwordHash
        int roleId FK
        string status
        datetime suspendedAt
        boolean needsAuditReview
        datetime auditReviewRequestedAt
        datetime createdAt
        datetime updatedAt
    }

    Role {
        int id PK
        string name UK
        datetime createdAt
        datetime updatedAt
    }

    Class {
        string id PK
        string name
        string code UK
        string ownerTeacherId FK
        string status
        datetime createdAt
        datetime updatedAt
    }

    ClassEnrollment {
        string id PK
        string classId FK
        string studentId FK
        string status
        datetime createdAt
        datetime updatedAt
    }

    Relationship {
        string id PK
        string studentId FK
        string partyId FK
        string partyRole
        string source
        string status
        datetime createdAt
        datetime revokedAt
    }

    AccessGrant {
        string id PK
        string granteeId FK
        string studentId FK
        string[] scope
        string relationshipId FK
        datetime expiresAt
        string status
        datetime grantedAt
        string grantedBy
        datetime revokedAt
        string revokedBy
        string reason
    }

    Consent {
        string id PK
        string studentId FK
        string requesterId FK
        string purpose
        string[] scope
        string status
        string reason
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    AuditLog {
        string id PK
        string actorId FK
        string action
        string targetType
        string targetId
        json metadata
        string ipAddress
        string userAgent
        string severity
        datetime createdAt
        datetime updatedAt
    }

    MetricsSnapshot {
        string id PK
        string studentId FK
        date date
        string chapterId
        int tasksDone
        float accuracy
        int timeSpentMin
        int streakDays
        int xpGained
        datetime createdAt
    }

    Appeal {
        string id PK
        string studentId FK
        string targetUserId FK
        string appealType
        string description
        json evidence
        string requestedAction
        string status
        datetime submittedAt
        datetime reviewedAt
        string reviewedBy FK
        string reviewReason
        string[] reviewActions
        datetime closedAt
        string closedBy
        string closeReason
        datetime createdAt
        datetime updatedAt
    }
```

## 表结构详细说明

### 1. User 表（用户表）

**用途**: 存储所有用户信息，包括学生、家长、教师、管理员

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 用户唯一标识 |
| `email` | string | UK, NOT NULL | 邮箱地址 |
| `displayName` | string | NULL | 显示名称 |
| `nickname` | string | NULL | 搜索昵称 |
| `school` | string | NULL | 学校名称 |
| `className` | string | NULL | 班级名称 |
| `discoverable` | boolean | DEFAULT false | 是否可被搜索 |
| `passwordHash` | string | NULL | 密码哈希 |
| `roleId` | int | FK, NOT NULL | 角色ID |
| `status` | string | DEFAULT 'ACTIVE' | 用户状态 |
| `suspendedAt` | datetime | NULL | 暂停时间 |
| `needsAuditReview` | boolean | DEFAULT false | 是否需要审计审查 |
| `auditReviewRequestedAt` | datetime | NULL | 审计审查请求时间 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |
| `updatedAt` | datetime | DEFAULT now() | 更新时间 |

**索引**:

- `idx_user_email`: `email`
- `idx_user_role`: `roleId`
- `idx_user_discoverable`: `discoverable`
- `idx_user_school`: `school`

### 2. Role 表（角色表）

**用途**: 定义用户角色

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | int | PK, AUTO_INCREMENT | 角色ID |
| `name` | string | UK, NOT NULL | 角色名称 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |
| `updatedAt` | datetime | DEFAULT now() | 更新时间 |

**枚举值**:

- `student`: 学生
- `parent`: 家长
- `teacher`: 教师
- `admin`: 管理员

### 3. Class 表（班级表）

**用途**: 存储班级信息

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 班级唯一标识 |
| `name` | string | NOT NULL | 班级名称 |
| `code` | string | UK, NOT NULL | 班级邀请码 |
| `ownerTeacherId` | string | FK, NOT NULL | 班主任教师ID |
| `status` | string | DEFAULT 'ACTIVE' | 班级状态 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |
| `updatedAt` | datetime | DEFAULT now() | 更新时间 |

**索引**:

- `idx_class_code`: `code`
- `idx_class_owner`: `ownerTeacherId`
- `idx_class_status`: `status`

### 4. ClassEnrollment 表（班级注册表）

**用途**: 记录学生加入班级的信息

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 注册记录ID |
| `classId` | string | FK, NOT NULL | 班级ID |
| `studentId` | string | FK, NOT NULL | 学生ID |
| `status` | string | DEFAULT 'PENDING' | 注册状态 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |
| `updatedAt` | datetime | DEFAULT now() | 更新时间 |

**索引**:

- `idx_enrollment_class`: `classId`
- `idx_enrollment_student`: `studentId`
- `idx_enrollment_status`: `status`
- `idx_enrollment_unique`: `(classId, studentId)` UNIQUE

### 5. Relationship 表（关系表）

**用途**: 记录学生与家长/教师的关系

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 关系ID |
| `studentId` | string | FK, NOT NULL | 学生ID |
| `partyId` | string | FK, NOT NULL | 对方ID（家长/教师） |
| `partyRole` | string | NOT NULL | 对方角色 |
| `source` | string | NOT NULL | 关系来源 |
| `status` | string | DEFAULT 'PENDING' | 关系状态 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |
| `revokedAt` | datetime | NULL | 撤销时间 |

**索引**:

- `idx_relationship_student`: `studentId`
- `idx_relationship_party`: `partyId`
- `idx_relationship_status`: `status`
- `idx_relationship_unique`: `(studentId, partyId)` UNIQUE

**枚举值**:

- `partyRole`: `PARENT`, `TEACHER`
- `source`: `SHARE_CODE`, `SEARCH`, `CLASS_INVITE`
- `status`: `PENDING`, `ACTIVE`, `REVOKED`, `EXPIRED`

### 6. AccessGrant 表（访问授权表）

**用途**: 记录具体的访问权限授权

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 授权ID |
| `granteeId` | string | FK, NOT NULL | 被授权者ID |
| `studentId` | string | FK, NOT NULL | 学生ID |
| `scope` | string[] | NOT NULL | 权限范围 |
| `relationshipId` | string | FK, NOT NULL | 关系ID |
| `expiresAt` | datetime | NULL | 过期时间 |
| `status` | string | DEFAULT 'ACTIVE' | 授权状态 |
| `grantedAt` | datetime | DEFAULT now() | 授权时间 |
| `grantedBy` | string | NOT NULL | 授权者ID |
| `revokedAt` | datetime | NULL | 撤销时间 |
| `revokedBy` | string | NULL | 撤销者ID |
| `reason` | string | NULL | 撤销原因 |

**索引**:

- `idx_grant_grantee`: `granteeId`
- `idx_grant_student`: `studentId`
- `idx_grant_relationship`: `relationshipId`
- `idx_grant_status`: `status`
- `idx_grant_expires`: `expiresAt`

**权限范围枚举**:

- `progress:read`: 查看学习进度
- `completion:read`: 查看完成情况
- `code_content:read`: 查看代码内容
- `time_records:read`: 查看学习时长
- `achievements:read`: 查看成就徽章
- `assignments:read`: 查看作业任务
- `metrics:read`: 查看统计数据
- `works:read`: 查看作品展示

### 7. Consent 表（同意书表）

**用途**: 记录授权同意过程

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 同意书ID |
| `studentId` | string | FK, NOT NULL | 学生ID |
| `requesterId` | string | FK, NOT NULL | 申请者ID |
| `purpose` | string | NOT NULL | 申请目的 |
| `scope` | string[] | NOT NULL | 申请权限范围 |
| `status` | string | DEFAULT 'PENDING' | 同意状态 |
| `expiresAt` | datetime | NULL | 过期时间 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |
| `updatedAt` | datetime | DEFAULT now() | 更新时间 |

**索引**:

- `idx_consent_student`: `studentId`
- `idx_consent_requester`: `requesterId`
- `idx_consent_status`: `status`

**状态枚举**:

- `PENDING`: 待处理
- `APPROVED`: 已同意
- `REJECTED`: 已拒绝
- `EXPIRED`: 已过期
- `REVOKED`: 已撤销

### 8. AuditLog 表（审计日志表）

**用途**: 记录所有操作日志

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 日志ID |
| `actorId` | string | FK, NOT NULL | 操作者ID |
| `action` | string | NOT NULL | 操作类型 |
| `targetType` | string | NOT NULL | 目标类型 |
| `targetId` | string | NOT NULL | 目标ID |
| `metadata` | json | NULL | 操作元数据 |
| `ipAddress` | string | NULL | IP地址 |
| `userAgent` | string | NULL | 用户代理 |
| `severity` | string | DEFAULT 'info' | 严重程度 |
| `ts` | datetime | DEFAULT now() | 时间戳 |

**索引**:

- `idx_audit_actor`: `actorId`
- `idx_audit_action`: `action`
- `idx_audit_target`: `(targetType, targetId)`
- `idx_audit_timestamp`: `ts`
- `idx_audit_severity`: `severity`

### 9. MetricsSnapshot 表（指标快照表）

**用途**: 存储学生学习指标的快照数据

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 快照ID |
| `studentId` | string | FK, NOT NULL | 学生ID |
| `date` | date | NOT NULL | 快照日期 |
| `chapterId` | string | NULL | 章节ID |
| `tasksDone` | int | DEFAULT 0 | 完成任务数 |
| `accuracy` | float | DEFAULT 0.0 | 准确率 |
| `timeSpentMin` | int | DEFAULT 0 | 学习时长（分钟） |
| `streakDays` | int | DEFAULT 0 | 连续打卡天数 |
| `xpGained` | int | DEFAULT 0 | 获得经验值 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |

**索引**:

- `idx_metrics_student`: `studentId`
- `idx_metrics_date`: `date`
- `idx_metrics_chapter`: `chapterId`
- `idx_metrics_student_date`: `(studentId, date)` UNIQUE

### 10. Appeal 表（申诉表）

**用途**: 记录学生申诉信息

**字段说明**:
| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | string | PK, UUID | 申诉ID |
| `studentId` | string | FK, NOT NULL | 学生ID |
| `targetUserId` | string | FK, NOT NULL | 被申诉用户ID |
| `appealType` | string | NOT NULL | 申诉类型 |
| `description` | string | NOT NULL | 申诉描述 |
| `evidence` | json | NULL | 证据材料 |
| `requestedAction` | string | NOT NULL | 请求处理措施 |
| `status` | string | DEFAULT 'PENDING' | 申诉状态 |
| `submittedAt` | datetime | DEFAULT now() | 提交时间 |
| `reviewedAt` | datetime | NULL | 审核时间 |
| `reviewedBy` | string | FK, NULL | 审核者ID |
| `reviewReason` | string | NULL | 审核理由 |
| `reviewActions` | string[] | NULL | 审核措施 |
| `closedAt` | datetime | NULL | 关闭时间 |
| `closedBy` | string | NULL | 关闭者ID |
| `closeReason` | string | NULL | 关闭理由 |
| `createdAt` | datetime | DEFAULT now() | 创建时间 |
| `updatedAt` | datetime | DEFAULT now() | 更新时间 |

**索引**:

- `idx_appeal_student`: `studentId`
- `idx_appeal_target`: `targetUserId`
- `idx_appeal_status`: `status`
- `idx_appeal_type`: `appealType`

**申诉类型枚举**:

- `UNAUTHORIZED_ACCESS`: 未授权访问
- `EXCESSIVE_DATA_VIEW`: 过度数据查看
- `PRIVACY_VIOLATION`: 隐私侵犯
- `PERMISSION_ABUSE`: 权限滥用
- `OTHER`: 其他

## 数据库设计原则

### 1. 数据完整性

- 使用外键约束确保数据一致性
- 设置适当的默认值和约束
- 使用唯一索引防止重复数据

### 2. 性能优化

- 为常用查询字段创建索引
- 使用复合索引优化多字段查询
- 考虑分区策略处理大数据量

### 3. 安全性

- 敏感数据加密存储
- 审计日志完整记录
- 权限控制严格实施

### 4. 可扩展性

- 使用UUID作为主键
- 预留扩展字段
- 支持水平扩展

## 数据迁移策略

### 1. 版本控制

- 使用数据库迁移工具管理版本
- 每个迁移文件包含版本号和时间戳
- 支持向前和向后迁移

### 2. 数据备份

- 迁移前自动备份数据
- 支持回滚到迁移前状态
- 定期备份重要数据

### 3. 测试环境

- 在测试环境验证迁移脚本
- 模拟生产环境数据量
- 性能测试和压力测试

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 数据库团队  
**审核状态**: 待审核
