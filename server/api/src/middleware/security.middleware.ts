import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as helmet from 'helmet';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 设置安全头
    this.setSecurityHeaders(res);
    
    // 使用helmet设置额外的安全头
    helmet({
      // 内容安全策略
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // 开发环境需要
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      
      // 防止点击劫持
      frameguard: { action: 'deny' },
      
      // 隐藏X-Powered-By头
      hidePoweredBy: true,
      
      // HSTS (HTTP Strict Transport Security)
      hsts: {
        maxAge: 31536000, // 1年
        includeSubDomains: true,
        preload: true,
      },
      
      // 防止MIME类型嗅探
      noSniff: true,
      
      // XSS保护
      xssFilter: true,
      
      // 引用者策略
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      
      // 权限策略
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: [],
        usb: [],
        magnetometer: [],
        gyroscope: [],
        accelerometer: [],
      },
    })(req, res, next);
  }

  private setSecurityHeaders(res: Response): void {
    // 防止缓存敏感信息
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // 防止信息泄露
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // 服务器信息隐藏
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'Kids-Coding-Platform');
    
    // 跨域安全
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    
    // 防止DNS预取
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    
    // 防止图片拖拽
    res.setHeader('X-Download-Options', 'noopen');
    
    // 防止IE执行下载
    res.setHeader('X-Download-Options', 'noopen');
  }
}
