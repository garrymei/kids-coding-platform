# 实现清单 - Issue 清单

## 概述

本文档列出了家长/老师查看学生数据功能的实现清单，包含8个核心Issue，每个Issue都有明确的验收标准和优先级。

## Issue 清单

### Issue #1: 实现搜索与申请的策略开关（discoverable 默认 off）

**优先级**: 🔴 高  
**预估工时**: 2-3天  
**负责人**: 待分配

**描述**:
实现学生搜索可见性的双轨机制，包括安全默认策略和可选开放策略。

**验收标准**:

- [ ] 学生默认不可被搜索（discoverable = false）
- [ ] 学生可手动开启"可被搜索"功能
- [ ] 提供4种搜索可见性选项：完全私有、仅同校可见、匿名ID可见、完全公开
- [ ] 开启完全公开时显示警告弹窗
- [ ] 支持匿名ID生成和管理
- [ ] 搜索请求限流保护（每分钟最多10次）
- [ ] 搜索结果默认脱敏处理

**技术要点**:

- 数据库字段：`User.discoverable`, `User.nickname`, `User.school`, `User.className`
- API接口：`PUT /api/students/search-settings`, `GET /api/students/search-settings`
- 前端组件：搜索设置页面、警告弹窗组件

---

### Issue #2: 实现 consent/relationships/access_grants 模型与迁移

**优先级**: 🔴 高  
**预估工时**: 3-4天  
**负责人**: 待分配

**描述**:
实现核心数据模型，包括同意书、关系、访问授权等表结构。

**验收标准**:

- [ ] 创建 `Consent` 表（同意书）
- [ ] 创建 `Relationship` 表（关系）
- [ ] 创建 `AccessGrant` 表（访问授权）
- [ ] 创建 `AuditLog` 表（审计日志）
- [ ] 创建 `Appeal` 表（申诉）
- [ ] 创建 `Class` 表（班级）
- [ ] 创建 `ClassEnrollment` 表（班级注册）
- [ ] 创建 `MetricsSnapshot` 表（指标快照）
- [ ] 所有表都有完整的索引和外键约束
- [ ] 迁移脚本可以正常执行和回滚

**技术要点**:

- 使用 Prisma ORM 管理数据库
- 迁移文件：`20250103000001_create_relationships_tables`
- 索引优化：为常用查询字段创建索引
- 外键约束：确保数据完整性

---

### Issue #3: 学生授权中心（路由与 UI 占位）

**优先级**: 🟡 中  
**预估工时**: 2-3天  
**负责人**: 待分配

**描述**:
实现学生端的授权管理界面，包括待处理、已授权、已撤销三个标签页。

**验收标准**:

- [ ] 创建授权中心页面路由
- [ ] 实现三个标签页：待处理、已授权、已撤销
- [ ] 显示申请卡片：申请人、申请范围、到期日
- [ ] 提供操作按钮：查看详情、缩小范围、设定到期
- [ ] 实现撤销按钮，支持即时生效
- [ ] 支持批量操作（批量批准、批量拒绝）
- [ ] 响应式设计，支持移动端

**技术要点**:

- 路由：`/student/authorization-center`
- 组件：`AuthorizationCenterPage.tsx`
- API接口：`GET /api/relationships/pending-requests`
- 状态管理：使用 React Context 或 Zustand

---

### Issue #4: 家长关注流程（搜索/申请/等待/结果）占位

**优先级**: 🟡 中  
**预估工时**: 3-4天  
**负责人**: 待分配

**描述**:
实现家长端的完整关注流程，包括搜索学生、发送申请、等待审批、查看结果。

**验收标准**:

- [ ] 搜索页面：支持昵称+学校搜索和匿名ID搜索
- [ ] 申请表单：选择权限范围、设置到期时间、填写申请理由
- [ ] 等待页面：显示申请状态、支持撤回申请
- [ ] 结果页面：显示授权状态、权限范围、到期时间
- [ ] 数据页面：显示授权范围内的学生数据
- [ ] 权限管理：支持申请扩展范围、续期、撤销

**技术要点**:

- 路由：`/parent/search`, `/parent/request`, `/parent/data`
- 组件：`SearchStudentsPage.tsx`, `RequestAccessForm.tsx`, `ChildDataPage.tsx`
- API接口：`GET /api/students/search`, `POST /api/relationships/request-parent-access`
- 数据脱敏：搜索结果默认脱敏处理

---

### Issue #5: 教师班级流程（建班/入班/审批）占位

**优先级**: 🟡 中  
**预估工时**: 3-4天  
**负责人**: 待分配

**描述**:
实现教师端的班级管理流程，包括创建班级、学生入班、审批申请等。

**验收标准**:

- [ ] 班级管理页面：创建班级、展示邀请码、班级列表
- [ ] 学生入班：通过邀请码加入班级
- [ ] 审批流程：教师审批学生入班申请
- [ ] 班级仪表盘：显示班级整体数据、学生列表
- [ ] 学生对比：支持多学生数据对比
- [ ] 权限管理：自动授予班级相关权限

**技术要点**:

- 路由：`/teacher/classes`, `/teacher/dashboard`, `/teacher/compare`
- 组件：`ClassManagementPage.tsx`, `TeachingDashboard.tsx`, `StudentComparisonPage.tsx`
- API接口：`POST /api/classes`, `POST /api/classes/join`, `POST /api/classes/enrollments/{id}/approve`
- 权限控制：教师只能管理自己的班级

---

### Issue #6: 纵向趋势 metrics 接口契约与样例 JSON

**优先级**: 🟢 低  
**预估工时**: 1-2天  
**负责人**: 待分配

**描述**:
实现学生学习趋势的纵向分析接口，支持按天/周粒度查看学习数据。

**验收标准**:

- [ ] API接口：`GET /api/metrics/students/{id}/trend`
- [ ] 支持时间范围查询：`from`, `to` 参数
- [ ] 支持数据粒度：`day`, `week` 参数
- [ ] 返回数据：学习时长、完成关卡、准确率、XP、连续打卡
- [ ] 权限验证：仅授权用户可访问
- [ ] 数据填充：缺失日期自动填充为0
- [ ] 性能优化：支持数据缓存

**技术要点**:

- 接口：`GET /api/metrics/students/{id}/trend?from=2024-01-01&to=2024-01-31&granularity=day`
- 响应格式：`[{date, time_spent_min, tasks_done, accuracy, xp, streak}]`
- 数据源：`MetricsSnapshot` 表
- 权限检查：验证用户是否有权限查看该学生数据

---

### Issue #7: 横向对比 metrics 接口契约与样例 JSON

**优先级**: 🟢 低  
**预估工时**: 1-2天  
**负责人**: 待分配

**描述**:
实现多学生数据对比的横向分析接口，支持班级内学生对比。

**验收标准**:

- [ ] API接口：`POST /api/metrics/compare`
- [ ] 支持多学生对比：`studentIds` 数组
- [ ] 支持指标选择：`metrics` 数组
- [ ] 支持时间窗口：`window` 参数
- [ ] 返回数据：各学生指标值、排名、匿名化处理
- [ ] 权限验证：家长只能对比自己的孩子，教师只能对比同班学生
- [ ] 数据去敏：家长端显示匿名分位数据

**技术要点**:

- 接口：`POST /api/metrics/compare`
- 请求体：`{studentIds: [], metrics: [], window: "last_14d"}`
- 响应格式：`[{studentId, accuracy, tasks_done, time_spent_min, rank, isAnonymous}]`
- 权限控制：根据用户角色限制对比范围

---

### Issue #8: 审计与速率限制策略文档 + CI 检查（防误删政策文件）

**优先级**: 🟡 中  
**预估工时**: 1-2天  
**负责人**: 待分配

**描述**:
完善审计日志和速率限制策略，并添加CI检查防止政策文件被误删。

**验收标准**:

- [ ] 完善审计日志策略文档
- [ ] 实现速率限制策略
- [ ] 添加CI检查：验证政策文件存在性
- [ ] 实现搜索限流：账号+IP双重限流
- [ ] 实现申请限流：防止滥用申请功能
- [ ] 实现异常检测：检测撞库攻击
- [ ] 实现自动封禁：连续违规自动封禁

**技术要点**:

- 文档：`docs/policy/safety-baseline.md`
- CI检查：`.github/workflows/ci.yml` 中的 `policy-check` 任务
- 限流服务：`RateLimitService`
- 审计服务：`AuditLoggingService`

## 实现优先级

### 第一阶段（核心功能）

1. **Issue #2**: 实现 consent/relationships/access_grants 模型与迁移
2. **Issue #1**: 实现搜索与申请的策略开关

### 第二阶段（用户界面）

3. **Issue #3**: 学生授权中心（路由与 UI 占位）
4. **Issue #4**: 家长关注流程（搜索/申请/等待/结果）占位
5. **Issue #5**: 教师班级流程（建班/入班/审批）占位

### 第三阶段（数据分析）

6. **Issue #6**: 纵向趋势 metrics 接口契约与样例 JSON
7. **Issue #7**: 横向对比 metrics 接口契约与样例 JSON

### 第四阶段（安全完善）

8. **Issue #8**: 审计与速率限制策略文档 + CI 检查

## 验收标准

### 整体验收标准

- [ ] 所有API接口都有完整的Swagger文档
- [ ] 所有前端页面都有响应式设计
- [ ] 所有功能都有完整的权限控制
- [ ] 所有操作都有审计日志记录
- [ ] 所有数据都有适当的脱敏处理
- [ ] 所有功能都有完整的测试用例

### 性能要求

- [ ] API响应时间 < 200ms
- [ ] 页面加载时间 < 2s
- [ ] 支持1000+并发用户
- [ ] 数据库查询优化，支持大数据量

### 安全要求

- [ ] 所有敏感操作都有二次确认
- [ ] 所有API都有速率限制
- [ ] 所有数据访问都有权限验证
- [ ] 所有操作都有审计日志

## 技术栈

### 后端

- **框架**: NestJS
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT (RS256)
- **文档**: Swagger/OpenAPI
- **缓存**: Redis
- **日志**: Pino

### 前端

- **框架**: React + TypeScript
- **路由**: React Router DOM
- **状态管理**: Zustand
- **UI组件**: Ant Design
- **图表**: Recharts
- **表单**: React Hook Form + Zod

### 工具

- **包管理**: pnpm
- **代码质量**: ESLint + Prettier
- **测试**: Jest + Testing Library
- **CI/CD**: GitHub Actions
- **部署**: Docker

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 产品团队  
**审核状态**: 待审核
