# 日志规范与可观测性标准

## 统一日志字段

所有服务必须使用以下标准日志字段：

### 必需字段

- `level`: 日志级别 (`debug`, `info`, `warn`, `error`)
- `msg`: 日志消息描述
- `timestamp`: ISO 8601 时间戳

### 上下文字段

- `traceId`: 请求追踪 ID（用于跨服务追踪）
- `userId`: 用户 ID（如适用）
- `sessionId`: 会话 ID（如适用）
- `execId`: 执行任务 ID（代码执行相关）
- `durationMs`: 操作耗时（毫秒）

### 服务标识字段

- `service`: 服务名称 (`api`, `executor`, `websocket`)
- `version`: 服务版本
- `environment`: 环境标识 (`dev`, `staging`, `prod`)

## 日志级别使用规范

### DEBUG

- 详细的调试信息
- 仅在开发环境启用
- 包含变量值、中间状态等

### INFO

- 一般性信息记录
- 业务操作记录
- 系统状态变更

### WARN

- 警告信息
- 非致命错误
- 性能问题提醒

### ERROR

- 错误信息
- 异常情况
- 系统故障

## 日志格式示例

### API 请求日志

```json
{
  "level": "info",
  "msg": "HTTP request completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "traceId": "req_123456789",
  "userId": "user_abc123",
  "service": "api",
  "version": "1.0.0",
  "method": "POST",
  "path": "/api/courses",
  "statusCode": 200,
  "durationMs": 150
}
```

### 代码执行日志

```json
{
  "level": "info",
  "msg": "Code execution completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "traceId": "exec_123456789",
  "userId": "user_abc123",
  "execId": "exec_987654321",
  "service": "executor",
  "version": "1.0.0",
  "language": "python",
  "outcome": "success",
  "durationMs": 2500
}
```

### 错误日志

```json
{
  "level": "error",
  "msg": "Code execution failed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "traceId": "exec_123456789",
  "userId": "user_abc123",
  "execId": "exec_987654321",
  "service": "executor",
  "version": "1.0.0",
  "error": "SyntaxError: invalid syntax",
  "durationMs": 100
}
```

## 监控指标

### API 服务指标

- `kids_api_request_duration_ms`: HTTP 请求耗时
- `kids_api_request_total`: HTTP 请求总数
- `kids_api_active_connections`: 活跃连接数

### 执行器服务指标

- `kids_executor_execution_total`: 代码执行总数
- `kids_executor_execution_duration_ms`: 代码执行耗时
- `kids_executor_queue_size`: 任务队列大小
- `kids_executor_active_workers`: 活跃工作进程数

### 系统指标

- `kids_system_memory_usage`: 内存使用率
- `kids_system_cpu_usage`: CPU 使用率
- `kids_system_disk_usage`: 磁盘使用率

## 日志收集与存储

### 本地开发

- 使用 `make logs` 查看实时日志
- 日志文件存储在 `logs/` 目录
- 支持多服务日志聚合显示

### 生产环境

- 使用 ELK Stack (Elasticsearch, Logstash, Kibana)
- 日志保留期：30天
- 错误日志保留期：90天

## 告警规则

### 错误率告警

- API 错误率 > 5% 持续 5 分钟
- 代码执行失败率 > 10% 持续 3 分钟

### 性能告警

- API 响应时间 P95 > 2 秒持续 5 分钟
- 代码执行时间 P95 > 10 秒持续 3 分钟

### 资源告警

- 内存使用率 > 80% 持续 5 分钟
- CPU 使用率 > 90% 持续 3 分钟
- 磁盘使用率 > 85% 持续 1 分钟

## 日志查询示例

### 查询特定用户的日志

```bash
# 查询用户 user_abc123 的所有日志
grep "userId.*user_abc123" logs/*.log
```

### 查询错误日志

```bash
# 查询所有错误日志
grep '"level":"error"' logs/*.log
```

### 查询性能问题

```bash
# 查询耗时超过 5 秒的请求
grep '"durationMs":[5-9][0-9][0-9][0-9]' logs/*.log
```

## 最佳实践

1. **结构化日志**: 始终使用 JSON 格式
2. **避免敏感信息**: 不在日志中记录密码、令牌等
3. **合理的日志级别**: 避免过度使用 DEBUG 级别
4. **上下文信息**: 包含足够的上下文信息便于排查问题
5. **性能考虑**: 避免在热路径中记录过多日志
6. **日志轮转**: 定期清理旧日志文件
7. **监控告警**: 设置合理的告警阈值
