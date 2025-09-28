import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  // HTTP请求计数器
  private readonly httpRequestsTotal: Counter<string>;
  
  // HTTP请求持续时间直方图
  private readonly httpRequestDuration: Histogram<string>;
  
  // 代码执行计数器
  private readonly codeExecutionsTotal: Counter<string>;
  
  // 代码执行时间直方图
  private readonly codeExecutionDuration: Histogram<string>;
  
  // 判题通过率计数器
  private readonly judgePassTotal: Counter<string>;
  
  // 速率限制阻止计数器
  private readonly rateLimitBlockTotal: Counter<string>;
  
  // 活跃用户数
  private readonly activeUsers: Gauge<string>;
  
  // 数据库连接状态
  private readonly databaseStatus: Gauge<string>;
  
  // 内存使用量
  private readonly memoryUsage: Gauge<string>;

  constructor() {
    // 收集默认指标
    collectDefaultMetrics({ register });

    // HTTP请求指标
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000],
      registers: [register],
    });

    // 代码执行指标
    this.codeExecutionsTotal = new Counter({
      name: 'code_executions_total',
      help: 'Total number of code executions',
      labelNames: ['language', 'status'],
      registers: [register],
    });

    this.codeExecutionDuration = new Histogram({
      name: 'code_execution_duration_ms',
      help: 'Code execution duration in milliseconds',
      labelNames: ['language'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
      registers: [register],
    });

    // 判题指标
    this.judgePassTotal = new Counter({
      name: 'judge_pass_total',
      help: 'Total number of judge passes',
      labelNames: ['strategy', 'pass'],
      registers: [register],
    });

    // 速率限制指标
    this.rateLimitBlockTotal = new Counter({
      name: 'rate_limit_block_total',
      help: 'Total number of rate limit blocks',
      labelNames: ['route', 'reason'],
      registers: [register],
    });

    // 系统指标
    this.activeUsers = new Gauge({
      name: 'active_users_total',
      help: 'Number of active users',
      labelNames: ['role'],
      registers: [register],
    });

    this.databaseStatus = new Gauge({
      name: 'database_status',
      help: 'Database connection status (1=up, 0=down)',
      registers: [register],
    });

    this.memoryUsage = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [register],
    });

    // 定期更新系统指标
    this.startSystemMetricsUpdate();
  }

  /**
   * 记录HTTP请求
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestsTotal.inc({ method, route, statusCode: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, statusCode: statusCode.toString() }, duration);
  }

  /**
   * 记录代码执行
   */
  recordCodeExecution(language: string, status: 'success' | 'error' | 'timeout', duration: number): void {
    this.codeExecutionsTotal.inc({ language, status });
    this.codeExecutionDuration.observe({ language }, duration);
  }

  /**
   * 记录判题结果
   */
  recordJudgeResult(strategy: string, passed: boolean): void {
    this.judgePassTotal.inc({ strategy, pass: passed.toString() });
  }

  /**
   * 记录速率限制阻止
   */
  recordRateLimitBlock(route: string, reason: string): void {
    this.rateLimitBlockTotal.inc({ route, reason });
  }

  /**
   * 更新活跃用户数
   */
  updateActiveUsers(role: string, count: number): void {
    this.activeUsers.set({ role }, count);
  }

  /**
   * 更新数据库状态
   */
  updateDatabaseStatus(isConnected: boolean): void {
    this.databaseStatus.set(isConnected ? 1 : 0);
  }

  /**
   * 获取指标数据
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * 获取指标注册表
   */
  getRegister() {
    return register;
  }

  /**
   * 定期更新系统指标
   */
  private startSystemMetricsUpdate(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      
      this.memoryUsage.set({ type: 'rss' }, usage.rss);
      this.memoryUsage.set({ type: 'heapTotal' }, usage.heapTotal);
      this.memoryUsage.set({ type: 'heapUsed' }, usage.heapUsed);
      this.memoryUsage.set({ type: 'external' }, usage.external);
    }, 30000); // 每30秒更新一次
  }

  /**
   * 清理指标
   */
  clearMetrics(): void {
    register.clear();
  }
}
