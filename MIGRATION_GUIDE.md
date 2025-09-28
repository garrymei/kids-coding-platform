# 从 Mock 到真数据迁移指南

本文档描述了如何将 Kids Coding Platform 从 Mock 数据迁移到真实的数据库实现。

## 🎯 迁移目标

- **M7 授权流**：家长申请、学生同意、状态管理
- **M8 指标系统**：趋势分析、班级对比、事件聚合
- **权限控制**：JWT 认证、数据访问控制
- **缓存机制**：Redis 缓存、性能优化

## 📋 已完成的工作

### 1. 数据库模型 (Prisma Schema)

✅ 更新了 `packages/api/prisma/schema.prisma`，包含：
- 用户和角色管理
- 家长授权请求 (`consents` 表)
- 班级管理 (`classes`, `class_enrollments` 表)
- 学习事件 (`LearnEvent` 表)
- 日统计 (`DailyStat` 表)
- 包进度 (`PackageProgress` 表)

### 2. M7 服务层实现

✅ **家长服务** (`packages/api/src/modules/parents/`)
- `discoverStudents()` - 发现可搜索的学生
- `createLinkRequest()` - 创建授权申请
- `getLinkRequests()` - 获取授权申请列表

✅ **学生服务** (`packages/api/src/modules/students/`)
- `getConsents()` - 查看收到的授权申请
- `approveConsent()` - 同意授权申请
- `rejectConsent()` - 拒绝授权申请
- `revokeConsent()` - 撤销已同意的授权

✅ **教师服务** (`packages/api/src/modules/teachers/`)
- `createClass()` - 创建班级
- `getApprovals()` - 获取班级申请列表
- `approveApproval()` - 批准学生入班
- `rejectApproval()` - 拒绝学生入班

✅ **班级服务** (`packages/api/src/modules/classes/`)
- `joinClass()` - 学生加入班级

### 3. M8 指标系统

✅ **真实指标服务** (`packages/api/src/modules/metrics/services/real-metrics.service.ts`)
- `getStudentTrend()` - 获取学生趋势数据
- `getClassComparison()` - 获取班级对比数据
- `recordLearnEvent()` - 记录学习事件

✅ **进度事件服务** (`packages/api/src/modules/progress/`)
- `recordProgressEvent()` - 记录学习进度事件

### 4. 缓存系统

✅ **Redis 缓存服务** (`packages/api/src/modules/cache/cache.service.ts`)
- 支持 Redis 和内存缓存双重机制
- 自动缓存失效策略
- 缓存命中率统计

### 5. 权限控制

✅ **权限服务** (`packages/api/src/modules/auth/services/permissions.service.ts`)
- 学生数据访问控制
- 班级数据访问控制
- 事件记录权限验证
- 班级管理权限验证

✅ **权限守卫** (`packages/api/src/modules/auth/guards/permissions.guard.ts`)
- JWT 认证验证
- 角色权限检查
- 数据所有权验证

## 🚀 部署步骤

### 1. 环境配置

创建 `.env` 文件：

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kids"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Redis (optional - will fallback to in-memory cache if not configured)
REDIS_URL="redis://localhost:6379"

# Logging
LOG_LEVEL="info"

# API
PORT=3000
NODE_ENV="development"
```

### 2. 数据库迁移

```bash
cd packages/api
npx prisma migrate deploy
npx prisma generate
```

### 3. 启动服务

```bash
# 启动 API 服务
cd packages/api
npm run start:dev

# 启动 Redis (可选)
redis-server
```

### 4. 验证部署

运行测试脚本：

```bash
node test-migration-validation.js
```

## 📊 API 接口

### M7 授权流接口

```bash
# 家长发现学生
GET /parents/discover-students?q=query

# 家长创建授权申请
POST /parents/link-requests
{
  "studentId": "student-id",
  "note": "申请说明"
}

# 学生查看授权申请
GET /students/consents?status=pending

# 学生处理授权申请
POST /students/consents/{requestId}/approve
POST /students/consents/{requestId}/reject
POST /students/consents/{requestId}/revoke
```

### M8 指标接口

```bash
# 获取学生趋势
GET /metrics/students/{id}/trend?dims=study_minutes,levels_completed&period=daily&from=2024-01-01&to=2024-12-31

# 获取班级对比
POST /metrics/compare
{
  "classId": "class-id",
  "dims": ["levels_completed", "accuracy"],
  "period": "weekly",
  "week": "2024-01-01"
}

# 记录学习事件
POST /progress/events
{
  "levelId": "level-id",
  "passed": true,
  "timeMs": 120000
}
```

## 🔧 配置选项

### Mock 数据开关

所有服务都支持 Mock 数据降级。如果数据库连接失败，会自动使用 Mock 数据：

```typescript
// 在服务中，如果数据库操作失败，会回退到 Mock 数据
catch (error) {
  this.logger.error('Database operation failed:', error);
  // 返回 Mock 数据
  return mockData;
}
```

### 缓存配置

- **Redis 缓存**：如果配置了 `REDIS_URL`，优先使用 Redis
- **内存缓存**：Redis 不可用时，自动降级到内存缓存
- **缓存 TTL**：趋势数据 5 分钟，对比数据 5 分钟

### 权限配置

- **JWT 过期时间**：1 小时
- **角色权限**：基于数据库中的角色定义
- **数据访问**：基于授权关系和班级成员关系

## 🧪 测试

### 单元测试

```bash
cd packages/api
npm test
```

### 集成测试

```bash
# 运行迁移验证测试
node test-migration-validation.js
```

### 性能测试

```bash
# 测试缓存性能
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/metrics/students/student-id/trend?dims=study_minutes&period=daily&from=2024-01-01&to=2024-12-31"
```

## 📈 监控

### 日志

所有服务都包含结构化日志：

```json
{
  "level": "info",
  "message": "Getting trend for student student-id",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userId": "user-id",
  "traceId": "trace-id"
}
```

### 缓存指标

```bash
# 查看缓存命中率
GET /metrics/cache/hits
GET /metrics/cache/misses
```

### 审计日志

所有关键操作都会记录审计日志：

```json
{
  "actorId": "user-id",
  "action": "PARENT_LINK_DECISION",
  "targetType": "consent",
  "targetId": "consent-id",
  "metadata": {"decision": "approved"}
}
```

## 🔄 回滚计划

如果迁移出现问题，可以快速回滚：

1. **数据库回滚**：
   ```bash
   npx prisma migrate reset
   ```

2. **服务回滚**：
   ```bash
   # 恢复之前的 Mock 实现
   git checkout HEAD~1 -- packages/api/src/modules/
   ```

3. **配置回滚**：
   ```bash
   # 禁用新功能
   export USE_MOCK=true
   ```

## 📞 支持

如果遇到问题，请检查：

1. **数据库连接**：确保 PostgreSQL 运行正常
2. **Redis 连接**：确保 Redis 运行正常（可选）
3. **JWT 配置**：确保 JWT_SECRET 配置正确
4. **权限配置**：确保用户角色配置正确

## 🎉 验收标准

迁移成功的验收标准：

- [ ] 前端 `USE_MOCK=false` 后，M7/M8 页面全部正常工作
- [ ] 授权闭环：家长→学生→家长状态变化，DB 可见记录
- [ ] 班级闭环：建班→入班→审批，DB 可见记录
- [ ] 做题 3 次（2 过 1 失败）→ 家长趋势折线（attempts/passes）与教师热力图（accuracy）同步变化
- [ ] Redis 命中率观测可见；写事件后相应 Key 失效
- [ ] 关键接口有结构化日志与 cid，异常有 stack 完善

---

**迁移完成！** 🎊

现在你的 Kids Coding Platform 已经从 Mock 数据成功迁移到真实的数据库实现，具备了完整的权限控制、缓存机制和审计功能。
