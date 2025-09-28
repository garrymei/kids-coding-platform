import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../common/services/logger.service';

export interface DatabaseConfig {
  url: string;
  connectTimeoutMs: number;
  connectRetries: number;
  retryDelays: number[]; // 指数退避延迟数组
}

export interface DatabaseStatus {
  connected: boolean;
  lastError?: string;
  lastAttempt?: Date;
  retryCount: number;
}

class DatabaseManager {
  private prisma: PrismaClient;
  private config: DatabaseConfig;
  private status: DatabaseStatus;
  private logger: LoggerService;
  private retryTimer?: NodeJS.Timeout;

  constructor(logger: LoggerService) {
    this.logger = logger;
    this.config = {
      url: process.env.DATABASE_URL || 'postgresql://kids:kids@localhost:5432/kids',
      connectTimeoutMs: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000'),
      connectRetries: parseInt(process.env.DB_CONNECT_RETRIES || '5'),
      retryDelays: [500, 1000, 2000, 4000, 8000], // 指数退避
    };

    this.status = {
      connected: false,
      retryCount: 0,
    };

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.config.url,
        },
      },
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // 监听Prisma错误事件
    this.prisma.$on('error', (e) => {
      this.logger.error('Database error', { error: e.message, target: e.target });
    });

    this.prisma.$on('warn', (e) => {
      this.logger.warn('Database warning', { warning: e.message, target: e.target });
    });
  }

  /**
   * 尝试连接数据库，支持重试机制
   */
  async connect(): Promise<boolean> {
    for (let attempt = 0; attempt < this.config.connectRetries; attempt++) {
      try {
        this.logger.info('Attempting database connection', { 
          attempt: attempt + 1, 
          maxRetries: this.config.connectRetries 
        });

        // 设置连接超时
        const connectPromise = this.prisma.$connect();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), this.config.connectTimeoutMs);
        });

        await Promise.race([connectPromise, timeoutPromise]);

        // 连接成功，测试查询
        await this.prisma.$queryRaw`SELECT 1`;
        
        this.status = {
          connected: true,
          retryCount: attempt,
          lastAttempt: new Date(),
        };

        this.logger.info('Database connected successfully', { 
          attempt: attempt + 1,
          retryCount: this.status.retryCount 
        });

        return true;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.status = {
          connected: false,
          lastError: errorMessage,
          lastAttempt: new Date(),
          retryCount: attempt,
        };

        this.logger.error('Database connection failed', {
          attempt: attempt + 1,
          error: errorMessage,
          willRetry: attempt < this.config.connectRetries - 1,
        });

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.connectRetries - 1) {
          const delay = this.config.retryDelays[attempt] || this.config.retryDelays[this.config.retryDelays.length - 1];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 所有重试都失败了
    this.logger.error('Database connection failed after all retries', {
      totalAttempts: this.config.connectRetries,
      lastError: this.status.lastError,
    });

    return false;
  }

  /**
   * 启动后台重连机制
   */
  startReconnectLoop(): void {
    if (this.status.connected) {
      return;
    }

    this.logger.info('Starting database reconnection loop');
    
    const attemptReconnect = async () => {
      if (this.status.connected) {
        return;
      }

      const connected = await this.connect();
      if (!connected) {
        // 30秒后再次尝试
        this.retryTimer = setTimeout(attemptReconnect, 30000);
      }
    };

    // 5秒后开始重连循环
    this.retryTimer = setTimeout(attemptReconnect, 5000);
  }

  /**
   * 停止重连循环
   */
  stopReconnectLoop(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  /**
   * 获取数据库状态
   */
  getStatus(): DatabaseStatus {
    return { ...this.status };
  }

  /**
   * 获取Prisma客户端（可能未连接）
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * 检查数据库是否可用
   */
  async isHealthy(): Promise<boolean> {
    if (!this.status.connected) {
      return false;
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', { error });
      this.status.connected = false;
      this.status.lastError = error instanceof Error ? error.message : String(error);
      return false;
    }
  }

  /**
   * 优雅关闭数据库连接
   */
  async disconnect(): Promise<void> {
    this.stopReconnectLoop();
    
    try {
      await this.prisma.$disconnect();
      this.logger.info('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting database', { error });
    }
  }
}

// 单例实例
let dbManager: DatabaseManager | null = null;

export function getDatabaseManager(logger: LoggerService): DatabaseManager {
  if (!dbManager) {
    dbManager = new DatabaseManager(logger);
  }
  return dbManager;
}

export function getPrismaClient(): PrismaClient {
  if (!dbManager) {
    throw new Error('Database manager not initialized');
  }
  return dbManager.getClient();
}

// 优雅关闭处理
process.on('beforeExit', async () => {
  if (dbManager) {
    await dbManager.disconnect();
  }
});

process.on('SIGTERM', async () => {
  if (dbManager) {
    await dbManager.disconnect();
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  if (dbManager) {
    await dbManager.disconnect();
    process.exit(0);
  }
});
