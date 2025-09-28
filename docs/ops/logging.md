# 结构化日志与审计文档

## 1. 字段字典与遮蔽规则

### 1.1 请求日志字段 (req)

| 字段 | 类型 | 说明 |
|------|------|------|
| ip | string | 客户端IP地址 |
| method | string | HTTP方法 (GET, POST, etc.) |
| path | string | 请求路径 |
| query | object | 查询参数 (已遮蔽敏感字段) |
| uid | string | 用户ID |
| role | string | 用户角色 (student, parent, teacher, admin) |
| ua | string | User-Agent |

### 1.2 响应日志字段 (res)

| 字段 | 类型 | 说明 |
|------|------|------|
| status | number | HTTP状态码 |
| ms | number | 请求处理耗时(毫秒) |
| bytes | number | 响应体大小(字节) |

### 1.3 服务日志字段 (svc)

| 字段 | 类型 | 说明 |
|------|------|------|
| exec.timeMs | number | 执行器耗时(毫秒) |
| exec.timeout | boolean | 是否超时 |
| exec.memMb | number | 内存使用(MB) |
| exec.eventsCount | number | 事件数量 |
| judge.strategy | string | 判题策略 |
| judge.pass | boolean | 是否通过 |
| judge.timeMs | number | 判题耗时(毫秒) |

### 1.4 事件日志字段 (evt)

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 事件名称 |
| payload | object | 事件载荷 |

### 1.5 敏感字段遮蔽规则

以下字段在日志中会被自动遮蔽:

- authorization
- phone
- email
- idCard
- password
- token

遮蔽格式: `原始值前3位****原始值后3位` (如果原始值长度小于等于6位则显示为`****`)

## 2. 日志级别使用规范

### 2.1 info级别

用于记录正常业务流程:

- req_start: 请求开始
- req_end: 请求结束
- event_judge_result: 判题结果
- event_execute_result: 执行结果
- event_auth_decision: 授权决策
- event_export_report: 报告导出

### 2.2 warn级别

用于记录潜在问题或需要关注的情况:

- 超时接近阈值 (>80%)
- 重试操作
- 非致命错误
- ratelimit_block: 速率限制阻断

示例:
```json
{
  "ts": "2025-09-28T12:34:56.789Z",
  "level": "warn",
  "cid": "01JD…",
  "msg": "ratelimit_block",
  "userId": "stu_123",
  "ip": "203.0.113.7"
}
```

### 2.3 error级别

用于记录错误和异常:

- 未捕获异常
- 判题模块崩溃
- 沙盒拒绝执行
- 超时错误

示例:
```json
{
  "ts": "2025-09-28T12:34:56.789Z",
  "level": "error",
  "cid": "01JD…",
  "req": {
    "ip": "203.0.113.7",
    "method": "POST",
    "path": "/execute",
    "uid": "stu_123",
    "role": "student"
  },
  "err": {
    "message": "Execution timed out",
    "stack": "Error: Execution timed out\n    at ...",
    "code": 504
  }
}
```

## 3. 本地复现指引

### 3.1 制造 TIMEOUT 错误

发送一个会超时的执行请求:

```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: stu_test" \
  -d '{
    "language": "python",
    "source": "while True: pass",
    "tests": [{"timeoutMs": 1000}]
  }'
```

预期日志:
```json
{
  "ts": "2025-09-28T12:34:56.789Z",
  "level": "error",
  "cid": "01JD…",
  "msg": "execution_timeout",
  "svc": {
    "exec": {
      "timeMs": 1000,
      "timeout": true
    }
  }
}
```

### 3.2 制造 429 错误 (速率限制)

连续发送超过速率限制的请求:

```bash
# 发送11个请求(超过10 req/min限制)
for i in {1..11}; do
  curl -X POST http://localhost:3001/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: stu_test" \
    -d '{"language": "python", "source": "print(\"hello\")", "tests": []}'
done
```

预期日志:
```json
{
  "ts": "2025-09-28T12:34:56.789Z",
  "level": "warn",
  "cid": "01JD…",
  "msg": "ratelimit_block",
  "userId": "stu_test",
  "ip": "127.0.0.1"
}
```

### 3.3 制造连续 TIMEOUT 封禁

连续发送3个超时请求:

```bash
# 发送3个超时请求
for i in {1..3}; do
  curl -X POST http://localhost:3001/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: stu_test" \
    -d '{
      "language": "python",
      "source": "while True: pass",
      "tests": [{"timeoutMs": 1000}]
    }'
done

# 第4个请求会被封禁
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: stu_test" \
  -d '{
    "language": "python",
    "source": "print(\"hello\")",
    "tests": []
  }'
```

预期日志:
```json
{
  "ts": "2025-09-28T12:34:56.789Z",
  "level": "warn",
  "cid": "01JD…",
  "msg": "user_blocked_due_to_timeouts",
  "userId": "stu_test",
  "timeoutCount": 3
}
```

## 4. Kibana/Grafana 查询样例

### 4.1 使用 cid 关联同一请求的多条日志

在Kibana中查询:
```
cid: "01JD..."
```

### 4.2 过滤特定事件类型

查询所有判题结果:
```
evt.name: "judge_result"
```

查询所有超时错误:
```
level: "error" AND svc.exec.timeout: true
```

查询所有速率限制阻断:
```
msg: "ratelimit_block"
```

### 4.3 Grafana 查询示例

API请求P95耗时:
```
histogram_quantile(0.95, sum(rate(kids_api_request_duration_ms_bucket[5m])) by (le))
```

执行器超时总数:
```
kids_api_execute_timeout_total
```

判题通过率:
```
kids_api_judge_pass_ratio
```