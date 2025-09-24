# 统一结构化日志规范

## 概述

本文档定义了儿童编程平台的统一结构化日志规范，确保后端和执行器模块的日志格式一致，便于监控、调试和审计。

## 日志格式标准

### 基础字段

所有日志条目必须包含以下基础字段：

| 字段名       | 类型   | 必填 | 描述                                         |
| ------------ | ------ | ---- | -------------------------------------------- |
| `ts`         | string | ✅   | 时间戳 (ISO 8601格式)                        |
| `level`      | string | ✅   | 日志级别 (trace/debug/info/warn/error/fatal) |
| `msg`        | string | ✅   | 日志消息                                     |
| `traceId`    | string | ✅   | 请求追踪ID                                   |
| `userId`     | string | ❌   | 用户ID (可选)                                |
| `execId`     | string | ❌   | 执行任务ID (可选)                            |
| `durationMs` | number | ❌   | 操作耗时 (毫秒)                              |
| `route`      | string | ❌   | API路由 (可选)                               |

### 扩展字段

根据具体场景，可以添加以下扩展字段：

| 字段名           | 类型   | 描述         |
| ---------------- | ------ | ------------ |
| `jobId`          | string | 任务ID       |
| `workerId`       | number | 工作进程ID   |
| `containerId`    | string | 容器ID       |
| `memoryBytes`    | number | 内存使用量   |
| `cpuSeconds`     | number | CPU使用时间  |
| `queueLatencyMs` | number | 队列等待时间 |
| `statusCode`     | number | HTTP状态码   |
| `contentLength`  | number | 响应内容长度 |
| `ipAddress`      | string | 客户端IP地址 |
| `userAgent`      | string | 用户代理     |
| `error`          | object | 错误对象     |
| `metadata`       | object | 额外元数据   |

## 日志级别定义

### 级别说明

| 级别    | 数值 | 使用场景                           |
| ------- | ---- | ---------------------------------- |
| `trace` | 10   | 详细的调试信息，通常仅在开发时使用 |
| `debug` | 20   | 调试信息，用于问题诊断             |
| `info`  | 30   | 一般信息，记录程序运行状态         |
| `warn`  | 40   | 警告信息，表示潜在问题             |
| `error` | 50   | 错误信息，表示程序错误             |
| `fatal` | 60   | 致命错误，程序无法继续运行         |

### 使用原则

- **trace**: 仅在开发环境使用，生产环境应关闭
- **debug**: 用于问题诊断，生产环境可选择性开启
- **info**: 记录重要的业务操作和系统状态
- **warn**: 记录异常情况但不影响程序运行
- **error**: 记录程序错误，需要关注和处理
- **fatal**: 记录致命错误，需要立即处理

## 日志格式示例

### 请求日志

```json
{
  "ts": "2024-01-03T10:30:45.123Z",
  "level": "info",
  "msg": "request_received",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "route": "/api/execute",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

```json
{
  "ts": "2024-01-03T10:30:45.456Z",
  "level": "info",
  "msg": "request_completed",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "route": "/api/execute",
  "statusCode": 200,
  "durationMs": 333,
  "contentLength": 1024
}
```

### 执行器日志

```json
{
  "ts": "2024-01-03T10:30:45.200Z",
  "level": "info",
  "msg": "execute_job_enqueued",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "jobId": "job-87654321-4321-4321-4321-cba987654321",
  "tests": 1
}
```

```json
{
  "ts": "2024-01-03T10:30:45.300Z",
  "level": "info",
  "msg": "worker_job_started",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "jobId": "job-87654321-4321-4321-4321-cba987654321",
  "workerId": 1,
  "queueLatencyMs": 100,
  "tests": 1
}
```

```json
{
  "ts": "2024-01-03T10:30:45.450Z",
  "level": "info",
  "msg": "worker_job_completed",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "jobId": "job-87654321-4321-4321-4321-cba987654321",
  "workerId": 1,
  "durationMs": 150,
  "tests": [
    {
      "index": 0,
      "exitCode": 0,
      "timedOut": false,
      "durationMs": 120,
      "passed": true,
      "cpuSeconds": 0.1,
      "memoryBytes": 1024000,
      "containerId": "container-abc123"
    }
  ]
}
```

### 错误日志

```json
{
  "ts": "2024-01-03T10:30:45.500Z",
  "level": "error",
  "msg": "worker_execution_failed",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "jobId": "job-87654321-4321-4321-4321-cba987654321",
  "workerId": 1,
  "error": {
    "name": "ExecutionTimeoutError",
    "message": "Process terminated due to timeout",
    "stack": "ExecutionTimeoutError: Process terminated due to timeout\n    at ..."
  }
}
```

### 系统日志

```json
{
  "ts": "2024-01-03T10:30:45.000Z",
  "level": "info",
  "msg": "executor_listening",
  "port": 4060
}
```

```json
{
  "ts": "2024-01-03T10:30:45.000Z",
  "level": "info",
  "msg": "worker_pool_started",
  "concurrency": 10
}
```

## 模块特定日志

### API模块日志

#### 认证相关

```json
{
  "ts": "2024-01-03T10:30:45.100Z",
  "level": "info",
  "msg": "user_login_success",
  "userId": "user-123",
  "ipAddress": "192.168.1.100"
}
```

```json
{
  "ts": "2024-01-03T10:30:45.100Z",
  "level": "warn",
  "msg": "user_login_failed",
  "userId": "user-123",
  "ipAddress": "192.168.1.100",
  "reason": "invalid_password"
}
```

#### 权限相关

```json
{
  "ts": "2024-01-03T10:30:45.200Z",
  "level": "warn",
  "msg": "permission_denied",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "route": "/api/metrics/students/456/trend",
  "requiredPermission": "VIEW_STUDENT_DATA"
}
```

#### 数据访问

```json
{
  "ts": "2024-01-03T10:30:45.300Z",
  "level": "info",
  "msg": "data_access_logged",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "userId": "user-123",
  "action": "view_student_trend",
  "targetType": "student",
  "targetId": "student-456",
  "metadata": {
    "from": "2024-01-01",
    "to": "2024-01-31",
    "granularity": "day"
  }
}
```

### 执行器模块日志

#### 队列管理

```json
{
  "ts": "2024-01-03T10:30:45.100Z",
  "level": "info",
  "msg": "queue_job_enqueued",
  "jobId": "job-87654321-4321-4321-4321-cba987654321",
  "queueSize": 5
}
```

```json
{
  "ts": "2024-01-03T10:30:45.200Z",
  "level": "warn",
  "msg": "queue_full",
  "queueSize": 100,
  "maxSize": 100
}
```

#### 容器管理

```json
{
  "ts": "2024-01-03T10:30:45.150Z",
  "level": "info",
  "msg": "container_created",
  "containerId": "container-abc123",
  "image": "kids-coding/python-executor:latest"
}
```

```json
{
  "ts": "2024-01-03T10:30:45.400Z",
  "level": "info",
  "msg": "container_removed",
  "containerId": "container-abc123",
  "durationMs": 250
}
```

#### 资源监控

```json
{
  "ts": "2024-01-03T10:30:45.300Z",
  "level": "warn",
  "msg": "resource_limit_exceeded",
  "containerId": "container-abc123",
  "resourceType": "memory",
  "limit": 268435456,
  "usage": 300000000
}
```

### WebSocket模块日志

```json
{
  "ts": "2024-01-03T10:30:45.100Z",
  "level": "info",
  "msg": "websocket_connection_established",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "jobId": "job-87654321-4321-4321-4321-cba987654321",
  "clientIp": "192.168.1.100"
}
```

```json
{
  "ts": "2024-01-03T10:30:45.500Z",
  "level": "info",
  "msg": "websocket_message_sent",
  "traceId": "req-12345678-1234-1234-1234-123456789abc",
  "jobId": "job-87654321-4321-4321-4321-cba987654321",
  "messageType": "run-result"
}
```

## 日志配置

### 环境变量

| 变量名            | 默认值   | 描述                   |
| ----------------- | -------- | ---------------------- |
| `LOG_LEVEL`       | `info`   | 日志级别               |
| `LOG_FORMAT`      | `json`   | 日志格式 (json/pretty) |
| `LOG_DESTINATION` | `stdout` | 日志输出目标           |
| `LOG_FILE_PATH`   | -        | 日志文件路径           |
| `LOG_MAX_SIZE`    | `100MB`  | 日志文件最大大小       |
| `LOG_MAX_FILES`   | `5`      | 最大日志文件数         |

### 配置示例

#### Node.js (Pino)

```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      return {
        ts: new Date().toISOString(),
        ...object,
      };
    },
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});
```

#### Python (structlog)

```python
import structlog
import logging

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)
```

## 日志聚合与分析

### 日志收集

- **文件收集**: 使用Filebeat收集日志文件
- **容器收集**: 使用Fluentd收集容器日志
- **应用收集**: 直接发送到日志聚合系统

### 日志存储

- **Elasticsearch**: 存储和索引日志数据
- **Kibana**: 日志可视化和分析
- **Grafana**: 监控仪表板

### 日志分析

#### 关键指标

- **请求量**: 按时间统计API请求数量
- **响应时间**: 统计API响应时间分布
- **错误率**: 统计错误日志比例
- **用户活跃度**: 统计活跃用户数量

#### 告警规则

- **错误率告警**: 错误日志比例超过5%
- **响应时间告警**: 平均响应时间超过1秒
- **资源使用告警**: 内存或CPU使用率超过80%
- **队列积压告警**: 执行队列长度超过50

## 安全与隐私

### 敏感信息处理

- **密码**: 绝不记录密码或密码哈希
- **令牌**: 记录令牌ID而非完整令牌
- **个人信息**: 脱敏处理用户个人信息
- **代码内容**: 限制代码内容记录长度

### 日志保留

- **生产环境**: 保留30天
- **开发环境**: 保留7天
- **审计日志**: 保留1年
- **错误日志**: 保留90天

### 访问控制

- **日志访问**: 仅授权人员可访问
- **日志导出**: 需要审批流程
- **日志删除**: 需要管理员权限

## 最佳实践

### 日志记录原则

1. **结构化**: 使用JSON格式，便于解析
2. **一致性**: 所有模块使用相同的字段名
3. **可读性**: 消息内容清晰易懂
4. **完整性**: 包含足够的上下文信息
5. **性能**: 避免影响业务性能

### 错误处理

```javascript
// 好的做法
logger.error(
  {
    msg: 'user_login_failed',
    userId: 'user-123',
    error: error,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  },
  'User login failed',
);

// 避免的做法
logger.error('Login failed for user ' + userId + ' from ' + ip);
```

### 性能考虑

- **异步记录**: 使用异步日志记录
- **批量发送**: 批量发送日志到聚合系统
- **采样**: 高频日志进行采样
- **过滤**: 过滤不必要的日志

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 运维团队  
**审核状态**: 待审核
