import {
  Injectable,
  ArgumentsHost,
  ExceptionFilter,
  Catch,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StructuredLoggerService } from './structured-logger.service';

// Extended request interface for our application
interface ExtendedRequest extends Request {
  cid?: string;
  user?: {
    userId: string;
    role: string;
  };
  svc?: Record<string, unknown>;
}

@Catch()
@Injectable()
export class ErrorMiddleware implements ExceptionFilter {
  constructor(private readonly logger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<ExtendedRequest>();

    // Get correlation ID from request
    const cid = request.cid || 'unknown';

    // Get user info if available
    const _userId = request.user?.userId || 'anonymous';
    const userRole = request.user?.role || 'unknown';

    // Prepare error details
    const errorDetails = {
      message:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      code: exception instanceof HttpException ? exception.getStatus() : 500,
    };

    // Log the error with full context using structured logger
    this.logger.logError(
      cid,
      request,
      exception instanceof Error ? exception : new Error(String(exception)),
      {
        code: errorDetails.code,
      },
    );

    // Send error response
    response.status(errorDetails.code).json({
      statusCode: errorDetails.code,
      message: errorDetails.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
