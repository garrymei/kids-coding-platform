import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { Request, Response } from 'express';

// Mask keys for PII protection
const maskKeys = [
  'authorization',
  'phone',
  'email',
  'idcard',
  'password',
  'token',
];

// Extended request interface for our application
export interface ExtendedRequest extends Request {
  cid?: string;
  user?: {
    userId: string;
    role: string;
  };
  svc?: Record<string, unknown>;
}

@Injectable()
export class StructuredLoggerService {
  constructor(private readonly logger: Logger) {}

  // Mask sensitive data in objects
  private maskSensitiveData(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskSensitiveData(item));
    }

    const maskedObj = { ...(obj as Record<string, unknown>) };

    for (const [key, value] of Object.entries(maskedObj)) {
      const lowerKey = key.toLowerCase();

      // Check if this key should be masked
      if (maskKeys.some((maskKey) => lowerKey.includes(maskKey))) {
        if (typeof value === 'string' && value.length > 0) {
          // Mask the value but keep first and last 3 characters if long enough
          if (value.length > 6) {
            maskedObj[key] =
              `${value.substring(0, 3)}****${value.substring(value.length - 3)}`;
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
  logRequestStart(cid: string, req: ExtendedRequest) {
    this.logger.log({
      ts: new Date().toISOString(),
      cid,
      event: 'request_start',
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.userId,
      headers: this.maskSensitiveData(req.headers),
    });
  }

  logRequestEnd(
    cid: string,
    req: ExtendedRequest,
    res: Response,
    durationMs: number,
    svc?: Record<string, unknown>,
  ) {
    this.logger.log({
      ts: new Date().toISOString(),
      cid,
      event: 'request_end',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.userId,
      contentLength: res.get('Content-Length'),
      svc: svc ? this.maskSensitiveData(svc) : undefined,
    });
  }

  logError(
    cid: string,
    req: ExtendedRequest,
    error: Error,
    additionalContext?: Record<string, unknown>,
  ) {
    this.logger.error({
      ts: new Date().toISOString(),
      cid,
      event: 'error',
      method: req.method,
      url: req.url,
      userId: req.user?.userId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: additionalContext
        ? this.maskSensitiveData(additionalContext)
        : undefined,
    });
  }

  logWarning(
    cid: string,
    req: ExtendedRequest,
    message: string,
    additionalContext?: Record<string, unknown>,
  ) {
    this.logger.warn({
      ts: new Date().toISOString(),
      cid,
      event: 'warning',
      method: req.method,
      url: req.url,
      userId: req.user?.userId,
      message,
      context: additionalContext
        ? this.maskSensitiveData(additionalContext)
        : undefined,
    });
  }

  logEvent(
    name: string,
    cid: string,
    req: ExtendedRequest,
    payload: Record<string, unknown>,
  ) {
    this.logger.log({
      ts: new Date().toISOString(),
      cid,
      event: name,
      method: req.method,
      url: req.url,
      userId: req.user?.userId,
      payload: this.maskSensitiveData(payload),
    });
  }

  logJudgeResult(
    cid: string,
    req: ExtendedRequest,
    payload: {
      levelId: string;
      strategy: string;
      pass: boolean;
      timeMs: number;
      diff?: unknown;
    },
  ) {
    this.logEvent('judge_result', cid, req, payload);
  }

  logExecuteResult(
    cid: string,
    req: ExtendedRequest,
    payload: {
      lang: string;
      timeMs: number;
      timeout: boolean;
      memMb?: number;
      eventsCount?: number;
    },
  ) {
    this.logEvent('execute_result', cid, req, payload);
  }

  logAuthDecision(
    cid: string,
    req: ExtendedRequest,
    payload: {
      type: 'PARENT_LINK_DECISION' | 'CLASS_MEMBER_DECISION';
      id: string;
      decision: string;
      actorId: string;
    },
  ) {
    this.logEvent('auth_decision', cid, req, payload);
  }

  logExportReport(
    cid: string,
    req: ExtendedRequest,
    payload: {
      studentId: string;
      format: 'pdf' | 'excel';
      durationMs: number;
    },
  ) {
    this.logEvent('export_report', cid, req, payload);
  }
}
