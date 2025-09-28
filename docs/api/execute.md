# 执行接口（Blockly → 代码 → 执行）

## 运行代码
POST /execute
Auth: student (token)
Body:
```json
{
  "lang": "python",
  "source": "print('hello')",
  "stdin": "",
  "tests": [{"input":"","expect":"hello\n"}],
  "sessionId": "run_abc123"
}
```

### Constraints:

- 禁网；CPU/内存/时长上限（例如 1 vCPU / 256MB / 5s）
- 仅白名单库（如 math, random；第三方需平台预装）
- 路径/进程隔离；禁止 import os, sys 等危险调用（示例）

### 200
```json
{
  "stdout": "hello\n",
  "stderr": "",
  "exitCode": 0,
  "timeMs": 120,
  "tests": [{"passed": true, "actual": "hello\n"}]
}
```

### 4xx/5xx

- **400 lang_not_supported**: 不支持的语言
- **422 compile_or_runtime_error**: 编译或运行时错误
- **429 rate_limited**: 请求限流
- **500 executor_unavailable**: 执行器不可用

```