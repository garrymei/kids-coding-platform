import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Rate limiting configuration
const RATE_LIMITS = {
  student: {
    requestsPerMinute: 10,
    burstMultiplier: 2,
  },
  ip: {
    requestsPerMinute: 60,
    burstMultiplier: 2,
  }
};

// Timeout detection configuration
const TIMEOUT_CONFIG = {
  maxConsecutiveTimeouts: 3,
  blockDurationMs: 60000, // 60 seconds
  timeoutThresholdMs: 3000, // 3 seconds
};

// Blacklisted tokens that should be rejected immediately
const BLACKLISTED_TOKENS = [
  'fork',
  'exec',
  'socket',
  '_ctypes',
  'subprocess',
  'spawn',
  'execFile',
  'execSync',
  'spawnSync',
];

// In-memory store for rate limiting (in production, use Redis)
class RateLimiter {
  private inMemoryStore: Map<string, { count: number; resetTime: number }> = new Map();
  private timeoutCountStore: Map<string, { count: number; lastReset: number }> = new Map();
  private blockStore: Map<string, number> = new Map(); // userId -> unblock timestamp

  constructor() {
    // In a real implementation, we would connect to Redis
  }

  async isRateLimited(key: string, limit: number, windowMs: number): Promise<{ 
    allowed: boolean; 
    remaining: number; 
    resetTime: number;
    blocked: boolean;
  }> {
    const now = Date.now();
    const windowSeconds = windowMs / 1000;
    
    // For simplicity, using in-memory store
    // In production, use Redis with expiration
    let record = this.inMemoryStore.get(key);
    
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    record.count += 1;
    this.inMemoryStore.set(key, record);
    
    const remaining = Math.max(0, limit - record.count);
    const blocked = record.count > limit;
    
    return {
      allowed: !blocked,
      remaining,
      resetTime: record.resetTime,
      blocked
    };
  }

  async getTimeoutCount(userId: string): Promise<number> {
    const record = this.timeoutCountStore.get(userId);
    if (!record) return 0;
    
    // Reset count if it's been more than the block duration
    const now = Date.now();
    if (now - record.lastReset > TIMEOUT_CONFIG.blockDurationMs) {
      this.timeoutCountStore.delete(userId);
      return 0;
    }
    
    return record.count;
  }

  async incrementTimeoutCount(userId: string): Promise<number> {
    const now = Date.now();
    let record = this.timeoutCountStore.get(userId);
    
    if (!record) {
      record = { count: 1, lastReset: now };
    } else {
      // Reset count if it's been more than the block duration
      if (now - record.lastReset > TIMEOUT_CONFIG.blockDurationMs) {
        record = { count: 1, lastReset: now };
      } else {
        record.count += 1;
      }
    }
    
    this.timeoutCountStore.set(userId, record);
    return record.count;
  }

  async isBlocked(userId: string): Promise<boolean> {
    const unblockTime = this.blockStore.get(userId);
    if (!unblockTime) return false;
    
    const now = Date.now();
    if (now >= unblockTime) {
      // Unblock time has passed, remove from block store
      this.blockStore.delete(userId);
      return false;
    }
    
    return true;
  }

  async blockUser(userId: string, durationMs: number): Promise<void> {
    const unblockTime = Date.now() + durationMs;
    this.blockStore.set(userId, unblockTime);
  }
  
  async unblockUser(userId: string): Promise<void> {
    this.blockStore.delete(userId);
  }
}

export const rateLimiter = new RateLimiter();

// Rate limiting middleware
export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Check if user is blocked
  if (userId && await rateLimiter.isBlocked(userId)) {
    logger.warn({
      msg: 'ratelimit_block',
      userId,
      ip,
      reason: 'user_blocked_due_to_timeouts'
    });
    
    res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'User is temporarily blocked due to repeated timeouts. Please check for infinite loops.',
      code: 'TIMEOUT_BLOCK'
    });
    return;
  }

  // Apply rate limits
  if (userId) {
    const userLimit = RATE_LIMITS.student.requestsPerMinute * RATE_LIMITS.student.burstMultiplier;
    const userResult = await rateLimiter.isRateLimited(`user:${userId}`, userLimit, 60000);
    
    if (!userResult.allowed) {
      logger.warn({
        msg: 'ratelimit_block',
        userId,
        ip,
        limit: userLimit,
        remaining: userResult.remaining,
        resetTime: userResult.resetTime
      });
      
      res.status(429).json({
        ok: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this user',
        resetTime: userResult.resetTime
      });
      return;
    }
  }

  if (ip) {
    const ipLimit = RATE_LIMITS.ip.requestsPerMinute * RATE_LIMITS.ip.burstMultiplier;
    const ipResult = await rateLimiter.isRateLimited(`ip:${ip}`, ipLimit, 60000);
    
    if (!ipResult.allowed) {
      logger.warn({
        msg: 'ratelimit_block',
        userId,
        ip,
        limit: ipLimit,
        remaining: ipResult.remaining,
        resetTime: ipResult.resetTime
      });
      
      res.status(429).json({
        ok: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP',
        resetTime: ipResult.resetTime
      });
      return;
    }
  }

  next();
}

// Blacklist detection middleware
export async function blacklistDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const { code } = req.body;
  
  if (code) {
    const lowerCode = code.toLowerCase();
    const hasBlacklistedToken = BLACKLISTED_TOKENS.some(token => 
      lowerCode.includes(token.toLowerCase())
    );
    
    if (hasBlacklistedToken) {
      const userId = (req as any).userId;
      const ip = req.ip || req.connection.remoteAddress;
      
      logger.error({
        msg: 'forbidden_token_detected',
        userId,
        ip,
        forbiddenTokens: BLACKLISTED_TOKENS.filter(token => lowerCode.includes(token.toLowerCase())),
        codeSnippet: code.substring(0, 200) + (code.length > 200 ? '...' : '')
      });
      
      // Log to audit system
      // Note: In a real implementation, we would inject the audit logger service
      // For now, we'll just log to the regular logger
      
      res.status(403).json({
        ok: false,
        error: 'FORBIDDEN_TOKEN',
        message: 'Code contains forbidden tokens'
      });
      return;
    }
  }
  
  next();
}

// Timeout detection and blocking middleware
export async function timeoutDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Attach to response to track timeouts
  const originalSend = res.send;
  (res as any).startTime = Date.now();
  
  res.send = function(body: any) {
    const duration = Date.now() - (res as any).startTime;
    
    // Check if this was a timeout response
    if (res.statusCode === 504 && userId) {
      // Increment timeout count
      rateLimiter.incrementTimeoutCount(userId)
        .then(async (timeoutCount) => {
          logger.warn({
            msg: 'execution_timeout',
            userId,
            ip,
            durationMs: duration,
            svc: {
              exec: {
                timeMs: duration,
                timeout: true
              }
            }
          });
          
          // Check if we should block the user
          if (timeoutCount >= TIMEOUT_CONFIG.maxConsecutiveTimeouts) {
            await rateLimiter.blockUser(userId, TIMEOUT_CONFIG.blockDurationMs);
            
            logger.warn({
              msg: 'user_blocked_due_to_timeouts',
              userId,
              ip,
              timeoutCount,
              blockDurationMs: TIMEOUT_CONFIG.blockDurationMs
            });
            
            // Log to audit system (EXEC_BLOCK event)
            // Note: In a real implementation, we would inject the audit logger service
          }
        })
        .catch(logger.error);
    } else if (res.statusCode === 200 && userId) {
      // Successful execution, log execution result
      try {
        const result = typeof body === 'string' ? JSON.parse(body) : body;
        if (result && result.executeResult) {
          logger.info({
            msg: 'execute_result',
            userId,
            ip,
            durationMs: duration,
            svc: {
              exec: {
                timeMs: duration,
                timeout: false,
                memMb: result.executeResult.memoryUsage,
                eventsCount: result.executeResult.events?.length || 0
              }
            }
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}