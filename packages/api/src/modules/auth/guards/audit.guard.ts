import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditLoggerService } from '../../audit/services/audit-logger.service';

@Injectable()
export class AuditGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditLogger: AuditLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const auditConfig = this.reflector.getAllAndOverride<any>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditConfig) {
      return true; // 没有审计要求，直接通过
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // 未认证用户，跳过审计
    }

    // 异步记录审计日志，不阻塞请求
    this.recordAuditLog(user, request, auditConfig).catch(error => {
      console.error('Failed to record audit log:', error);
    });

    return true;
  }

  private async recordAuditLog(user: any, request: any, auditConfig: any): Promise<void> {
    try {
      const { action, targetType, metadata = {} } = auditConfig;
      
      // 从请求中提取目标ID
      const targetId = this.extractTargetId(request, targetType);
      
      // 合并元数据
      const auditMetadata = {
        ...metadata,
        method: request.method,
        url: request.url,
        ip: request.ip || request.connection.remoteAddress,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString(),
      };

      // 根据不同的审计类型记录日志
      switch (action) {
        case 'view_student_data':
          await this.auditLogger.logDataAccess(
            user.userId,
            targetId,
            metadata.dataType,
            auditMetadata
          );
          break;
        
        case 'permission_change':
          await this.auditLogger.logPermissionChange(
            user.userId,
            targetId,
            metadata.changeType,
            metadata.oldPermissions || [],
            metadata.newPermissions || [],
            metadata.reason
          );
          break;
        
        case 'relationship_change':
          await this.auditLogger.logRelationshipChange(
            user.userId,
            targetId,
            metadata.changeType,
            metadata.oldStatus,
            metadata.newStatus,
            auditMetadata
          );
          break;
        
        case 'search_students':
          await this.auditLogger.logSearch(
            user.userId,
            metadata.searchType,
            metadata.keyword || '',
            metadata.resultCount || 0,
            auditMetadata
          );
          break;
        
        case 'relationship_request_create':
        case 'relationship_request_approve':
        case 'relationship_request_reject':
          await this.auditLogger.logRequest(
            user.userId,
            metadata.requestType || action.split('_').pop(),
            targetId,
            auditMetadata
          );
          break;
        
        default:
          // 通用审计日志
          await this.auditLogger.log({
            actorId: user.userId,
            action,
            targetType,
            targetId,
            metadata: auditMetadata,
          });
      }
    } catch (error) {
      console.error('Error recording audit log:', error);
    }
  }

  private extractTargetId(request: any, targetType: string): string {
    // 从请求参数中提取目标ID
    const params = request.params || {};
    const body = request.body || {};
    const query = request.query || {};

    switch (targetType) {
      case 'student':
        return params.studentId || body.studentId || query.studentId || 'unknown';
      
      case 'relationship':
        return params.relationshipId || body.relationshipId || params.consentId || body.consentId || 'unknown';
      
      case 'user':
        return params.userId || body.userId || params.id || body.id || 'unknown';
      
      case 'consent':
        return params.consentId || body.consentId || 'unknown';
      
      case 'access_grant':
        return params.grantId || body.grantId || 'unknown';
      
      case 'search':
        return 'students';
      
      case 'system':
        return 'system';
      
      default:
        return params.id || body.id || 'unknown';
    }
  }
}
