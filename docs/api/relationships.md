# 关系管理API接口契约

## 概述

本文档定义了家长/老师查看学生数据功能的关系管理API接口契约，包括搜索、申请、审批、授权等核心功能。

## 基础信息

- **基础路径**: `/api/relationships`
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
| `RELATIONSHIP_EXISTS`      | 409        | 关系已存在       |
| `RATE_LIMIT_EXCEEDED`      | 429        | 请求频率过高     |
| `VALIDATION_ERROR`         | 400        | 请求参数验证失败 |
| `INTERNAL_ERROR`           | 500        | 服务器内部错误   |

## 搜索相关接口

### 1. 搜索可关注的学生

**接口**: `GET /api/students/search`

**权限**: `parent` | `teacher`

**请求参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `type` | string | 是 | 搜索类型: `name` \| `id` |
| `nickname` | string | 否 | 学生昵称（type=name时必填） |
| `school` | string | 否 | 学校名称 |
| `anonymousId` | string | 否 | 匿名ID（type=id时必填） |

**请求示例**:

```http
GET /api/students/search?type=name&nickname=小明&school=北京市第一中学
Authorization: Bearer {token}
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "student-uuid",
      "anonymousId": "S-8F3K2Q",
      "maskedNickname": "小*",
      "schoolSummary": "北京市第一中学 - 初一(3)班",
      "discoverable": true,
      "canRequest": true
    }
  ]
}
```

### 2. 获取搜索功能说明

**接口**: `GET /api/students/search-explanation`

**权限**: `student`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "title": "搜索功能说明",
    "description": "您可以设置是否允许被家长和老师搜索到",
    "options": [
      {
        "value": "private",
        "label": "完全私有",
        "description": "不可被搜索（默认）"
      },
      {
        "value": "school_only",
        "label": "仅同校可见",
        "description": "只有同校的家长和老师可以搜索到您"
      },
      {
        "value": "anonymous_id",
        "label": "匿名ID可见",
        "description": "只有知道您匿名ID的人可以搜索到您"
      },
      {
        "value": "public",
        "label": "完全公开",
        "description": "平台上的所有家长和老师都可以搜索到您（不推荐）"
      }
    ],
    "warning": {
      "title": "完全公开搜索功能说明",
      "content": [
        "开启后，平台上的所有家长和老师都可以通过搜索找到您",
        "搜索时只会显示您的昵称和学校信息，不会暴露真实姓名",
        "您可以随时关闭此功能，关闭后立即生效"
      ],
      "risks": ["可能被不熟悉的人搜索到", "需要谨慎设置昵称和学校信息", "可能收到更多的关注申请"]
    }
  }
}
```

## 申请相关接口

### 3. 家长申请查看学生数据

**接口**: `POST /api/relationships/request-parent-access`

**权限**: `parent`

**请求体**:

```json
{
  "studentEmail": "student@example.com",
  "purpose": "parent-view",
  "reason": "查看孩子的学习进度",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "consentId": "consent-uuid",
    "studentId": "student-uuid",
    "status": "PENDING",
    "submittedAt": "2024-01-03T10:00:00Z"
  },
  "message": "申请已提交，等待学生审批"
}
```

### 4. 教师申请查看学生数据

**接口**: `POST /api/relationships/request-teacher-access`

**权限**: `teacher`

**请求体**:

```json
{
  "studentEmail": "student@example.com",
  "purpose": "teacher-progress",
  "reason": "查看学生的学习进度",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "consentId": "consent-uuid",
    "studentId": "student-uuid",
    "status": "PENDING",
    "submittedAt": "2024-01-03T10:00:00Z"
  },
  "message": "申请已提交，等待学生审批"
}
```

### 5. 创建关注申请

**接口**: `POST /api/students/follow-request`

**权限**: `parent` | `teacher`

**请求体**:

```json
{
  "studentId": "student-uuid",
  "scopes": ["progress:read", "works:read"],
  "reason": "家长申请查看孩子数据",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "requestId": "request-uuid",
    "status": "PENDING",
    "submittedAt": "2024-01-03T10:00:00Z"
  },
  "message": "关注申请已提交"
}
```

## 审批相关接口

### 6. 学生响应访问请求

**接口**: `POST /api/relationships/respond-to-request`

**权限**: `student`

**请求体**:

```json
{
  "consentId": "consent-uuid",
  "status": "APPROVED",
  "scopes": ["progress:read", "works:read"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "consentId": "consent-uuid",
    "status": "APPROVED",
    "relationshipId": "relationship-uuid",
    "accessGrants": [
      {
        "id": "grant-uuid",
        "scope": ["progress:read"],
        "status": "ACTIVE",
        "expiresAt": "2024-12-31T23:59:59Z"
      }
    ]
  },
  "message": "授权已批准"
}
```

### 7. 获取待处理的访问请求

**接口**: `GET /api/relationships/pending-requests`

**权限**: `student`

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "consentId": "consent-uuid",
      "requester": {
        "id": "parent-uuid",
        "displayName": "张妈妈",
        "email": "parent@example.com",
        "role": "parent"
      },
      "purpose": "parent-view",
      "reason": "查看孩子的学习进度",
      "requestedAt": "2024-01-03T10:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  ]
}
```

## 关系管理接口

### 8. 获取用户的关系列表

**接口**: `GET /api/relationships/my-relationships`

**权限**: `student` | `parent` | `teacher`

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "relationshipId": "relationship-uuid",
      "party": {
        "id": "parent-uuid",
        "displayName": "张妈妈",
        "email": "parent@example.com",
        "role": "parent"
      },
      "status": "ACTIVE",
      "source": "MANUAL",
      "createdAt": "2024-01-03T10:00:00Z",
      "accessGrants": [
        {
          "id": "grant-uuid",
          "scope": ["progress:read"],
          "status": "ACTIVE",
          "expiresAt": "2024-12-31T23:59:59Z"
        }
      ]
    }
  ]
}
```

### 9. 更新关系状态

**接口**: `PUT /api/relationships/relationships/{id}`

**权限**: `student` | `parent` | `teacher`

**请求体**:

```json
{
  "status": "REVOKED"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "relationshipId": "relationship-uuid",
    "status": "REVOKED",
    "updatedAt": "2024-01-03T10:00:00Z"
  },
  "message": "关系状态已更新"
}
```

### 10. 更新访问授权

**接口**: `PUT /api/relationships/access-grants/{id}`

**权限**: `student` | `parent` | `teacher`

**请求体**:

```json
{
  "scopes": ["progress:read"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "grantId": "grant-uuid",
    "scopes": ["progress:read"],
    "expiresAt": "2024-12-31T23:59:59Z",
    "updatedAt": "2024-01-03T10:00:00Z"
  },
  "message": "访问授权已更新"
}
```

### 11. 撤销访问授权

**接口**: `DELETE /api/relationships/access-grants/{id}`

**权限**: `student` | `parent` | `teacher`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "grantId": "grant-uuid",
    "status": "REVOKED",
    "revokedAt": "2024-01-03T10:00:00Z"
  },
  "message": "访问授权已撤销"
}
```

## 权限检查接口

### 12. 获取可访问的学生列表

**接口**: `GET /api/relationships/accessible-students`

**权限**: `parent` | `teacher`

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "studentId": "student-uuid",
      "displayName": "小明",
      "email": "student@example.com",
      "relationshipStatus": "ACTIVE",
      "accessGrants": [
        {
          "scope": ["progress:read"],
          "expiresAt": "2024-12-31T23:59:59Z"
        }
      ]
    }
  ]
}
```

### 13. 检查访问权限

**接口**: `GET /api/relationships/check-access/{studentId}`

**权限**: `parent` | `teacher`

**请求参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `scope` | string | 是 | 权限范围，如 `progress:read` |

**请求示例**:

```http
GET /api/relationships/check-access/student-uuid?scope=progress:read
Authorization: Bearer {token}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "scope": "progress:read",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

## 搜索设置接口

### 14. 更新搜索设置

**接口**: `PUT /api/students/search-settings`

**权限**: `student`

**请求体**:

```json
{
  "discoverable": true,
  "visibility": "school_only",
  "nickname": "小明",
  "school": "北京市第一中学",
  "className": "初一(3)班"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "discoverable": true,
    "visibility": "school_only",
    "anonymousId": "S-8F3K2Q",
    "message": "您已设置为仅同校可见，只有同校的家长和老师可以搜索到您"
  }
}
```

### 15. 获取搜索设置

**接口**: `GET /api/students/search-settings`

**权限**: `student`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "discoverable": true,
    "visibility": "school_only",
    "anonymousId": "S-8F3K2Q",
    "nickname": "小明",
    "school": "北京市第一中学",
    "className": "初一(3)班"
  }
}
```

## 分享码相关接口

### 16. 生成分享码

**接口**: `POST /api/students/share-code`

**权限**: `student`

**请求体**:

```json
{
  "purpose": "parent-invite",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "shareCode": "SHARE-ABC123",
    "qrCodeUrl": "/api/students/share-qr/SHARE-ABC123",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### 17. 通过分享码查找学生

**接口**: `GET /api/students/share-code/{code}`

**权限**: 无（公开接口）

**响应示例**:

```json
{
  "success": true,
  "data": {
    "studentId": "student-uuid",
    "displayName": "小明",
    "school": "北京市第一中学",
    "className": "初一(3)班",
    "canRequest": true
  }
}
```

### 18. 生成分享码二维码

**接口**: `GET /api/students/share-qr/{code}`

**权限**: 无（公开接口）

**响应**: 返回二维码图片

## 限流与安全

### 限流策略

- **搜索请求**: 每分钟最多10次
- **申请请求**: 每分钟最多3次
- **IP限流**: 单个IP每分钟最多100次请求

### 安全措施

- **JWT认证**: 所有接口都需要有效的JWT令牌
- **权限验证**: 验证用户角色和权限
- **数据脱敏**: 搜索结果默认脱敏处理
- **审计日志**: 记录所有操作日志

## 错误处理

### 常见错误场景

1. **认证失败**: 令牌无效或过期
2. **权限不足**: 用户角色不符合要求
3. **参数验证**: 请求参数格式错误
4. **业务逻辑**: 关系已存在、学生不存在等
5. **系统错误**: 数据库连接失败、服务不可用等

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "RELATIONSHIP_EXISTS",
    "message": "您已经与该学生建立了关系",
    "details": {
      "studentId": "student-uuid",
      "existingRelationshipId": "relationship-uuid"
    }
  }
}
```

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: API团队  
**审核状态**: 待审核
