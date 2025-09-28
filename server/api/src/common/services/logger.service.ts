import { Injectable } from '@nestjs/common';

export interface LogEntry {
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  traceId?: string;
  userId?: string;
  execId?: string;
  durationMs?: number;
  route?: string;
  meta?: Record<string, any>;
}

export interface AuditEntry {
  ts: string;
  action: string;
  userId?: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LoggerService {
  private generateTraceId(): string {
    return `trc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private formatAuditEntry(entry: AuditEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * 记录结构化日志
   */
  log(level: LogEntry['level'], msg: string, meta?: Record<string, any>): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      msg,
      traceId: this.generateTraceId(),
      meta
    };

    console.log(this.formatLogEntry(entry));
  }

  /**
   * 记录带用户信息的日志
   */
  logWithUser(
    level: LogEntry['level'], 
    msg: string, 
    userId: string, 
    meta?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      msg,
      traceId: this.generateTraceId(),
      userId,
      meta
    };

    console.log(this.formatLogEntry(entry));
  }

  /**
   * 记录带执行信息的日志
   */
  logWithExecution(
    level: LogEntry['level'],
    msg: string,
    execId: string,
    durationMs: number,
    meta?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      msg,
      traceId: this.generateTraceId(),
      execId,
      durationMs,
      meta
    };

    console.log(this.formatLogEntry(entry));
  }

  /**
   * 记录路由访问日志
   */
  logRoute(
    method: string,
    url: string,
    durationMs: number,
    userId?: string,
    meta?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level: 'info',
      msg: 'route_access',
      traceId: this.generateTraceId(),
      userId,
      durationMs,
      route: `${method} ${url}`,
      meta
    };

    console.log(this.formatLogEntry(entry));
  }

  /**
   * 记录审计日志
   */
  audit(
    action: string,
    resource: string,
    userId?: string,
    resourceId?: string,
    details?: Record<string, any>,
    ip?: string,
    userAgent?: string
  ): void {
    const entry: AuditEntry = {
      ts: new Date().toISOString(),
      action,
      userId,
      resource,
      resourceId,
      details,
      ip,
      userAgent
    };

    // 审计日志使用特殊的标识符
    console.log(`[AUDIT] ${this.formatAuditEntry(entry)}`);
  }

  /**
   * 记录代码执行审计
   */
  auditCodeExecution(
    userId: string,
    levelId: string,
    code: string,
    result: any,
    ip?: string,
    userAgent?: string
  ): void {
    this.audit(
      'code_execution',
      'level',
      userId,
      levelId,
      {
        codeLength: code.length,
        result: {
          exitCode: result.exitCode,
          hasError: result.stderr.length > 0,
          durationMs: result.timeMs
        }
      },
      ip,
      userAgent
    );
  }

  /**
   * 记录判题审计
   */
  auditJudging(
    userId: string,
    levelId: string,
    gameType: string,
    passed: boolean,
    ip?: string,
    userAgent?: string
  ): void {
    this.audit(
      'judging',
      'level',
      userId,
      levelId,
      {
        gameType,
        passed,
        timestamp: new Date().toISOString()
      },
      ip,
      userAgent
    );
  }

  /**
   * 记录数据导出审计
   */
  auditDataExport(
    userId: string,
    exportType: string,
    resourceId?: string,
    ip?: string,
    userAgent?: string
  ): void {
    this.audit(
      'data_export',
      exportType,
      userId,
      resourceId,
      {
        exportType,
        timestamp: new Date().toISOString()
      },
      ip,
      userAgent
    );
  }

  /**
   * 记录设置变更审计
   */
  auditSettingsChange(
    userId: string,
    settingType: string,
    oldValue: any,
    newValue: any,
    ip?: string,
    userAgent?: string
  ): void {
    this.audit(
      'settings_change',
      'user_settings',
      userId,
      undefined,
      {
        settingType,
        oldValue,
        newValue,
        timestamp: new Date().toISOString()
      },
      ip,
      userAgent
    );
  }
}
