# 代码执行接口契约

## 概述

本文档定义了儿童编程平台的代码执行接口契约，包括执行器API、安全约束、白名单策略和错误处理机制。

## 基础信息

- **基础路径**: `/api/execute`
- **认证方式**: Bearer Token (JWT) 或 Header传递
- **内容类型**: `application/json`
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "ok": true,
  "jobId": "job-uuid",
  "results": [
    {
      "stdout": "Hello World",
      "stderr": "",
      "exitCode": 0,
      "timedOut": false,
      "durationMs": 150,
      "usage": {
        "cpuSeconds": 0.1,
        "memoryBytes": 1024000
      }
    }
  ],
  "traceId": "trace-uuid",
  "userId": "user-uuid"
}
```

### 错误响应

```json
{
  "ok": false,
  "error": "错误描述",
  "issues": ["具体问题列表"],
  "traceId": "trace-uuid",
  "userId": "user-uuid"
}
```

---

## T5-1｜执行接口契约与白名单策略

### 代码执行接口

**接口**: `POST /api/execute`

**请求体**:

```json
{
  "language": "python",
  "source": "print('Hello World')",
  "stdin": "",
  "tests": [
    {
      "stdin": "test input",
      "timeoutMs": 5000,
      "expectedStdout": "expected output"
    }
  ]
}
```

**请求参数说明**:

| 参数       | 类型   | 必填 | 描述                          |
| ---------- | ------ | ---- | ----------------------------- |
| `language` | string | 是   | 编程语言，目前仅支持 `python` |
| `source`   | string | 是   | 源代码内容                    |
| `stdin`    | string | 否   | 标准输入（已废弃，使用tests） |
| `tests`    | array  | 否   | 测试用例数组，最多10个        |

**测试用例参数**:

| 参数             | 类型   | 必填 | 描述                        |
| ---------------- | ------ | ---- | --------------------------- |
| `stdin`          | string | 否   | 标准输入                    |
| `timeoutMs`      | number | 否   | 超时时间（毫秒），200-10000 |
| `expectedStdout` | string | 否   | 期望的标准输出              |

**响应字段说明**:

| 字段      | 类型    | 描述         |
| --------- | ------- | ------------ |
| `ok`      | boolean | 执行是否成功 |
| `jobId`   | string  | 任务ID       |
| `results` | array   | 执行结果数组 |
| `traceId` | string  | 追踪ID       |
| `userId`  | string  | 用户ID       |

**执行结果字段**:

| 字段         | 类型    | 描述             |
| ------------ | ------- | ---------------- |
| `stdout`     | string  | 标准输出         |
| `stderr`     | string  | 标准错误         |
| `exitCode`   | number  | 退出码           |
| `timedOut`   | boolean | 是否超时         |
| `durationMs` | number  | 执行时长（毫秒） |
| `usage`      | object  | 资源使用情况     |

**资源使用字段**:

| 字段          | 类型   | 描述               |
| ------------- | ------ | ------------------ |
| `cpuSeconds`  | number | CPU使用时间（秒）  |
| `memoryBytes` | number | 内存使用量（字节） |

---

## 安全约束与限制

### 网络访问限制

- **禁网策略**: 执行环境完全隔离，无法访问外部网络
- **DNS解析**: 禁用DNS解析功能
- **端口访问**: 禁止访问任何网络端口

### 资源限制

| 资源类型     | 限制值 | 描述                 |
| ------------ | ------ | -------------------- |
| **CPU时间**  | 2.0秒  | 单次执行最大CPU时间  |
| **内存**     | 256MB  | 单次执行最大内存使用 |
| **执行时长** | 10秒   | 单次执行最大时长     |
| **并发数**   | 10个   | 最大并发执行任务数   |
| **队列长度** | 100个  | 最大排队任务数       |

### 白名单策略

#### Python模块白名单

**默认允许的模块**:

```json
[
  "math",
  "random",
  "statistics",
  "datetime",
  "json",
  "re",
  "string",
  "collections",
  "itertools",
  "functools"
]
```

**禁止的模块类型**:

- 文件系统操作: `os`, `sys`, `pathlib`, `shutil`
- 网络访问: `urllib`, `requests`, `socket`, `http`
- 进程控制: `subprocess`, `multiprocessing`, `threading`
- 系统调用: `ctypes`, `platform`, `importlib`
- 危险操作: `eval`, `exec`, `compile`

#### 静态分析检查

执行前会进行静态代码分析，检查：

1. **导入检查**: 验证所有import语句是否在白名单中
2. **危险函数**: 检测eval、exec等危险函数调用
3. **文件操作**: 检测文件读写操作
4. **网络操作**: 检测网络相关代码
5. **系统调用**: 检测系统级操作

---

## 错误码与处理

### 错误码定义

| 错误码                   | HTTP状态码 | 描述             |
| ------------------------ | ---------- | ---------------- |
| `VALIDATION_ERROR`       | 400        | 请求参数验证失败 |
| `UNSUPPORTED_LANGUAGE`   | 400        | 不支持的编程语言 |
| `STATIC_ANALYSIS_FAILED` | 400        | 静态分析失败     |
| `BLACKLISTED_MODULE`     | 400        | 使用了黑名单模块 |
| `DANGEROUS_CODE`         | 400        | 检测到危险代码   |
| `EXECUTION_TIMEOUT`      | 504        | 执行超时         |
| `MEMORY_LIMIT_EXCEEDED`  | 507        | 内存使用超限     |
| `CPU_LIMIT_EXCEEDED`     | 507        | CPU时间超限      |
| `QUEUE_FULL`             | 503        | 执行队列已满     |
| `RATE_LIMIT_EXCEEDED`    | 429        | 请求频率过高     |
| `INTERNAL_ERROR`         | 500        | 服务器内部错误   |

### 错误响应示例

#### 黑名单模块错误

```json
{
  "ok": false,
  "error": "Source failed safety checks",
  "issues": ["Import of 'os' module is not allowed", "Import of 'requests' module is not allowed"],
  "traceId": "trace-uuid",
  "userId": "user-uuid"
}
```

#### 执行超时错误

```json
{
  "ok": false,
  "error": "Execution timed out while waiting for results.",
  "traceId": "trace-uuid",
  "userId": "user-uuid"
}
```

#### 内存超限错误

```json
{
  "ok": false,
  "error": "Memory limit exceeded",
  "issues": ["Process used 300MB, limit is 256MB"],
  "traceId": "trace-uuid",
  "userId": "user-uuid"
}
```

#### 危险代码错误

```json
{
  "ok": false,
  "error": "Source failed safety checks",
  "issues": ["Use of 'eval' function is not allowed", "File operations are not permitted"],
  "traceId": "trace-uuid",
  "userId": "user-uuid"
}
```

---

## 限流与保护

### 请求限流

| 限制类型   | 限制值      | 时间窗口 |
| ---------- | ----------- | -------- |
| **单用户** | 10次/分钟   | 1分钟    |
| **单IP**   | 100次/分钟  | 1分钟    |
| **全局**   | 1000次/分钟 | 1分钟    |

### 队列管理

- **优先级**: 按请求时间FIFO处理
- **超时**: 队列中任务最多等待30秒
- **清理**: 超时任务自动清理

### 监控指标

- **执行次数**: 总执行次数统计
- **平均耗时**: 执行平均时长
- **失败率**: 执行失败比例
- **队列长度**: 当前排队任务数
- **资源使用**: CPU和内存使用统计

---

## WebSocket实时通信

### 连接地址

```
ws://executor-host:4070/run-results/{jobId}
```

### 消息格式

#### 执行结果消息

```json
{
  "type": "run-result",
  "payload": {
    "stdout": "Hello World",
    "stderr": "",
    "exitCode": 0,
    "timedOut": false,
    "durationMs": 150
  }
}
```

#### 错误消息

```json
{
  "type": "error",
  "payload": {
    "message": "Execution failed",
    "code": "EXECUTION_ERROR"
  }
}
```

---

## 配置参数

### 环境变量

| 变量名                     | 默认值    | 描述              |
| -------------------------- | --------- | ----------------- |
| `EXECUTOR_PORT`            | 4060      | HTTP服务端口      |
| `EXECUTOR_WS_PORT`         | 4070      | WebSocket服务端口 |
| `EXECUTOR_TIMEOUT_MS`      | 10000     | 执行超时时间      |
| `EXECUTOR_MEMORY_LIMIT`    | 268435456 | 内存限制（字节）  |
| `EXECUTOR_CPU_LIMIT`       | 2.0       | CPU时间限制（秒） |
| `EXECUTOR_MAX_CONCURRENCY` | 10        | 最大并发数        |
| `EXECUTOR_QUEUE_SIZE`      | 100       | 队列大小          |

### Docker配置

- **镜像**: `kids-coding/python-executor:latest`
- **网络**: 无网络访问
- **存储**: 临时文件系统
- **用户**: 非root用户执行

---

## 使用示例

### 基本执行

```bash
curl -X POST http://localhost:4060/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -H "X-Trace-Id: trace-456" \
  -d '{
    "language": "python",
    "source": "print(\"Hello World\")",
    "tests": [{"stdin": ""}]
  }'
```

### 带测试用例的执行

```bash
curl -X POST http://localhost:4060/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "source": "import sys\nprint(sys.stdin.read().strip().upper())",
    "tests": [
      {
        "stdin": "hello world",
        "expectedStdout": "HELLO WORLD",
        "timeoutMs": 3000
      }
    ]
  }'
```

### WebSocket连接

```javascript
const jobId = 'job-uuid';
const ws = new WebSocket(`ws://localhost:4070/run-results/${jobId}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'run-result') {
    console.log('Output:', data.payload.stdout);
  }
};
```

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 执行器团队  
**审核状态**: 待审核
