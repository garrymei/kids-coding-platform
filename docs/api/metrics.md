# 学习与指标 API 契约

## 概述

本文档定义了儿童编程平台的学习与指标API接口契约，包括纵向趋势指标（单个学生成长）和横向对比指标（多学生对比）功能。

## 基础信息

- **基础路径**: `/api/metrics`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 错误码定义

| 错误码                     | HTTP状态码 | 描述             |
| -------------------------- | ---------- | ---------------- |
| `INVALID_TOKEN`            | 401        | 无效的认证令牌   |
| `INSUFFICIENT_PERMISSIONS` | 403        | 权限不足         |
| `STUDENT_NOT_FOUND`        | 404        | 学生不存在       |
| `INVALID_DATE_RANGE`       | 400        | 日期范围无效     |
| `RATE_LIMIT_EXCEEDED`      | 429        | 请求频率过高     |
| `VALIDATION_ERROR`         | 400        | 请求参数验证失败 |
| `INTERNAL_ERROR`           | 500        | 服务器内部错误   |

---

## T4-1｜纵向趋势指标 API 契约

### 获取学生成长趋势

**接口**: `GET /api/metrics/students/{id}/trend`

**权限**: 仅已授权/同班 Active 的请求者

**请求参数**:

| 参数          | 类型   | 必填 | 描述                         |
| ------------- | ------ | ---- | ---------------------------- |
| `id`          | string | 是   | 学生ID                       |
| `from`        | string | 是   | 开始日期 (YYYY-MM-DD)        |
| `to`          | string | 是   | 结束日期 (YYYY-MM-DD)        |
| `granularity` | string | 否   | 数据粒度 (day/week)，默认day |

**请求示例**:

```http
GET /api/metrics/students/student-123/trend?from=2024-01-01&to=2024-01-31&granularity=day
Authorization: Bearer {token}
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "time_spent_min": 45,
      "tasks_done": 3,
      "accuracy": 0.85,
      "xp": 120,
      "streak": 5
    },
    {
      "date": "2024-01-02",
      "time_spent_min": 60,
      "tasks_done": 4,
      "accuracy": 0.92,
      "xp": 150,
      "streak": 6
    },
    {
      "date": "2024-01-03",
      "time_spent_min": 30,
      "tasks_done": 2,
      "accuracy": 0.78,
      "xp": 80,
      "streak": 7
    }
  ],
  "message": "获取成功"
}
```

**权限说明**:

- **家长**: 仅能查看自己孩子的数据
- **教师**: 仅能查看同班级学生的数据
- **数据范围**: 仅限已授权或同班级 Active 的请求者
- **权限验证**: 每次请求都会验证用户是否有权限查看指定学生的数据

**数据字段说明**:

| 字段             | 类型   | 描述              |
| ---------------- | ------ | ----------------- |
| `date`           | string | 日期 (YYYY-MM-DD) |
| `time_spent_min` | number | 学习时长（分钟）  |
| `tasks_done`     | number | 完成任务数        |
| `accuracy`       | number | 准确率 (0-1)      |
| `xp`             | number | 获得经验值        |
| `streak`         | number | 连续学习天数      |

**粒度说明**:

- `day`: 按天聚合数据，返回每日的指标
- `week`: 按周聚合数据，返回每周的指标（周一到周日）

---

## T4-2｜横向对比指标 API 契约

### 多学生指标对比

**接口**: `POST /api/metrics/compare`

**权限**: 家长端仅"自家孩子 + 班级匿名分位"；教师端仅本班学生可比

**请求体**:

```json
{
  "studentIds": ["student-1", "student-2", "student-3"],
  "metrics": ["accuracy", "tasks_done", "time_spent_min"],
  "window": "last_14d"
}
```

**请求参数说明**:

| 参数         | 类型     | 必填 | 描述         |
| ------------ | -------- | ---- | ------------ |
| `studentIds` | string[] | 是   | 学生ID列表   |
| `metrics`    | string[] | 是   | 要对比的指标 |
| `window`     | string   | 是   | 时间窗口     |

**支持的指标类型**:

| 指标             | 描述             |
| ---------------- | ---------------- |
| `accuracy`       | 准确率           |
| `tasks_done`     | 完成任务数       |
| `time_spent_min` | 学习时长（分钟） |
| `xp_gained`      | 获得经验值       |
| `streak_days`    | 连续学习天数     |

**支持的时间窗口**:

| 窗口值     | 描述     |
| ---------- | -------- |
| `last_7d`  | 最近7天  |
| `last_14d` | 最近14天 |
| `last_30d` | 最近30天 |
| `last_90d` | 最近90天 |

**请求示例**:

```http
POST /api/metrics/compare
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentIds": ["student-123", "student-456"],
  "metrics": ["accuracy", "tasks_done", "time_spent_min"],
  "window": "last_14d"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "studentId": "student-123",
      "studentName": "小明",
      "accuracy": 0.85,
      "tasks_done": 45,
      "time_spent_min": 1200,
      "rank": 1,
      "isAnonymous": false
    },
    {
      "studentId": "student-456",
      "studentName": "小红",
      "accuracy": 0.78,
      "tasks_done": 38,
      "time_spent_min": 950,
      "rank": 2,
      "isAnonymous": false
    },
    {
      "studentId": "class_avg",
      "studentName": "班级平均",
      "accuracy": 0.78,
      "tasks_done": 38,
      "time_spent_min": 950,
      "rank": 0,
      "isAnonymous": true
    },
    {
      "studentId": "class_p50",
      "studentName": "班级中位数(P50)",
      "accuracy": 0.8,
      "tasks_done": 40,
      "time_spent_min": 1000,
      "rank": 0,
      "isAnonymous": true
    },
    {
      "studentId": "class_p90",
      "studentName": "班级优秀线(P90)",
      "accuracy": 0.92,
      "tasks_done": 55,
      "time_spent_min": 1400,
      "rank": 0,
      "isAnonymous": true
    }
  ],
  "message": "对比成功"
}
```

**权限限制说明**:

### 家长端限制

- **数据范围**: 仅能对比自己孩子的数据
- **对比对象**: 只能看到自己孩子与班级匿名统计数据的对比
- **匿名分位**: 自动包含班级平均、中位数(P50)、优秀线(P90)
- **隐私保护**: 不显示其他学生的真实姓名和具体数据

### 教师端限制

- **数据范围**: 仅能对比同班级学生的数据
- **对比对象**: 可以看到同班级学生的真实姓名和具体数据
- **跨班限制**: 不能跨班级对比学生数据
- **统计信息**: 自动包含班级统计信息（平均、中位数、优秀线）

**响应字段说明**:

| 字段             | 类型    | 描述                     |
| ---------------- | ------- | ------------------------ |
| `studentId`      | string  | 学生ID                   |
| `studentName`    | string  | 学生姓名（根据权限显示） |
| `accuracy`       | number  | 准确率                   |
| `tasks_done`     | number  | 完成任务数               |
| `time_spent_min` | number  | 学习时长（分钟）         |
| `rank`           | number  | 综合排名                 |
| `isAnonymous`    | boolean | 是否为匿名数据           |

**排名计算规则**:

- 基于所有请求指标的综合排名
- 排名越小表示表现越好
- 班级统计数据（平均、中位数、优秀线）排名为0
- 排名基于时间窗口内的累计数据计算

---

## 权限验证机制

### 访问控制

1. **身份验证**: 所有请求都需要有效的JWT令牌
2. **角色验证**: 验证用户角色（parent/teacher）
3. **关系验证**: 验证用户与学生的关系（授权/同班）
4. **数据过滤**: 根据权限过滤返回的数据

### 审计日志

每次数据访问都会记录审计日志，包括：

- 访问者ID
- 访问的学生ID
- 访问时间
- 访问的指标类型
- 请求参数

### 限流保护

- **单个用户**: 每分钟最多10次查询
- **单个IP**: 每分钟最多100次查询
- **复杂对比**: 每分钟最多5次查询

---

## 数据隐私保护

### 匿名化策略

1. **家长端**: 其他学生数据完全匿名化
2. **教师端**: 仅显示同班学生真实姓名
3. **班级统计**: 使用匿名标识（班级平均、P50、P90）

### 数据最小化

- 只返回用户有权限查看的数据
- 根据用户角色限制数据范围
- 避免暴露敏感信息

---

## 性能优化

### 缓存策略

- **指标数据**: 缓存24小时
- **班级统计**: 缓存1小时
- **学生摘要**: 缓存30分钟

### 查询优化

- 使用数据库索引优化时间范围查询
- 分页处理大量学生对比请求
- 异步处理复杂统计计算

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: API团队  
**审核状态**: 待审核
