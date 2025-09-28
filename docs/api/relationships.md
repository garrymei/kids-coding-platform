# 关系 / 授权 / 同意（Relationships API）

## 概述
- 角色：student / parent / teacher / admin
- 原则：默认私有；需学生或课堂入班同意；可随时撤销；全量审计

## 搜索学生（可选开放，默认关闭）
GET /relationships/search-students?q={keyword}&school={opt}&class={opt}&id={opt}
Auth: parent|teacher
Rate-limit: 5 req/min/account & IP
Notes:
- 仅返回 `discoverable=true` 的学生
- 结果去标识化（掩码头像、匿名ID可选）

### 200
```json
{
  "items": [
    {"studentId": "stu_123", "nickname": "小**", "school": "一中", "className": "七(2)", "anonId": "S-8F3K2Q"}
  ],
  "nextCursor": null
}
```

## 发起关注/查看申请

POST /relationships/requests
Auth: parent|teacher
Body:

```json
{
  "studentId": "stu_123",
  "scope": ["progress:read","metrics:read","works:read"],
  "reason": "家长查看",
  "expiresInDays": 90
}
```

### 201
`{"requestId":"req_001","status":"pending"}`

### 4xx

- **400 invalid_scope**: 无效的权限范围
- **403 student_not_discoverable**: 学生不允许被发现
- **409 already_requested**: 已存在待处理的申请

---

## 学生审批（同意/拒绝）

### 查看待处理申请
GET /consents/pending
Auth: student

#### 200
```json
{
  "items":[
    {
      "consentId":"con_001",
      "requester":{"id":"par_aaa","role":"parent","nickname":"张**"},
      "scope":["progress:read"],
      "reason": "家长查看",
      "proposedExpireAt":"2025-12-31"
    }
  ]
}
```

### 批准申请
POST /consents/{id}/approve
Auth: student
Body (学生可主动缩小范围或修改到期日):
```json
{
  "scope":["progress:read"], 
  "expireAt":"2025-10-01"
}
```

#### 200
`{"grantId":"gr_001","status":"active"}`

### 拒绝申请
POST /consents/{id}/reject
Auth: student

#### 200
`{"status":"rejected"}`

---

## 撤销授权

POST /access-grants/{id}/revoke
Auth: student|grantee

### 200
`{"status":"revoked"}`

---

## 班级管理

### 创建班级 (老师)
POST /classes
Auth: teacher
Body:
```json
{
  "name":"2025秋-七(2)"
}
```

#### 201
`{"classId":"cls_001","inviteCode":"C-9XQ4T"}`

### 加入班级 (学生)
POST /classes/join
Auth: student
Body:
```json
{
  "inviteCode":"C-9XQ4T"
}
```

#### 202
`{"enrollmentId":"enr_001","status":"pending"}`

### 批准学生加入 (老师)
POST /classes/enrollments/{id}/approve
Auth: teacher(owner)

#### 200
`{"status":"active","grantsCreated":["progress:read","metrics:read"]}`

---

## 审计日志

任何读取敏感数据的接口调用都必须写入审计日志。

**字段**:
- `actorId`: 操作者ID
- `action`: 操作类型 (e.g., `view.progress`)
- `targetType`: 目标类型 (e.g., `student`)
- `targetId`: 目标ID
- `ts`: 时间戳
- `route`: 访问的路由
- `meta`: 其他元数据

**示例**:
```json
{
  "actorId":"par_1",
  "action":"view.progress",
  "targetType":"student",
  "targetId":"stu_123",
  "route":"/metrics/students/stu_123/trend",
  "ts":"2025-09-19T09:00:00Z"
}
```