import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import {
  StructuredLoggerService,
  ExtendedRequest,
} from './structured-logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: StructuredLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const extendedReq = req as ExtendedRequest;

    // Generate correlation ID if not present
    const cid = req.headers['x-request-id']
      ? Array.isArray(req.headers['x-request-id'])
        ? req.headers['x-request-id'][0]
        : req.headers['x-request-id']
      : randomUUID();

    // Add cid to request and response headers
    extendedReq.cid = cid;
    res.setHeader('X-Request-Id', cid);

    // Record start time
    const start = Date.now();

    // Log request start
    this.logger.logRequestStart(cid, extendedReq);

    // Hook into response finish to log response
    res.on('finish', () => {
      const duration = Date.now() - start;

      // Add service-specific data if available
      const svc = extendedReq.svc;

      this.logger.logRequestEnd(cid, extendedReq, res, duration, svc);
    });

    next();
  }
}
