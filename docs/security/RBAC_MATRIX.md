# RBAC 权限矩阵

## 概述

本文档定义了儿童编程平台的基于角色的访问控制（RBAC）权限矩阵，确保不同角色只能访问其职责范围内的功能和数据。

## 核心原则

### 学生自主权
- **完全控制**: 学生拥有自己数据的完全控制权
- **显式授权**: 所有访问都需要学生明确同意
- **随时撤销**: 学生可以随时撤销任何访问权限

### 管理员限制
- **无权创建关系**: 管理员不能代替学生创建关系
- **无权绕过授权**: 管理员不能绕过学生的授权机制
- **仅系统运维**: 管理员只能进行系统运维和申诉仲裁

### 关系驱动访问
- **家长访问**: 需要学生明确授权，默认不含代码内容
- **教师访问**: 需要班级关系，只能查看教学相关数据
- **最小权限**: 只授予必要的只读权限

## 角色定义

### 学生 (Student)
- 管理自己的可见性设置
- 审批/撤销关注请求
- 查看自己的审计摘要
- 完全控制自己的数据

### 家长 (Parent)
- 仅在获得授权的范围内只读查看
- 默认不含代码内容，仅成果/统计
- 申请关注学生数据

### 教师 (Teacher)
- 加入"班级关系"后才能查看班级内学生数据
- 点评作品、下发任务
- 查看教学相关数据

### 管理员 (Admin)
- 无权创建关系/绕过授权
- 仅做系统运维与申诉仲裁
- 通过二人审批流处理申诉

## 详细权限矩阵

### 学生权限
| 功能 | 权限 | 说明 |
|------|------|------|
| 管理可见性设置 | `MANAGE_OWN_VISIBILITY` | 控制是否可被搜索 |
| 审批关注请求 | `APPROVE_RELATIONSHIPS` | 同意/拒绝关注申请 |
| 撤销关注关系 | `REVOKE_RELATIONSHIPS` | 随时撤销访问权限 |
| 查看审计摘要 | `VIEW_OWN_AUDIT` | 查看自己的操作记录 |

### 家长权限
| 功能 | 权限 | 说明 |
|------|------|------|
| 查看授权学生数据 | `VIEW_AUTHORIZED_STUDENT_DATA` | 仅授权范围内，不含代码 |
| 申请学生访问 | `REQUEST_STUDENT_ACCESS` | 发起关注申请 |

### 教师权限
| 功能 | 权限 | 说明 |
|------|------|------|
| 查看班级学生数据 | `VIEW_CLASS_STUDENT_DATA` | 需要班级关系 |
| 点评作品 | `COMMENT_ON_WORKS` | 仅课堂作品 |
| 下发任务 | `ASSIGN_TASKS` | 班级内任务 |
| 管理班级 | `MANAGE_CLASS` | 创建和管理班级 |

### 管理员权限
| 功能 | 权限 | 说明 |
|------|------|------|
| 系统运维 | `SYSTEM_MAINTENANCE` | 系统状态、数据导出 |
| 处理申诉 | `HANDLE_APPEALS` | 二人审批流 |
| 查看系统审计 | `VIEW_SYSTEM_AUDIT` | 系统级审计日志 |
| 用户管理 | `MANAGE_USERS` | 用户状态管理 |

## 路由权限矩阵

### 学生端路由
| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/students/permissions/my-data` | GET | `MANAGE_OWN_VISIBILITY` | 查看自己的完整数据 |
| `/students/permissions/visibility-settings` | GET/PUT | `MANAGE_OWN_VISIBILITY` | 管理可见性设置 |
| `/students/permissions/pending-requests` | GET | `APPROVE_RELATIONSHIPS` | 获取待处理请求 |
| `/students/permissions/approve-request/:id` | POST | `APPROVE_RELATIONSHIPS` | 批准关注请求 |
| `/students/permissions/reject-request/:id` | POST | `APPROVE_RELATIONSHIPS` | 拒绝关注请求 |
| `/students/permissions/my-relationships` | GET | `REVOKE_RELATIONSHIPS` | 获取关系列表 |
| `/students/permissions/revoke-relationship/:id` | DELETE | `REVOKE_RELATIONSHIPS` | 撤销关系 |
| `/students/permissions/audit-summary` | GET | `VIEW_OWN_AUDIT` | 查看审计摘要 |

### 家长端路由
| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/parents/permissions/authorized-students` | GET | `VIEW_AUTHORIZED_STUDENT_DATA` | 获取已授权学生列表 |
| `/parents/permissions/student-data/:id` | GET | `VIEW_AUTHORIZED_STUDENT_DATA` | 查看授权学生数据 |
| `/parents/permissions/student-progress/:id` | GET | `VIEW_AUTHORIZED_STUDENT_DATA` | 查看学习进度 |
| `/parents/permissions/student-works/:id` | GET | `VIEW_AUTHORIZED_STUDENT_DATA` | 查看作品（不含代码） |
| `/parents/permissions/request-access` | POST | `REQUEST_STUDENT_ACCESS` | 申请访问学生数据 |
| `/parents/permissions/access-status/:id` | GET | `VIEW_AUTHORIZED_STUDENT_DATA` | 查看访问状态 |

### 教师端路由
| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/teachers/permissions/my-classes` | GET | `MANAGE_CLASS` | 获取我的班级列表 |
| `/teachers/permissions/class-students/:id` | GET | `VIEW_CLASS_STUDENT_DATA` | 获取班级学生列表 |
| `/teachers/permissions/student-data/:id` | GET | `VIEW_CLASS_STUDENT_DATA` | 查看班级内学生数据 |
| `/teachers/permissions/student-progress/:id` | GET | `VIEW_CLASS_STUDENT_DATA` | 查看学习进度 |
| `/teachers/permissions/student-works/:id` | GET | `VIEW_CLASS_STUDENT_DATA` | 查看作品（教学相关） |
| `/teachers/permissions/comment-work/:id` | POST | `COMMENT_ON_WORKS` | 点评学生作品 |
| `/teachers/permissions/assign-task` | POST | `ASSIGN_TASKS` | 下发任务 |
| `/teachers/permissions/class-analytics/:id` | GET | `VIEW_CLASS_STUDENT_DATA` | 获取班级分析数据 |

### 管理员端路由
| 路由 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/admin/permissions/system-status` | GET | `SYSTEM_MAINTENANCE` | 获取系统状态 |
| `/admin/permissions/appeals` | GET | `HANDLE_APPEALS` | 获取申诉列表 |
| `/admin/permissions/handle-appeal/:id` | POST | `HANDLE_APPEALS` | 处理申诉 |
| `/admin/permissions/second-approval/:id` | POST | `HANDLE_APPEALS` | 二次审批申诉 |
| `/admin/permissions/system-audit` | GET | `VIEW_SYSTEM_AUDIT` | 查看系统审计日志 |
| `/admin/permissions/user-management` | GET | `MANAGE_USERS` | 用户管理 |
| `/admin/permissions/user-status/:id` | PUT | `MANAGE_USERS` | 更新用户状态 |
| `/admin/permissions/data-export` | GET | `SYSTEM_MAINTENANCE` | 数据导出 |

## 数据可见性控制

### 学生数据过滤规则

#### 学生查看自己数据
```typescript
// 完整数据访问
{
  id, email, displayName, nickname, school, className,
  discoverable, role, learningData, createdAt, updatedAt
}
```

#### 家长查看学生数据
```typescript
// 仅授权范围内的只读数据
{
  id, displayName, // 不包含邮箱
  nickname?, school?, className?, // 根据授权
  learningProgress?, // 过滤后的进度数据
  works?, // 不含代码内容
  metrics?, // 统计指标
  accessInfo: { scopes, expiresAt, grantedAt }
}
```

#### 教师查看学生数据
```typescript
// 班级关系内的教学数据
{
  id, displayName, nickname, school, className,
  teachingData: {
    progress, metrics, works, // 教学相关内容
  },
  classInfo: { classId, className, enrolledAt }
}
```

#### 管理员查看学生数据
```typescript
// 仅系统运维数据
{
  id, email, displayName, nickname, school, className,
  discoverable, role,
  systemData: { accountStatus, lastLogin }, // 不含学习内容
  createdAt, updatedAt
}
```

## 权限检查流程

### 1. 权限装饰器检查
```typescript
@RequirePermissions(Permission.VIEW_AUTHORIZED_STUDENT_DATA)
@UseGuards(JwtAuthGuard, PermissionsGuard)
```

### 2. 角色权限验证
```typescript
// 根据用户角色检查权限
switch (userRole) {
  case 'student': return checkStudentPermissions();
  case 'parent': return checkParentPermissions();
  case 'teacher': return checkTeacherPermissions();
  case 'admin': return checkAdminPermissions();
}
```

### 3. 数据访问验证
```typescript
// 检查是否有访问特定数据的权限
const hasAccess = await visibilityService.hasDataAccess(
  viewerId, targetStudentId, dataType
);
```

### 4. 数据过滤
```typescript
// 根据查看者角色过滤数据
const filteredData = await visibilityService.filterStudentData(
  studentId, viewerId, viewerRole
);
```

## 安全约束

### 管理员限制
- ❌ 不能创建学生关系
- ❌ 不能绕过学生授权
- ❌ 不能查看学习内容
- ✅ 只能进行系统运维
- ✅ 只能处理申诉（需二人审批）

### 关系创建权
- ✅ 学生端：通过授权中心
- ✅ 课堂入班：通过班级邀请
- ❌ 管理员：不能代替学生决定

### 数据保护
- 🔒 默认私有：学生数据默认仅学生可见
- 🔍 显式授权：所有访问需要明确同意
- 📊 最小权限：只授予必要的只读权限
- 📝 全链路审计：所有访问都有记录

## 实施检查清单

### 权限控制
- [ ] 使用 `@RequirePermissions()` 装饰器
- [ ] 实现 `PermissionsGuard` 权限检查
- [ ] 使用 `VisibilityService` 数据过滤
- [ ] 记录所有权限变更到审计日志

### 数据保护
- [ ] 家长默认不能查看代码内容
- [ ] 教师只能查看班级内学生数据
- [ ] 管理员不能查看学习内容
- [ ] 所有数据访问都有审计记录

### 关系管理
- [ ] 学生拥有关系创建控制权
- [ ] 管理员不能代替学生创建关系
- [ ] 支持随时撤销访问权限
- [ ] 关系状态变更都有记录

---

**文档版本**: v2.0  
**最后更新**: 2024-01-03  
**维护人员**: 安全团队