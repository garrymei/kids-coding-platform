import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as DOMPurify from 'isomorphic-dompurify';

interface ValidationConfig {
  maxLength: number;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  private readonly configs: Map<string, ValidationConfig> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs(): void {
    // 代码执行请求验证
    this.configs.set('/execute', {
      maxLength: 10000, // 10KB代码限制
    });

    // 用户输入验证
    this.configs.set('/users', {
      maxLength: 1000,
      allowedTags: ['b', 'i', 'em', 'strong'],
      allowedAttributes: ['class'],
    });

    // 文件上传验证
    this.configs.set('/upload', {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/json',
      ],
    });

    // 评论和反馈验证
    this.configs.set('/comments', {
      maxLength: 2000,
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      allowedAttributes: ['class'],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // 验证请求体
      if (req.body && Object.keys(req.body).length > 0) {
        this.validateRequestBody(req);
      }

      // 验证查询参数
      if (req.query && Object.keys(req.query).length > 0) {
        this.validateQueryParams(req);
      }

      // 验证路径参数
      if (req.params && Object.keys(req.params).length > 0) {
        this.validatePathParams(req);
      }

      // 验证文件上传
      if (req.files) {
        this.validateFileUpload(req);
      }

      next();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        cid: this.generateCorrelationId(),
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private validateRequestBody(req: Request): void {
    const config = this.getConfigForRoute(req.path);
    if (!config) return;

    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        // 检查长度
        if (config.maxLength && value.length > config.maxLength) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Field '${key}' exceeds maximum length of ${config.maxLength}`,
            cid: this.generateCorrelationId(),
            details: { path: key, maxLength: config.maxLength, actualLength: value.length },
          });
        }

        // 清理HTML内容
        if (config.allowedTags || config.allowedAttributes) {
          req.body[key] = this.sanitizeHtml(value, config);
        }

        // 检查恶意内容
        if (this.containsMaliciousContent(value)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Field '${key}' contains potentially malicious content`,
            cid: this.generateCorrelationId(),
            details: { path: key },
          });
        }
      }

      // 递归验证嵌套对象
      if (typeof value === 'object' && value !== null) {
        this.validateNestedObject(value, key, config);
      }
    }
  }

  private validateQueryParams(req: Request): void {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // 检查长度
        if (value.length > 1000) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Query parameter '${key}' exceeds maximum length`,
            cid: this.generateCorrelationId(),
            details: { path: key, maxLength: 1000, actualLength: value.length },
          });
        }

        // 检查恶意内容
        if (this.containsMaliciousContent(value)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Query parameter '${key}' contains potentially malicious content`,
            cid: this.generateCorrelationId(),
            details: { path: key },
          });
        }
      }
    }
  }

  private validatePathParams(req: Request): void {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        // 检查长度
        if (value.length > 100) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Path parameter '${key}' exceeds maximum length`,
            cid: this.generateCorrelationId(),
            details: { path: key, maxLength: 100, actualLength: value.length },
          });
        }

        // 检查格式（ID应该是字母数字）
        if (key.includes('Id') && !/^[a-zA-Z0-9_-]+$/.test(value)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Path parameter '${key}' has invalid format`,
            cid: this.generateCorrelationId(),
            details: { path: key, expectedFormat: 'alphanumeric with hyphens and underscores' },
          });
        }
      }
    }
  }

  private validateFileUpload(req: Request): void {
    const config = this.getConfigForRoute(req.path);
    if (!config || !config.maxFileSize || !config.allowedMimeTypes) {
      return;
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
    for (const file of files) {
      // 检查文件大小
      if (file.size > config.maxFileSize) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `File '${file.originalname}' exceeds maximum size`,
          cid: this.generateCorrelationId(),
          details: { 
            filename: file.originalname,
            maxSize: config.maxFileSize,
            actualSize: file.size 
          },
        });
      }

      // 检查MIME类型
      if (!config.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `File '${file.originalname}' has unsupported type`,
          cid: this.generateCorrelationId(),
          details: { 
            filename: file.originalname,
            allowedTypes: config.allowedMimeTypes,
            actualType: file.mimetype 
          },
        });
      }

      // 检查文件名
      if (this.containsMaliciousContent(file.originalname)) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `File '${file.originalname}' has potentially malicious name`,
          cid: this.generateCorrelationId(),
          details: { filename: file.originalname },
        });
      }
    }
  }

  private validateNestedObject(obj: any, path: string, config: ValidationConfig): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = `${path}.${key}`;
      
      if (typeof value === 'string') {
        if (config.maxLength && value.length > config.maxLength) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Field '${currentPath}' exceeds maximum length`,
            cid: this.generateCorrelationId(),
            details: { path: currentPath, maxLength: config.maxLength },
          });
        }
      }

      if (typeof value === 'object' && value !== null) {
        this.validateNestedObject(value, currentPath, config);
      }
    }
  }

  private sanitizeHtml(html: string, config: ValidationConfig): string {
    const options: any = {};
    
    if (config.allowedTags) {
      options.ALLOWED_TAGS = config.allowedTags;
    }
    
    if (config.allowedAttributes) {
      options.ALLOWED_ATTR = config.allowedAttributes;
    }

    return DOMPurify.sanitize(html, options);
  }

  private containsMaliciousContent(content: string): boolean {
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /<meta[^>]*>.*?<\/meta>/gi,
      /\.\.\//g, // 路径遍历
      /\.\.\\/g, // Windows路径遍历
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  private getConfigForRoute(path: string): ValidationConfig | null {
    for (const [route, config] of this.configs) {
      if (path.startsWith(route)) {
        return config;
      }
    }
    return null;
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
