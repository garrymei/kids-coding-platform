import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // 跳过健康检查和公开路由
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authorization token is required',
        cid: this.generateCorrelationId(),
      });
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;

      // 检查token是否过期
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new UnauthorizedException({
          code: 'TOKEN_EXPIRED',
          message: 'Authorization token has expired',
          cid: this.generateCorrelationId(),
        });
      }

      // 将用户信息附加到请求对象
      req.user = payload;

      // 设置WWW-Authenticate头
      res.setHeader('WWW-Authenticate', 'Bearer');

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException({
          code: 'INVALID_TOKEN',
          message: 'Invalid authorization token',
          cid: this.generateCorrelationId(),
        });
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException({
          code: 'TOKEN_EXPIRED',
          message: 'Authorization token has expired',
          cid: this.generateCorrelationId(),
        });
      }

      throw new UnauthorizedException({
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        cid: this.generateCorrelationId(),
      });
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 也支持从查询参数获取token（用于WebSocket等场景）
    const queryToken = req.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }

  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/health',
      '/metrics',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/levels', // 关卡列表可以公开访问
      '/docs',
      '/static',
    ];

    return publicRoutes.some((route) => path.startsWith(route));
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// JWT工具类
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * 生成JWT token
   */
  generateToken(payload: { userId: string; role: string }): string {
    const options = { expiresIn: this.expiresIn };
    return jwt.sign(payload, this.secret, options as jwt.SignOptions);
  }

  /**
   * 生成刷新token
   */
  generateRefreshToken(payload: { userId: string; role: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: '7d' });
  }

  /**
   * 验证token
   */
  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }

  /**
   * 解码token（不验证）
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
