import { Injectable, NestMiddleware, ArgumentsHost, ExceptionFilter, Catch, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { StructuredLoggerService } from './structured-logger.service';

@Catch()
@Injectable()
export class ErrorMiddleware implements ExceptionFilter {
  constructor(private readonly logger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Get correlation ID from request
    const cid = (request as any).cid || 'unknown';
    
    // Get user info if available
    const userId = (request as any).user?.userId || 'anonymous';
    const userRole = (request as any).user?.role || 'unknown';

    // Prepare error details
    const errorDetails = {
      message: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      code: exception instanceof HttpException ? exception.getStatus() : 500,
    };

    // Log the error with full context using structured logger
    this.logger.logError(cid, request, exception instanceof Error ? exception : new Error(String(exception)), {
      code: errorDetails.code,
    });

    // Send error response
    response.status(errorDetails.code).json({
      statusCode: errorDetails.code,
      message: errorDetails.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}