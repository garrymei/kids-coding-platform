# RBAC 约束清单 (Role-Based Access Control Matrix)

## 概述

本文档定义了儿童编程平台的基于角色的访问控制矩阵，确保所有路由和功能都有明确的权限控制。所有 PR 必须引用此清单进行权限验证。

## 角色定义

### 系统角色

1. **STUDENT (学生)**
   - 主要用户，进行编程学习
   - 可以管理自己的数据和授权

2. **PARENT (家长)**
   - 学生的监护人
   - 需要学生授权才能查看数据

3. **TEACHER (教师)**
   - 教学人员
   - 通过班级管理学生

4. **ADMIN (管理员)**
   - 系统管理员
   - 拥有最高权限

## 权限矩阵

### 用户管理模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/users/profile` | GET | ✅ | ✅ | ✅ | ✅ | 查看自己的个人信息 |
| `/users/profile` | PUT | ✅ | ✅ | ✅ | ✅ | 更新自己的个人信息 |
| `/users/{id}` | GET | ❌ | ❌ | ❌ | ✅ | 查看其他用户信息 |
| `/users/{id}` | PUT | ❌ | ❌ | ❌ | ✅ | 更新其他用户信息 |
| `/users/{id}` | DELETE | ❌ | ❌ | ❌ | ✅ | 删除用户 |
| `/users` | GET | ❌ | ❌ | ❌ | ✅ | 查看用户列表 |

### 认证模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/auth/login` | POST | ✅ | ✅ | ✅ | ✅ | 用户登录 |
| `/auth/logout` | POST | ✅ | ✅ | ✅ | ✅ | 用户登出 |
| `/auth/refresh` | POST | ✅ | ✅ | ✅ | ✅ | 刷新令牌 |
| `/auth/register` | POST | ✅ | ✅ | ✅ | ✅ | 用户注册 |
| `/auth/forgot-password` | POST | ✅ | ✅ | ✅ | ✅ | 忘记密码 |
| `/auth/reset-password` | POST | ✅ | ✅ | ✅ | ✅ | 重置密码 |

### 班级管理模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/classes` | GET | ❌ | ❌ | ✅ | ✅ | 查看班级列表 |
| `/classes` | POST | ❌ | ❌ | ✅ | ✅ | 创建班级 |
| `/classes/{id}` | GET | ❌ | ❌ | ✅ | ✅ | 查看班级详情 |
| `/classes/{id}` | PUT | ❌ | ❌ | ✅ | ✅ | 更新班级信息 |
| `/classes/{id}` | DELETE | ❌ | ❌ | ✅ | ✅ | 删除班级 |
| `/classes/join` | POST | ✅ | ❌ | ❌ | ❌ | 学生加入班级 |
| `/classes/my-classes` | GET | ✅ | ❌ | ❌ | ❌ | 查看我的班级 |
| `/classes/{id}/approve` | POST | ❌ | ❌ | ✅ | ✅ | 批准学生入班 |
| `/classes/{id}/reject` | POST | ❌ | ❌ | ✅ | ✅ | 拒绝学生入班 |
| `/classes/{id}/leave` | POST | ✅ | ❌ | ❌ | ❌ | 学生退出班级 |

### 关系管理模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/relationships/request-parent-access` | POST | ❌ | ✅ | ❌ | ❌ | 家长申请查看学生数据 |
| `/relationships/request-teacher-access` | POST | ❌ | ❌ | ✅ | ❌ | 教师申请查看学生数据 |
| `/relationships/respond-to-request` | POST | ✅ | ❌ | ❌ | ❌ | 学生响应访问请求 |
| `/relationships/pending-requests` | GET | ✅ | ❌ | ❌ | ❌ | 查看待处理请求 |
| `/relationships/my-relationships` | GET | ✅ | ✅ | ✅ | ✅ | 查看我的关系 |
| `/relationships/relationships/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | 更新关系状态 |
| `/relationships/access-grants/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | 更新访问授权 |
| `/relationships/access-grants/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | 撤销访问授权 |
| `/relationships/accessible-students` | GET | ❌ | ✅ | ✅ | ✅ | 查看可访问的学生 |
| `/relationships/check-access/{studentId}` | GET | ❌ | ✅ | ✅ | ✅ | 检查访问权限 |

### 课程管理模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/courses` | GET | ✅ | ❌ | ✅ | ✅ | 查看课程列表 |
| `/courses` | POST | ❌ | ❌ | ✅ | ✅ | 创建课程 |
| `/courses/{id}` | GET | ✅ | ❌ | ✅ | ✅ | 查看课程详情 |
| `/courses/{id}` | PUT | ❌ | ❌ | ✅ | ✅ | 更新课程信息 |
| `/courses/{id}` | DELETE | ❌ | ❌ | ✅ | ✅ | 删除课程 |
| `/courses/{id}/enroll` | POST | ✅ | ❌ | ❌ | ❌ | 学生报名课程 |
| `/courses/my-courses` | GET | ✅ | ❌ | ❌ | ❌ | 查看我的课程 |

### 学生数据模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/students/{id}/data` | GET | ✅* | ✅* | ✅* | ✅ | 查看学生数据 |
| `/students/{id}/progress` | GET | ✅* | ✅* | ✅* | ✅ | 查看学习进度 |
| `/students/{id}/works` | GET | ✅* | ✅* | ✅* | ✅ | 查看学生作品 |
| `/students/{id}/badges` | GET | ✅* | ✅* | ✅* | ✅ | 查看学生徽章 |
| `/students/{id}/courses` | GET | ✅* | ✅* | ✅* | ✅ | 查看学生课程 |

*注：需要相应的访问授权

### 作品管理模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/works` | GET | ✅ | ❌ | ✅ | ✅ | 查看作品列表 |
| `/works` | POST | ✅ | ❌ | ❌ | ❌ | 创建作品 |
| `/works/{id}` | GET | ✅ | ✅* | ✅* | ✅ | 查看作品详情 |
| `/works/{id}` | PUT | ✅ | ❌ | ❌ | ❌ | 更新作品 |
| `/works/{id}` | DELETE | ✅ | ❌ | ❌ | ❌ | 删除作品 |
| `/works/{id}/submit` | POST | ✅ | ❌ | ❌ | ❌ | 提交作品 |
| `/works/{id}/review` | POST | ❌ | ❌ | ✅ | ✅ | 点评作品 |
| `/works/{id}/approve` | POST | ❌ | ❌ | ✅ | ✅ | 批准作品 |

*注：需要相应的访问授权

### 审计日志模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/audit/logs` | GET | ❌ | ❌ | ❌ | ✅ | 查看审计日志 |
| `/audit/logs/export` | POST | ❌ | ❌ | ❌ | ✅ | 导出审计日志 |
| `/audit/logs/statistics` | GET | ❌ | ❌ | ❌ | ✅ | 查看审计统计 |
| `/audit/my-logs` | GET | ✅ | ✅ | ✅ | ✅ | 查看我的操作日志 |

### 系统管理模块

| 路由 | 方法 | STUDENT | PARENT | TEACHER | ADMIN | 说明 |
|------|------|---------|--------|---------|-------|------|
| `/admin/users` | GET | ❌ | ❌ | ❌ | ✅ | 管理用户 |
| `/admin/roles` | GET | ❌ | ❌ | ❌ | ✅ | 管理角色 |
| `/admin/permissions` | GET | ❌ | ❌ | ❌ | ✅ | 管理权限 |
| `/admin/system` | GET | ❌ | ❌ | ❌ | ✅ | 系统配置 |
| `/admin/backup` | POST | ❌ | ❌ | ❌ | ✅ | 系统备份 |
| `/admin/restore` | POST | ❌ | ❌ | ❌ | ✅ | 系统恢复 |

## 权限检查实现

### 装饰器实现

```typescript
// 角色装饰器
@Roles(Role.STUDENT, Role.PARENT)
@Get('my-data')
async getMyData() {
  // 只有学生和家长可以访问
}

// 权限装饰器
@RequirePermission('student:read')
@Get('students/:id')
async getStudent(@Param('id') id: string) {
  // 需要学生读取权限
}

// 资源所有者装饰器
@ResourceOwner('student')
@Put('students/:id')
async updateStudent(@Param('id') id: string) {
  // 只有资源所有者可以访问
}
```

### 守卫实现

```typescript
// 角色守卫
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    
    return requiredRoles.some(role => user.role === role);
  }
}

// 权限守卫
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    
    return user.permissions.includes(requiredPermission);
  }
}
```

### 中间件实现

```typescript
// 权限检查中间件
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};
```

## 特殊权限规则

### 数据访问权限

1. **学生数据访问**
   - 学生本人：完全访问
   - 家长：需要明确授权
   - 教师：需要班级关系
   - 管理员：完全访问

2. **班级数据访问**
   - 班级教师：完全访问
   - 班级学生：只读访问
   - 其他用户：无访问权限

3. **作品数据访问**
   - 作品作者：完全访问
   - 班级教师：点评权限
   - 授权用户：只读访问

### 动态权限检查

```typescript
// 动态权限检查示例
@Injectable()
export class DataAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;
    
    // 检查是否有访问权限
    const hasAccess = await this.relationshipService.checkAccessPermission(
      user.id,
      resourceId,
      'progress:read'
    );
    
    return hasAccess;
  }
}
```

## 权限测试

### 单元测试

```typescript
describe('RBAC Guards', () => {
  it('should allow student to access their own data', async () => {
    const user = { id: '1', role: 'STUDENT' };
    const request = { user, params: { id: '1' } };
    
    const canActivate = await dataAccessGuard.canActivate({
      switchToHttp: () => ({ getRequest: () => request })
    } as ExecutionContext);
    
    expect(canActivate).toBe(true);
  });
  
  it('should deny parent access without authorization', async () => {
    const user = { id: '2', role: 'PARENT' };
    const request = { user, params: { id: '1' } };
    
    const canActivate = await dataAccessGuard.canActivate({
      switchToHttp: () => ({ getRequest: () => request })
    } as ExecutionContext);
    
    expect(canActivate).toBe(false);
  });
});
```

### 集成测试

```typescript
describe('RBAC Integration', () => {
  it('should enforce role-based access control', async () => {
    // 测试不同角色的访问权限
    const studentToken = await getAuthToken('student');
    const parentToken = await getAuthToken('parent');
    const teacherToken = await getAuthToken('teacher');
    
    // 学生可以访问自己的数据
    await request(app)
      .get('/students/1/data')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    
    // 家长无授权不能访问
    await request(app)
      .get('/students/1/data')
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(403);
    
    // 教师无班级关系不能访问
    await request(app)
      .get('/students/1/data')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(403);
  });
});
```

## 权限审计

### 权限变更记录

```typescript
// 权限变更审计
@Injectable()
export class PermissionAuditService {
  async logPermissionChange(
    actorId: string,
    targetUserId: string,
    oldPermissions: string[],
    newPermissions: string[],
    reason: string
  ) {
    await this.auditService.log({
      actorId,
      action: 'permission_change',
      targetType: 'user',
      targetId: targetUserId,
      metadata: {
        oldPermissions,
        newPermissions,
        reason,
        changes: this.calculateChanges(oldPermissions, newPermissions)
      }
    });
  }
}
```

### 权限使用监控

```typescript
// 权限使用监控
@Injectable()
export class PermissionMonitorService {
  async trackPermissionUsage(userId: string, permission: string, resource: string) {
    await this.auditService.log({
      actorId: userId,
      action: 'permission_usage',
      targetType: 'resource',
      targetId: resource,
      metadata: {
        permission,
        resource,
        timestamp: new Date()
      }
    });
  }
}
```

## 合规要求

### 最小权限原则

1. **默认拒绝**
   - 所有权限默认拒绝
   - 需要明确授权才能访问

2. **最小必要权限**
   - 只授予必要的权限
   - 定期审查和清理权限

3. **权限分离**
   - 不同角色权限分离
   - 避免权限集中

### 权限生命周期管理

1. **权限创建**
   - 明确授权理由
   - 设置过期时间
   - 记录授权过程

2. **权限使用**
   - 监控权限使用
   - 记录访问日志
   - 检测异常使用

3. **权限撤销**
   - 及时撤销过期权限
   - 记录撤销原因
   - 验证撤销效果

## 更新维护

### 权限矩阵更新

1. **新增功能时**
   - 更新权限矩阵
   - 添加新的权限检查
   - 更新测试用例

2. **修改功能时**
   - 审查权限变更
   - 更新相关文档
   - 通知相关团队

3. **删除功能时**
   - 清理相关权限
   - 更新权限矩阵
   - 清理测试用例

### 定期审查

1. **月度审查**
   - 检查权限使用情况
   - 识别未使用权限
   - 优化权限分配

2. **季度审查**
   - 审查权限矩阵完整性
   - 检查权限实现正确性
   - 更新合规要求

3. **年度审查**
   - 全面审查权限架构
   - 评估安全风险
   - 制定改进计划

---

**文档版本**: v1.0  
**最后更新**: 2024-01-02  
**维护人员**: 安全团队  
**下次审查**: 2024-04-02
