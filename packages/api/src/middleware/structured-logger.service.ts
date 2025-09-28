import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

// Mask keys for PII protection
const maskKeys = ['authorization', 'phone', 'email', 'idcard', 'password', 'token'];

@Injectable()
export class StructuredLoggerService {
  constructor(private readonly logger: Logger) {}

  // Mask sensitive data in objects
  private maskSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskSensitiveData(item));
    }

    const maskedObj = { ...obj };
    
    for (const [key, value] of Object.entries(maskedObj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if this key should be masked
      if (maskKeys.some(maskKey => lowerKey.includes(maskKey))) {
        if (typeof value === 'string' && value.length > 0) {
          // Mask the value but keep first and last 3 characters if long enough
          if (value.length > 6) {
            maskedObj[key] = `${value.substring(0, 3)}****${value.substring(value.length - 3)}`;
          } else {
            maskedObj[key] = '****';
          }
        } else {
          maskedObj[key] = '****';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively mask nested objects
        maskedObj[key] = this.maskSensitiveData(value);
      }
    }
    
    return maskedObj;
  }

  // Log request start
  logRequestStart(cid: string, req: any) {
    this.logger.log({
      ts: new Date().toISOString(),
      level: 'info',
      cid,
      req: {
        ip: req.ip,
        method: req.method,
        path: req.path,
        query: this.maskSensitiveData(req.query),
        uid: req.user?.userId,
        role: req.user?.role,
        ua: req.headers['user-agent'],
      },
    });
  }

  // Log request end
  logRequestEnd(cid: string, req: any, res: any, durationMs: number, svc?: any) {
    this.logger.log({
      ts: new Date().toISOString(),
      level: 'info',
      cid,
      req: {
        ip: req.ip,
        method: req.method,
        path: req.path,
        query: this.maskSensitiveData(req.query),
        uid: req.user?.userId,
        role: req.user?.role,
        ua: req.headers['user-agent'],
      },
      res: {
        status: res.statusCode,
        ms: durationMs,
        bytes: parseInt(res.get('content-length') || '0', 10),
      },
      svc,
    });
  }

  // Log error
  logError(cid: string, req: any, error: Error, additionalContext?: any) {
    this.logger.error({
      ts: new Date().toISOString(),
      level: 'error',
      cid,
      req: {
        ip: req.ip,
        method: req.method,
        path: req.path,
        query: this.maskSensitiveData(req.query),
        uid: req.user?.userId,
        role: req.user?.role,
        ua: req.headers['user-agent'],
      },
      err: {
        message: error.message,
        stack: error.stack,
        ...additionalContext,
      },
    });
  }

  // Log warning
  logWarning(cid: string, req: any, message: string, additionalContext?: any) {
    this.logger.warn({
      ts: new Date().toISOString(),
      level: 'warn',
      cid,
      req: {
        ip: req.ip,
        method: req.method,
        path: req.path,
        query: this.maskSensitiveData(req.query),
        uid: req.user?.userId,
        role: req.user?.role,
        ua: req.headers['user-agent'],
      },
      warn: {
        message,
        ...additionalContext,
      },
    });
  }

  // Log structured events
  logEvent(name: string, cid: string, req: any, payload: any) {
    this.logger.log({
      ts: new Date().toISOString(),
      level: 'info',
      cid,
      req: {
        ip: req.ip,
        method: req.method,
        path: req.path,
        uid: req.user?.userId,
        role: req.user?.role,
      },
      evt: {
        name,
        ...payload,
      },
    });
  }

  // Specialized event loggers
  logJudgeResult(cid: string, req: any, payload: {
    levelId: string;
    strategy: string;
    pass: boolean;
    timeMs: number;
    diff?: any;
  }) {
    this.logEvent('judge_result', cid, req, payload);
  }

  logExecuteResult(cid: string, req: any, payload: {
    lang: string;
    timeMs: number;
    timeout: boolean;
    memMb?: number;
    eventsCount?: number;
  }) {
    this.logEvent('execute_result', cid, req, payload);
  }

  logAuthDecision(cid: string, req: any, payload: {
    type: 'PARENT_LINK_DECISION' | 'CLASS_MEMBER_DECISION';
    id: string;
    decision: string;
    actorId: string;
  }) {
    this.logEvent('auth_decision', cid, req, payload);
  }

  logExportReport(cid: string, req: any, payload: {
    studentId: string;
    format: 'pdf' | 'excel';
    durationMs: number;
  }) {
    this.logEvent('export_report', cid, req, payload);
  }
}