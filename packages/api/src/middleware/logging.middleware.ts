import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: StructuredLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate correlation ID if not present
    const cid = req.headers['x-request-id'] 
      ? Array.isArray(req.headers['x-request-id']) 
        ? req.headers['x-request-id'][0] 
        : req.headers['x-request-id']
      : randomUUID();

    // Add cid to request and response headers
    (req as any).cid = cid;
    res.setHeader('X-Request-Id', cid);

    // Record start time
    const start = Date.now();

    // Log request start
    this.logger.logRequestStart(cid, req);

    // Hook into response finish to log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Add service-specific data if available
      const svc = (req as any).svc;
      
      this.logger.logRequestEnd(cid, req, res, duration, svc);
    });

    next();
  }
}