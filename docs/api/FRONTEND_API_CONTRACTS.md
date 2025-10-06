# 前端功能 API 契约补充文档

> 本文档定义了前端已实现功能所需的后端API接口契约和Mock数据规范

## 目录

- [学生端 API](#学生端-api)
- [教师端 API](#教师端-api)
- [家长端 API](#家长端-api)
- [通用 API](#通用-api)

---

## 学生端 API

### 1. 课程地图 API

#### GET `/api/levels/map`

获取课程地图数据（节点和边）

**Query Parameters:**

```typescript
{
  studentId?: string;  // 可选：获取特定学生的进度状态
}
```

**Response 200:**

```typescript
{
  nodes: Array<{
    id: string; // 关卡ID，如 "loops-1"
    title: string; // 关卡标题
    summary: string; // 关卡简介
    status: 'ready' | 'locked' | 'completed'; // 状态
    type?: 'pixel' | 'maze' | 'led' | 'music' | 'io'; // 游戏类型
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    xpReward?: number; // XP奖励
  }>;
  edges: Array<{
    from: string; // 起始节点ID
    to: string; // 目标节点ID
    type?: 'requires' | 'recommends'; // 边类型
  }>;
}
```

**Mock数据示例:**

```json
{
  "nodes": [
    {
      "id": "py-basics-001",
      "title": "变量入门",
      "summary": "学习Python变量的基本使用",
      "status": "completed",
      "type": "io",
      "difficulty": "beginner",
      "xpReward": 100
    },
    {
      "id": "py-loops-001",
      "title": "循环练习 1",
      "summary": "使用 for 循环打印数字",
      "status": "ready",
      "type": "pixel",
      "difficulty": "beginner",
      "xpReward": 150
    },
    {
      "id": "py-loops-002",
      "title": "循环练习 2",
      "summary": "输出平方序列",
      "status": "locked",
      "type": "pixel",
      "difficulty": "intermediate",
      "xpReward": 200
    }
  ],
  "edges": [
    { "from": "py-basics-001", "to": "py-loops-001", "type": "requires" },
    { "from": "py-loops-001", "to": "py-loops-002", "type": "requires" }
  ]
}
```

---

### 2. 学生首页数据 API

#### GET `/api/students/:studentId/home`

获取学生首页数据（今日任务、推荐关卡、成就）

**Response 200:**

```typescript
{
  student: {
    id: string;
    name: string;
    xp: number;
    streak: number;          // 连续学习天数
    completionRate: number;  // 完成率 (0-100)
  };
  dailyTasks: Array<{
    id: string;
    title: string;
    description: string;
    type: 'level' | 'practice' | 'challenge';
    levelId?: string;        // 关卡ID（如果是关卡任务）
    xpReward: number;
    status: 'pending' | 'in_progress' | 'completed';
    deadline?: string;       // ISO 8601格式
  }>;
  recommendedLevel: {
    id: string;
    title: string;
    summary: string;
    type: 'pixel' | 'maze' | 'led' | 'music' | 'io';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    xpReward: number;
    estimatedTime: number;   // 预计时长（分钟）
  } | null;
  recentAchievements: Array<{
    id: string;
    title: string;
    icon: string;            // emoji或URL
    unlockedAt: string;      // ISO 8601格式
  }>;
}
```

---

### 3. 今日任务 API

#### GET `/api/students/:studentId/tasks`

获取学生的所有任务

**Query Parameters:**

```typescript
{
  status?: 'pending' | 'in_progress' | 'completed';
  limit?: number;
  offset?: number;
}
```

**Response 200:**

```typescript
{
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    type: 'level' | 'practice' | 'challenge' | 'daily';
    levelId?: string;
    xpReward: number;
    status: 'pending' | 'in_progress' | 'completed';
    progress?: number; // 0-100
    deadline?: string;
    completedAt?: string;
    createdAt: string;
  }>;
  total: number;
  hasMore: boolean;
}
```

#### POST `/api/students/:studentId/tasks/:taskId/complete`

标记任务完成

**Request Body:**

```typescript
{
  result?: any;  // 可选：任务结果数据
}
```

**Response 200:**

```typescript
{
  success: true;
  task: {
    id: string;
    status: 'completed';
    completedAt: string;
  };
  rewards: {
    xpGained: number;
    newXP: number;
    levelUp?: boolean;
    newLevel?: number;
  };
}
```

---

### 4. 排行榜 API

#### GET `/api/rankings`

获取排行榜数据

**Query Parameters:**

```typescript
{
  scope: 'global' | 'class';
  classId?: string;        // 当scope=class时必填
  limit?: number;          // 默认100
  offset?: number;
  period?: 'all_time' | 'weekly' | 'monthly';  // 时间范围
}
```

**Response 200:**

```typescript
{
  rankings: Array<{
    rank: number;
    studentId: string;
    name: string;
    avatar?: string;
    xp: number;
    streak?: number;
    classIds?: string[];
  }>;
  currentStudent?: {       // 当前登录学生的排名（如果不在前N名）
    rank: number;
    studentId: string;
    xp: number;
  };
  total: number;
}
```

---

### 5. 学生作品 API

#### GET `/api/works/student/:studentId`

获取学生的作品列表

**Query Parameters:**

```typescript
{
  visibility?: 'class' | 'public' | 'all';
  limit?: number;
  offset?: number;
}
```

**Response 200:**

```typescript
{
  works: Array<{
    id: string;
    studentId: string;
    studentName: string;
    title: string;
    coverUrl: string; // 封面图URL或emoji
    codeUrl?: string; // 代码文件URL
    type: 'pixel' | 'maze' | 'led' | 'music';
    createdAt: string;
    likes: number;
    visibility: 'class' | 'public';
    comments: Array<{
      id: string;
      author: string;
      authorRole: 'student' | 'teacher' | 'parent';
      content: string;
      createdAt: string;
    }>;
  }>;
  total: number;
}
```

#### POST `/api/works`

上传新作品

**Request Body (multipart/form-data):**

```typescript
{
  title: string;
  description?: string;
  coverImage: File;        // 封面图片（可选）
  codeFile?: File;         // 代码文件
  levelId: string;         // 关联的关卡ID
  visibility: 'class' | 'public';
}
```

**Response 201:**

```typescript
{
  id: string;
  title: string;
  coverUrl: string;
  createdAt: string;
}
```

#### POST `/api/works/:workId/like`

为作品点赞/取消点赞

**Response 200:**

```typescript
{
  workId: string;
  liked: boolean; // 当前点赞状态
  totalLikes: number;
}
```

---

### 6. 成就系统 API

#### GET `/api/students/:studentId/achievements`

获取学生的成就列表

**Response 200:**

```typescript
{
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string; // emoji或URL
    category: 'learning' | 'streak' | 'social' | 'mastery';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlocked: boolean;
    unlockedAt?: string;
    progress?: {
      current: number;
      required: number;
      percentage: number;
    };
  }>;
  stats: {
    totalUnlocked: number;
    totalAvailable: number;
    categories: Record<string, number>;
  }
}
```

---

## 教师端 API

### 1. 班级概览 API

#### GET `/api/classes/:classId/overview`

获取班级统计概览

**Response 200:**

```typescript
{
  classId: string;
  className: string;
  totalStudents: number;
  activeStudents: number; // 最近7天活跃
  avgCompletionRate: number;
  avgXP: number;
  avgRetryCount: number;
  lastUpdated: string;
  topStudents: Array<{
    studentId: string;
    name: string;
    xp: number;
    completionRate: number;
  }>;
}
```

#### GET `/api/classes/:classId/students`

获取班级学生列表及详细数据

**Query Parameters:**

```typescript
{
  sortBy?: 'xp' | 'completion' | 'lastActive' | 'name';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

**Response 200:**

```typescript
{
  students: Array<{
    id: string;
    name: string;
    avatar?: string;
    xp: number;
    completionRate: number;
    lastActive: string;
    streak: number;
    totalLevelsCompleted: number;
    avgAccuracy: number;
  }>;
  total: number;
}
```

---

### 2. 学生作品管理 API

#### GET `/api/classes/:classId/works`

获取班级学生的作品

**Query Parameters:**

```typescript
{
  studentId?: string;
  type?: 'pixel' | 'maze' | 'led' | 'music';
  sortBy?: 'createdAt' | 'likes';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

**Response 200:**

```typescript
{
  works: Array<{
    id: string;
    studentId: string;
    studentName: string;
    title: string;
    coverUrl: string;
    type: 'pixel' | 'maze' | 'led' | 'music';
    createdAt: string;
    likes: number;
    comments: Array<{
      id: string;
      author: string;
      content: string;
      createdAt: string;
    }>;
  }>;
  total: number;
}
```

#### POST `/api/works/:workId/comment`

教师对作品发表评论

**Request Body:**

```typescript
{
  content: string;
  rating?: number;         // 1-5星评分（可选）
}
```

**Response 201:**

```typescript
{
  commentId: string;
  workId: string;
  author: string;
  content: string;
  createdAt: string;
}
```

---

### 3. 数据导出 API

#### GET `/api/classes/:classId/export`

导出班级学生数据（CSV格式）

**Query Parameters:**

```typescript
{
  format: 'csv' | 'xlsx' | 'json';
  fields?: string[];       // 要导出的字段，默认全部
  dateRange?: {
    start: string;         // ISO 8601
    end: string;
  };
}
```

**Response 200:**

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="class_data_2025-10-06.csv"

学生ID,姓名,XP,完成率(%),最近活跃,连续天数
stu_1,小明,1500,85,2025-10-06 14:30,7
stu_2,小红,1200,72,2025-10-06 13:15,5
...
```

---

## 家长端 API

### 1. 学习趋势 API

#### GET `/api/students/:studentId/trends`

获取学生学习趋势数据

**Query Parameters:**

```typescript
{
  metrics: string[];       // ['xp', 'completion', 'streak', 'studyTime']
  period: 'daily' | 'weekly' | 'monthly';
  days: number;            // 时间范围（天数），如 7, 30, 90
}
```

**Response 200:**

```typescript
{
  studentId: string;
  period: string;
  data: {
    xp: Array<{ date: string; value: number }>;
    completion: Array<{ date: string; value: number }>;
    streak: Array<{ date: string; value: number }>;
    studyTime: Array<{ date: string; value: number }>; // 分钟
  }
  summary: {
    totalXP: number;
    avgDailyXP: number;
    currentStreak: number;
    maxStreak: number;
    totalStudyTime: number;
    avgStudyTime: number;
  }
}
```

---

### 2. 学生对比 API

#### POST `/api/metrics/compare`

横向对比多个学生的数据

**Request Body:**

```typescript
{
  studentIds: string[];
  metrics: string[];       // ['xp', 'completion', 'accuracy', 'retryCount']
  period: 'weekly' | 'monthly' | 'all_time';
}
```

**Response 200:**

```typescript
{
  headers: string[];       // ['学生', 'XP', '完成率', '准确率', '重试次数']
  rows: Array<{
    studentId: string;
    studentName: string;
    [metric: string]: number | string;
  }>;
  averages: Record<string, number>;
}
```

---

## 通用 API

### 1. 代码执行与判题 API

#### POST `/api/execute`

执行代码

**Request Body:**

```typescript
{
  code: string;
  language: 'python' | 'javascript';
  levelId?: string;
  timeout?: number;        // 毫秒，默认5000
}
```

**Response 200:**

```typescript
{
  stdout?: string;
  stderr?: string;
  durationMs: number;
  exitCode?: number;
  events?: any[];          // 事件序列（像素/音符等）
  artifacts?: {
    pixelMatrix?: number[][];
    musicSeq?: Array<{ pitch: string; duration: number }>;
    raw?: any;
  };
}
```

#### POST `/api/judge`

判题

**Request Body:**

```typescript
{
  levelId: string;
  code: string;
  executionResult: {
    stdout?: string;
    stderr?: string;
    events?: any[];
    artifacts?: any;
  };
}
```

**Response 200:**

```typescript
{
  passed: boolean;
  message: string;
  details?: string;
  testCases?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
  visualization?: {
    type: 'pixel' | 'maze' | 'led' | 'music';
    data: any;
  };
  metrics?: {
    accuracy: number;
    efficiency: number;
  };
}
```

---

## 错误响应规范

所有API在发生错误时应返回统一格式：

```typescript
{
  error: {
    code: string;          // 错误代码，如 "INVALID_INPUT"
    message: string;       // 用户友好的错误信息
    details?: any;         // 详细错误信息（开发模式）
    timestamp: string;     // ISO 8601格式
    path: string;          // 请求路径
  }
}
```

**常见HTTP状态码:**

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权（需要登录）
- `403` - 禁止访问（权限不足）
- `404` - 资源不存在
- `429` - 请求过于频繁（限流）
- `500` - 服务器内部错误

---

## 认证与授权

### 认证方式

使用JWT Bearer Token进行认证：

```
Authorization: Bearer <token>
```

### 角色权限

- **Student**: 仅能访问自己的数据和公开资源
- **Teacher**: 能访问所管理班级的学生数据
- **Parent**: 能访问已授权的子女数据
- **Admin**: 完全访问权限

### 资源访问控制

- 学生只能修改自己的数据
- 教师只能访问自己班级的学生数据
- 家长需要学生授权才能访问数据
- 所有跨资源访问需要权限验证

---

## 数据安全与隐私

1. **敏感数据脱敏**
   - 邮箱显示为 `a***@example.com`
   - 手机号显示为 `138****5678`

2. **访问日志**
   - 记录所有数据访问操作
   - 包含时间、用户、资源、操作类型

3. **数据加密**
   - 传输层使用HTTPS
   - 敏感字段数据库加密存储

4. **速率限制**
   - 未认证用户：10 req/min
   - 学生：100 req/min
   - 教师/家长：200 req/min
   - 管理员：无限制

---

## 版本控制

API版本通过URL路径指定：

```
/api/v1/...
```

向后兼容性保证：

- 新增字段不会破坏兼容性
- 废弃字段会保留至少6个月
- 破坏性变更会发布新版本

---

## 联系与反馈

如有API相关问题，请联系开发团队或提交Issue。

**最后更新**: 2025-10-06
