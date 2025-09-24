import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

// 审计装饰器
export const Audit = (action: string, targetType: string, metadata?: Record<string, any>) =>
  SetMetadata(AUDIT_KEY, { action, targetType, metadata });

// 数据访问审计装饰器
export const AuditDataAccess = (dataType: string, metadata?: Record<string, any>) =>
  Audit('view_student_data', 'student', { dataType, ...metadata });

// 权限变更审计装饰器
export const AuditPermissionChange = (changeType: 'grant' | 'revoke' | 'update', metadata?: Record<string, any>) =>
  Audit('permission_change', 'user', { changeType, ...metadata });

// 关系变更审计装饰器
export const AuditRelationshipChange = (changeType: 'create' | 'update' | 'revoke', metadata?: Record<string, any>) =>
  Audit('relationship_change', 'relationship', { changeType, ...metadata });

// 搜索审计装饰器
export const AuditSearch = (searchType: string, metadata?: Record<string, any>) =>
  Audit('search_students', 'search', { searchType, ...metadata });

// 申请审计装饰器
export const AuditRequest = (requestType: 'create' | 'approve' | 'reject', metadata?: Record<string, any>) =>
  Audit(`relationship_request_${requestType}`, 'consent', { requestType, ...metadata });
