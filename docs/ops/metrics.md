# 健康检查与指标枚举

## 概述

本文档定义了儿童编程平台的健康检查和监控指标规范，包括健康检查端点、Prometheus指标定义和监控策略。

## 健康检查端点

### 基础健康检查

#### `/health` - 基础健康状态

**用途**: 检查服务是否正常运行

**请求示例**:

```http
GET /health
```

**响应格式**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-03T10:30:45.123Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

**状态值**:

- `healthy`: 服务正常
- `degraded`: 服务降级
- `unhealthy`: 服务异常

#### `/ready` - 就绪状态检查

**用途**: 检查服务是否准备好接收请求

**请求示例**:

```http
GET /ready
```

**响应格式**:

```json
{
  "ok": true,
  "services": {
    "database": "up",
    "redis": "up",
    "docker": "up",
    "queue": "up"
  },
  "checks": {
    "database_connection": "pass",
    "redis_connection": "pass",
    "docker_daemon": "pass",
    "queue_connection": "pass"
  }
}
```

**服务状态**:

- `up`: 服务正常
- `down`: 服务异常
- `degraded`: 服务降级

**检查结果**:

- `pass`: 检查通过
- `fail`: 检查失败
- `warn`: 检查警告

### 详细健康检查

#### `/health/detailed` - 详细健康信息

**用途**: 获取详细的健康状态信息

**响应格式**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-03T10:30:45.123Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "up",
      "responseTime": 5,
      "lastCheck": "2024-01-03T10:30:40.123Z"
    },
    "redis": {
      "status": "up",
      "responseTime": 2,
      "lastCheck": "2024-01-03T10:30:40.125Z"
    },
    "docker": {
      "status": "up",
      "containers": 5,
      "lastCheck": "2024-01-03T10:30:40.127Z"
    },
    "queue": {
      "status": "up",
      "pendingJobs": 3,
      "lastCheck": "2024-01-03T10:30:40.130Z"
    }
  },
  "metrics": {
    "cpuUsage": 45.2,
    "memoryUsage": 67.8,
    "diskUsage": 23.1
  }
}
```

---

## Prometheus指标定义

### 基础指标

#### HTTP请求指标

```prometheus
# HTTP请求总数
http_requests_total{method, route, status_code} counter

# HTTP请求持续时间
http_request_duration_seconds{method, route} histogram

# HTTP请求大小
http_request_size_bytes{method, route} histogram

# HTTP响应大小
http_response_size_bytes{method, route} histogram
```

#### 系统资源指标

```prometheus
# CPU使用率
system_cpu_usage_percent gauge

# 内存使用量
system_memory_usage_bytes gauge

# 磁盘使用量
system_disk_usage_bytes{device, mountpoint} gauge

# 网络流量
system_network_bytes_total{device, direction} counter
```

### 业务指标

#### 用户相关指标

```prometheus
# 活跃用户数
users_active_total gauge

# 用户登录次数
user_logins_total{result} counter

# 用户会话数
user_sessions_total gauge
```

#### 执行器指标

```prometheus
# 执行请求总数
executor_requests_total{language, result} counter

# 执行持续时间
executor_execution_duration_seconds{language} histogram

# 执行队列长度
executor_queue_length gauge

# 执行成功率
executor_success_rate{language} gauge

# 执行失败率
executor_failure_rate{language} gauge

# 平均执行时间
executor_avg_execution_time_seconds{language} gauge

# 资源使用情况
executor_cpu_usage_seconds_total{container_id} counter
executor_memory_usage_bytes{container_id} gauge
```

#### 队列指标

```prometheus
# 队列任务总数
queue_jobs_total{status} counter

# 队列等待时间
queue_wait_time_seconds{priority} histogram

# 队列处理时间
queue_processing_time_seconds histogram

# 队列积压数量
queue_backlog_size gauge
```

#### 容器指标

```prometheus
# 容器创建总数
containers_created_total{image} counter

# 容器运行时间
container_runtime_seconds{container_id} histogram

# 容器资源使用
container_cpu_usage_seconds_total{container_id} counter
container_memory_usage_bytes{container_id} gauge

# 容器状态
container_status{container_id, status} gauge
```

### 错误指标

```prometheus
# 错误总数
errors_total{service, error_type} counter

# 超时错误
timeout_errors_total{service, operation} counter

# 内存超限错误
memory_limit_errors_total{service} counter

# 网络错误
network_errors_total{service, error_type} counter
```

---

## 指标详细说明

### 执行器核心指标

#### 执行次数统计

```prometheus
# 指标名称: executor_requests_total
# 类型: Counter
# 标签: language, result, user_type
# 描述: 执行请求总数

executor_requests_total{language="python", result="success", user_type="student"} 1250
executor_requests_total{language="python", result="error", user_type="student"} 45
executor_requests_total{language="python", result="timeout", user_type="student"} 12
```

#### 平均耗时统计

```prometheus
# 指标名称: executor_avg_execution_time_seconds
# 类型: Gauge
# 标签: language
# 描述: 平均执行时间

executor_avg_execution_time_seconds{language="python"} 0.85
```

#### 失败率统计

```prometheus
# 指标名称: executor_failure_rate
# 类型: Gauge
# 标签: language
# 描述: 执行失败率 (0-1)

executor_failure_rate{language="python"} 0.045
```

#### 队列长度监控

```prometheus
# 指标名称: executor_queue_length
# 类型: Gauge
# 描述: 当前队列中等待执行的任务数

executor_queue_length 3
```

### 资源使用指标

#### CPU使用统计

```prometheus
# 指标名称: executor_cpu_usage_seconds_total
# 类型: Counter
# 标签: container_id, job_id
# 描述: 容器CPU使用时间累计

executor_cpu_usage_seconds_total{container_id="abc123", job_id="job-456"} 2.5
```

#### 内存使用统计

```prometheus
# 指标名称: executor_memory_usage_bytes
# 类型: Gauge
# 标签: container_id, job_id
# 描述: 容器内存使用量

executor_memory_usage_bytes{container_id="abc123", job_id="job-456"} 134217728
```

### 业务监控指标

#### 用户活跃度

```prometheus
# 指标名称: users_active_total
# 类型: Gauge
# 标签: role
# 描述: 当前活跃用户数

users_active_total{role="student"} 150
users_active_total{role="parent"} 45
users_active_total{role="teacher"} 12
```

#### 数据访问统计

```prometheus
# 指标名称: data_access_total
# 类型: Counter
# 标签: action, target_type, user_role
# 描述: 数据访问操作总数

data_access_total{action="view_student_trend", target_type="student", user_role="parent"} 89
data_access_total{action="compare_students", target_type="student", user_role="teacher"} 23
```

---

## 监控告警规则

### 基础告警

#### 服务可用性告警

```yaml
# 服务不可用告警
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: 'Service {{ $labels.instance }} is down'
    description: 'Service has been down for more than 1 minute'

# 服务响应时间告警
- alert: HighResponseTime
  expr: http_request_duration_seconds{quantile="0.95"} > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'High response time on {{ $labels.route }}'
    description: '95th percentile response time is {{ $value }}s'
```

#### 资源使用告警

```yaml
# CPU使用率告警
- alert: HighCPUUsage
  expr: system_cpu_usage_percent > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'High CPU usage on {{ $labels.instance }}'
    description: 'CPU usage is {{ $value }}%'

# 内存使用率告警
- alert: HighMemoryUsage
  expr: system_memory_usage_bytes / system_memory_total_bytes > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'High memory usage on {{ $labels.instance }}'
    description: 'Memory usage is {{ $value }}%'
```

### 业务告警

#### 执行器告警

```yaml
# 执行失败率告警
- alert: HighExecutionFailureRate
  expr: executor_failure_rate > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: 'High execution failure rate'
    description: 'Execution failure rate is {{ $value }}'

# 队列积压告警
- alert: QueueBacklogHigh
  expr: executor_queue_length > 50
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: 'High queue backlog'
    description: 'Queue has {{ $value }} pending jobs'

# 平均执行时间告警
- alert: SlowExecution
  expr: executor_avg_execution_time_seconds > 5
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: 'Slow execution times'
    description: 'Average execution time is {{ $value }}s'
```

#### 资源限制告警

```yaml
# 内存超限告警
- alert: MemoryLimitExceeded
  expr: executor_memory_usage_bytes > 268435456
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: 'Memory limit exceeded'
    description: 'Container {{ $labels.container_id }} used {{ $value }} bytes'

# 容器创建失败告警
- alert: ContainerCreationFailed
  expr: increase(containers_created_total{status="failed"}[5m]) > 0
  for: 0m
  labels:
    severity: critical
  annotations:
    summary: 'Container creation failed'
    description: 'Failed to create container for image {{ $labels.image }}'
```

---

## 监控仪表板

### 系统概览仪表板

#### 关键指标

- **服务状态**: 所有服务的健康状态
- **请求量**: HTTP请求总数和速率
- **响应时间**: 平均和95分位响应时间
- **错误率**: 4xx和5xx错误比例
- **资源使用**: CPU、内存、磁盘使用率

#### 图表配置

```json
{
  "title": "System Overview",
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{route}}"
        }
      ]
    },
    {
      "title": "Response Time",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "95th percentile"
        }
      ]
    }
  ]
}
```

### 执行器监控仪表板

#### 关键指标

- **执行统计**: 执行次数、成功率、失败率
- **性能指标**: 平均执行时间、队列长度
- **资源使用**: CPU、内存使用情况
- **错误分析**: 错误类型分布

#### 图表配置

```json
{
  "title": "Executor Monitoring",
  "panels": [
    {
      "title": "Execution Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(executor_requests_total[5m])",
          "legendFormat": "{{language}} {{result}}"
        }
      ]
    },
    {
      "title": "Queue Length",
      "type": "singlestat",
      "targets": [
        {
          "expr": "executor_queue_length",
          "legendFormat": "Pending Jobs"
        }
      ]
    }
  ]
}
```

---

## 监控配置

### Prometheus配置

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alerts/*.yml'

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'executor'
    static_configs:
      - targets: ['executor:4060']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'websocket'
    static_configs:
      - targets: ['websocket:4070']
    metrics_path: '/metrics'
    scrape_interval: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

### Grafana配置

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true

dashboards:
  - name: 'System Overview'
    path: '/var/lib/grafana/dashboards/system-overview.json'
  - name: 'Executor Monitoring'
    path: '/var/lib/grafana/dashboards/executor-monitoring.json'
```

---

## Makefile监控命令

### 监控服务启动

```makefile
# 启动监控服务
monitor:up:
	@echo "Starting monitoring services..."
	docker-compose -f docker/monitoring.yml up -d
	@echo "Monitoring services started"
	@echo "Prometheus: http://localhost:9090"
	@echo "Grafana: http://localhost:3000"
	@echo "AlertManager: http://localhost:9093"

# 停止监控服务
monitor:down:
	@echo "Stopping monitoring services..."
	docker-compose -f docker/monitoring.yml down
	@echo "Monitoring services stopped"

# 查看监控状态
monitor:status:
	@echo "Monitoring services status:"
	docker-compose -f docker/monitoring.yml ps

# 查看监控日志
monitor:logs:
	docker-compose -f docker/monitoring.yml logs -f

# 重新加载监控配置
monitor:reload:
	@echo "Reloading monitoring configuration..."
	curl -X POST http://localhost:9090/-/reload
	@echo "Configuration reloaded"
```

### 健康检查命令

```makefile
# 检查所有服务健康状态
health:check:
	@echo "Checking service health..."
	@curl -s http://localhost:3000/health | jq .
	@curl -s http://localhost:4060/ready | jq .
	@curl -s http://localhost:4070/health | jq .

# 检查特定服务
health:api:
	@curl -s http://localhost:3000/health | jq .

health:executor:
	@curl -s http://localhost:4060/ready | jq .

health:websocket:
	@curl -s http://localhost:4070/health | jq .
```

---

## 最佳实践

### 指标设计原则

1. **命名规范**: 使用下划线分隔，语义清晰
2. **标签设计**: 标签数量适中，避免高基数
3. **指标类型**: 正确选择Counter、Gauge、Histogram
4. **采样策略**: 高频指标进行适当采样

### 告警设计原则

1. **告警分级**: 根据影响程度设置不同级别
2. **告警抑制**: 避免告警风暴
3. **告警恢复**: 设置恢复通知
4. **告警测试**: 定期测试告警规则

### 监控策略

1. **分层监控**: 基础设施、应用、业务三层监控
2. **主动监控**: 主动检查而非被动等待
3. **趋势分析**: 关注趋势变化而非单点值
4. **容量规划**: 基于监控数据进行容量规划

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 运维团队  
**审核状态**: 待审核
