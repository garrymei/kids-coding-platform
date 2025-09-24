# 班级/老师关系接口契约

## 概述

本文档定义了班级/老师关系的推荐主路径接口契约，这是教师查看学生数据的主要方式。

## 核心流程

### 推荐主路径

```
老师建班 → 学生入班（邀请码）→ 老师审批 → 自动授予班级范围只读权限
```

### 学生退出流程

```
学生可在"授权中心"一键退出 → 关系失效/授权撤销
```

## 接口契约

### 1. 教师创建班级

#### 接口定义

```http
POST /classes
Authorization: Bearer {teacher_token}
Content-Type: application/json

{
  "name": "初一(3)班",
  "description": "编程入门班级"
}
```

#### 响应格式

```json
{
  "id": "class-uuid",
  "name": "初一(3)班",
  "description": "编程入门班级",
  "code": "A1B2C3",
  "status": "ACTIVE",
  "ownerTeacher": {
    "id": "teacher-uuid",
    "displayName": "张老师",
    "email": "teacher@example.com"
  },
  "createdAt": "2024-01-03T10:00:00Z",
  "inviteUrl": "/classes/join/A1B2C3"
}
```

#### 权限要求

- 角色: `teacher`
- 权限: `MANAGE_CLASS`

#### 业务逻辑

1. 验证教师身份
2. 生成唯一邀请码（6位字母数字组合）
3. 创建班级记录
4. 记录审计日志

---

### 2. 学生加入班级

#### 接口定义

```http
POST /classes/join
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "code": "A1B2C3"
}
```

#### 响应格式

```json
{
  "message": "入班申请已提交，等待教师审核",
  "enrollmentId": "enrollment-uuid",
  "class": {
    "id": "class-uuid",
    "name": "初一(3)班",
    "description": "编程入门班级",
    "teacher": {
      "id": "teacher-uuid",
      "displayName": "张老师",
      "email": "teacher@example.com"
    }
  },
  "status": "PENDING"
}
```

#### 权限要求

- 角色: `student`
- 权限: `VIEW_OWN_AUDIT`

#### 业务逻辑

1. 验证学生身份
2. 验证邀请码有效性
3. 检查是否已加入过该班级
4. 创建入班申请记录（status=pending）
5. 记录审计日志

---

### 3. 教师审批学生入班

#### 接口定义

```http
POST /classes/enrollments/{enrollmentId}/approve
Authorization: Bearer {teacher_token}
Content-Type: application/json

{
  "action": "approve"  // 或 "reject"
}
```

#### 响应格式（审批通过）

```json
{
  "message": "学生入班申请已批准",
  "enrollmentId": "enrollment-uuid",
  "relationshipId": "relationship-uuid",
  "accessGrantId": "access-grant-uuid",
  "student": {
    "id": "student-uuid",
    "displayName": "小明",
    "email": "student@example.com"
  },
  "grantedScopes": ["progress:read", "metrics:read", "works:read"]
}
```

#### 响应格式（审批拒绝）

```json
{
  "message": "学生入班申请已拒绝",
  "enrollmentId": "enrollment-uuid",
  "student": {
    "id": "student-uuid",
    "displayName": "小明",
    "email": "student@example.com"
  }
}
```

#### 权限要求

- 角色: `teacher`
- 权限: `MANAGE_CLASS`

#### 业务逻辑（审批通过）

1. 验证教师身份和班级所有权
2. 更新入班状态为 `ACTIVE`
3. 创建关系记录（status=active, source=CLASS_INVITE）
4. 自动创建访问授权（scope=["progress:read","metrics:read","works:read"]）
5. 记录审计日志

#### 业务逻辑（审批拒绝）

1. 验证教师身份和班级所有权
2. 更新入班状态为 `REVOKED`
3. 记录审计日志

---

### 4. 学生退出班级

#### 接口定义

```http
POST /classes/{classId}/leave
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "reason": "个人原因"  // 可选
}
```

#### 响应格式

```json
{
  "message": "已成功退出班级",
  "classId": "class-uuid",
  "className": "初一(3)班",
  "teacher": {
    "id": "teacher-uuid",
    "displayName": "张老师"
  }
}
```

#### 权限要求

- 角色: `student`
- 权限: `VIEW_OWN_AUDIT`

#### 业务逻辑

1. 验证学生身份
2. 检查学生是否在该班级中
3. 更新入班状态为 `REVOKED`
4. 撤销相关关系（status=revoked, revokedAt=now）
5. 撤销相关授权（status=revoked）
6. 记录审计日志

---

### 5. 获取教师班级列表

#### 接口定义

```http
GET /classes/my-classes
Authorization: Bearer {teacher_token}
```

#### 响应格式

```json
[
  {
    "id": "class-uuid",
    "name": "初一(3)班",
    "description": "编程入门班级",
    "code": "A1B2C3",
    "status": "ACTIVE",
    "studentCount": 25,
    "pendingCount": 3,
    "students": [
      {
        "id": "student-uuid",
        "displayName": "小明",
        "nickname": "小明",
        "school": "北京市第一中学",
        "className": "初一(3)班"
      }
    ],
    "createdAt": "2024-01-03T10:00:00Z",
    "inviteUrl": "/classes/join/A1B2C3"
  }
]
```

#### 权限要求

- 角色: `teacher`
- 权限: `MANAGE_CLASS`

---

### 6. 获取学生班级列表

#### 接口定义

```http
GET /classes/student-classes
Authorization: Bearer {student_token}
```

#### 响应格式

```json
[
  {
    "id": "enrollment-uuid",
    "class": {
      "id": "class-uuid",
      "name": "初一(3)班",
      "description": "编程入门班级",
      "code": "A1B2C3",
      "teacher": {
        "id": "teacher-uuid",
        "displayName": "张老师",
        "email": "teacher@example.com"
      }
    },
    "status": "ACTIVE",
    "joinedAt": "2024-01-03T10:00:00Z"
  }
]
```

#### 权限要求

- 角色: `student`
- 权限: `VIEW_OWN_AUDIT`

---

### 7. 获取班级待审批学生

#### 接口定义

```http
GET /classes/{classId}/pending-enrollments
Authorization: Bearer {teacher_token}
```

#### 响应格式

```json
[
  {
    "id": "enrollment-uuid",
    "student": {
      "id": "student-uuid",
      "displayName": "小红",
      "nickname": "小红",
      "school": "北京市第一中学",
      "className": "初一(3)班",
      "email": "student@example.com"
    },
    "requestedAt": "2024-01-03T10:00:00Z"
  }
]
```

#### 权限要求

- 角色: `teacher`
- 权限: `MANAGE_CLASS`

---

### 8. 通过邀请码获取班级信息

#### 接口定义

```http
GET /classes/invite/code/{code}
```

#### 响应格式

```json
{
  "id": "class-uuid",
  "name": "初一(3)班",
  "description": "编程入门班级",
  "code": "A1B2C3",
  "teacher": {
    "id": "teacher-uuid",
    "displayName": "张老师",
    "email": "teacher@example.com"
  },
  "studentCount": 25,
  "status": "ACTIVE",
  "createdAt": "2024-01-03T10:00:00Z"
}
```

#### 权限要求

- 无需认证（公开接口）

---

### 9. 学生授权中心概览

#### 接口定义

```http
GET /students/authorization-center/overview
Authorization: Bearer {student_token}
```

#### 响应格式

```json
{
  "pendingRequests": 2,
  "activeRelationships": 5,
  "classCount": 3,
  "recentActivities": [
    {
      "action": "approve_relationship_request",
      "timestamp": "2024-01-03T10:00:00Z",
      "metadata": {
        "requesterId": "parent-uuid",
        "scopes": ["progress:read", "works:read"]
      }
    }
  ]
}
```

#### 权限要求

- 角色: `student`
- 权限: `REVOKE_RELATIONSHIPS`

---

### 10. 学生退出班级（授权中心）

#### 接口定义

```http
POST /students/authorization-center/leave-class/{classId}
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "reason": "个人原因"  // 可选
}
```

#### 响应格式

```json
{
  "message": "已成功退出班级",
  "className": "初一(3)班",
  "teacher": {
    "id": "teacher-uuid",
    "displayName": "张老师"
  }
}
```

#### 权限要求

- 角色: `student`
- 权限: `REVOKE_RELATIONSHIPS`

## 数据模型

### 班级表 (classes)

```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_teacher_id UUID REFERENCES users(id),
    code VARCHAR(20) UNIQUE NOT NULL,  -- 邀请码
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 班级注册表 (class_enrollments)

```sql
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    student_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, ACTIVE, REVOKED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);
```

### 关系表 (relationships)

```sql
CREATE TABLE relationships (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES users(id),
    party_id UUID REFERENCES users(id),
    party_role VARCHAR(20) NOT NULL,  -- PARENT, TEACHER
    source VARCHAR(20) NOT NULL,      -- SHARE_CODE, SEARCH, CLASS_INVITE
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, party_id)
);
```

### 访问授权表 (access_grants)

```sql
CREATE TABLE access_grants (
    id UUID PRIMARY KEY,
    grantee_id UUID REFERENCES users(id),
    student_id UUID REFERENCES users(id),
    scope TEXT[] NOT NULL,  -- ["progress:read", "metrics:read", "works:read"]
    status VARCHAR(20) DEFAULT 'ACTIVE',
    expires_at TIMESTAMP,
    relationship_id UUID REFERENCES relationships(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 权限范围

### 教师自动获得的权限

当学生被批准加入班级后，教师自动获得以下权限：

- `progress:read` - 查看学习进度
- `metrics:read` - 查看指标数据
- `works:read` - 查看作品

### 权限特点

- **自动授予**: 无需学生额外同意
- **班级范围**: 仅限班级内学生
- **只读权限**: 教师只能查看，不能修改学生数据
- **关系驱动**: 退出班级后权限自动撤销

## 审计日志

### 关键操作审计

所有关键操作都会记录审计日志：

1. **创建班级**: `create_class`
2. **加入班级**: `join_class_request`
3. **审批入班**: `approve_class_enrollment` / `reject_class_enrollment`
4. **退出班级**: `leave_class`
5. **撤销关系**: `revoke_relationship`

### 审计字段

```json
{
  "actorId": "user-uuid",
  "action": "approve_class_enrollment",
  "targetType": "class_enrollment",
  "targetId": "enrollment-uuid",
  "metadata": {
    "studentId": "student-uuid",
    "className": "初一(3)班",
    "relationshipId": "relationship-uuid",
    "accessGrantId": "access-grant-uuid",
    "grantedScopes": ["progress:read", "metrics:read", "works:read"]
  },
  "ts": "2024-01-03T10:00:00Z"
}
```

## 错误处理

### 常见错误码

- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 权限不足
- `404 Not Found` - 资源不存在
- `409 Conflict` - 资源冲突（如已加入班级）

### 错误响应格式

```json
{
  "error": {
    "code": "CLASS_ALREADY_JOINED",
    "message": "您已经在该班级中",
    "details": {
      "classId": "class-uuid",
      "status": "ACTIVE"
    }
  }
}
```

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 开发团队
