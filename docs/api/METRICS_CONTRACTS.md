# 家长/老师查看能力接口契约

## 概述

本文档定义了家长/老师的"查看能力"接口契约，包括纵向（单个学生成长）和横向（多学生对比）的数据查看功能。

## 核心功能

### 5.1 纵向（单个学生的成长）

#### 功能描述

查看单个学生在指定时间范围内的学习成长趋势，包括学习时长、完成关卡、平均准确率、错题主题、连续打卡、XP等维度。

#### 接口定义

```http
GET /metrics/students/{id}/trend?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day|week
Authorization: Bearer {token}
```

#### 请求参数

| 参数        | 类型   | 必填 | 说明                         |
| ----------- | ------ | ---- | ---------------------------- |
| id          | string | 是   | 学生ID                       |
| from        | string | 是   | 开始日期 (YYYY-MM-DD)        |
| to          | string | 是   | 结束日期 (YYYY-MM-DD)        |
| granularity | string | 否   | 数据粒度 (day/week)，默认day |

#### 响应格式

```json
[
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
  }
]
```

#### 权限要求

- 角色: `parent` | `teacher`
- 权限: `VIEW_STUDENT_DATA`
- 数据范围: 仅限已授权或同班级active的学生

---

### 5.2 横向（多学生对比）

#### 功能描述

对比多个学生在指定时间窗口内的学习指标，包括关卡完成率、准确率、平均耗时、重试次数、最近活跃等维度。

#### 接口定义

```http
POST /metrics/compare
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentIds": ["student-1", "student-2", "student-3"],
  "metrics": ["accuracy", "tasks_done", "time_spent_min"],
  "window": "last_14d"
}
```

#### 请求参数

| 参数       | 类型     | 必填 | 说明         |
| ---------- | -------- | ---- | ------------ |
| studentIds | string[] | 是   | 学生ID列表   |
| metrics    | string[] | 是   | 要对比的指标 |
| window     | string   | 是   | 时间窗口     |

#### 指标类型

- `accuracy`: 准确率
- `tasks_done`: 完成任务数
- `time_spent_min`: 学习时长（分钟）
- `xp_gained`: 获得经验值
- `streak_days`: 连续学习天数

#### 时间窗口

- `last_7d`: 最近7天
- `last_14d`: 最近14天
- `last_30d`: 最近30天
- `last_90d`: 最近90天

#### 响应格式

```json
[
  {
    "studentId": "student-1",
    "studentName": "小明",
    "accuracy": 0.85,
    "tasks_done": 45,
    "time_spent_min": 1200,
    "rank": 3,
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
]
```

#### 权限要求

- 角色: `parent` | `teacher`
- 权限: `VIEW_STUDENT_DATA`
- 数据范围: 仅限已授权或同班级active的学生

---

### 5.3 学生指标摘要

#### 功能描述

获取学生在指定时间范围内的学习指标摘要，包括总学习时长、总完成任务数、平均准确率、总经验值、当前连续学习天数等。

#### 接口定义

```http
GET /metrics/students/{id}/summary
Authorization: Bearer {token}
```

#### 响应格式

```json
{
  "studentId": "student-1",
  "studentName": "小明",
  "totalTimeSpent": 1200,
  "totalTasksDone": 45,
  "averageAccuracy": 0.85,
  "totalXP": 2500,
  "currentStreak": 7,
  "lastActiveDate": "2024-01-03"
}
```

---

### 5.4 班级指标概览

#### 功能描述

获取班级在指定时间范围内的整体学习指标概览，包括学生数量、平均准确率、总完成任务数、总学习时长、表现最佳的学生等。

#### 接口定义

```http
GET /metrics/classes/{classId}/overview
Authorization: Bearer {teacher_token}
```

#### 响应格式

```json
{
  "classId": "class-1",
  "className": "初一(3)班",
  "studentCount": 25,
  "averageAccuracy": 0.78,
  "totalTasksDone": 950,
  "totalTimeSpent": 24000,
  "topPerformers": [
    {
      "studentId": "student-1",
      "studentName": "小明",
      "accuracy": 0.92,
      "tasksDone": 55
    },
    {
      "studentId": "student-2",
      "studentName": "小红",
      "accuracy": 0.89,
      "tasksDone": 52
    }
  ]
}
```

---

## 权限控制与数据去敏

### 家长端权限

- **数据范围**: 仅限自己孩子的数据
- **对比功能**: 只能看到自己孩子与班级匿名统计数据（班级平均、中位数、优秀线）的对比
- **隐私保护**: 不显示其他学生的真实姓名和具体数据

### 教师端权限

- **数据范围**: 仅限同班级学生的数据
- **对比功能**: 可以看到同班级学生的真实姓名和具体数据
- **跨班限制**: 不能跨班级对比学生数据
- **统计信息**: 自动包含班级统计信息（平均、中位数、优秀线）

### 数据去敏策略

1. **匿名化处理**: 对家长端显示班级统计时，使用匿名标识
2. **权限验证**: 每次请求都验证用户是否有权限查看指定学生的数据
3. **数据过滤**: 根据用户角色和权限过滤返回的数据
4. **审计日志**: 记录所有数据访问操作

---

## UI 建议

### 家长端界面

- **默认显示**: 只显示自己孩子与"班级匿名分位（P50/P90）"
- **隐私提示**: 明确说明数据来源和隐私保护措施
- **避免不适**: 不进行跨家庭对比，避免造成家长心理压力

### 教师端界面

- **真实姓名**: 可以显示同班学生的真实姓名
- **详细对比**: 支持多维度指标对比
- **趋势分析**: 提供学生成长趋势分析
- **班级管理**: 结合班级管理功能，提供教学指导

---

## 错误处理

### 常见错误码

- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 权限不足
- `404 Not Found` - 学生不存在
- `429 Too Many Requests` - 请求频率过高

### 错误响应格式

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "您没有权限查看该学生的数据",
    "details": {
      "studentId": "student-1",
      "requiredPermission": "VIEW_STUDENT_DATA"
    }
  }
}
```

---

## 性能优化

### 数据缓存

- 指标数据缓存24小时
- 班级统计缓存1小时
- 学生摘要缓存30分钟

### 查询优化

- 使用数据库索引优化时间范围查询
- 分页处理大量学生对比请求
- 异步处理复杂统计计算

### 限流策略

- 单个用户每分钟最多10次查询
- 单个IP每分钟最多100次查询
- 复杂对比查询每分钟最多5次

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 开发团队
