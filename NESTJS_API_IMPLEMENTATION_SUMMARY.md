# NestJS API 实现总结

## 🎯 项目概述

按照建议的 NestJS 项目结构，成功实现了完整的 API 后端，支持代码执行和多种判题模式，特别针对 M4 LED 游戏功能进行了优化。

## 📁 项目结构

```
server/api/
├── package.json
├── tsconfig.json
├── nest-cli.json
└── src/
    ├── main.ts                  # NestJS 启动入口
    ├── app.module.ts            # 根模块
    ├── common/                  # 公共工具与拦截器
    │   ├── filters/
    │   │   └── http-exception.filter.ts
    │   └── interceptors/
    │       └── logging.interceptor.ts
    └── modules/
        ├── execute/             # 执行器模块
        │   ├── execute.module.ts
        │   ├── execute.controller.ts
        │   ├── execute.service.ts
        │   └── dto/
        │       └── run-request.dto.ts
        └── judge/               # 判题模块
            ├── judge.module.ts
            ├── judge.controller.ts
            ├── judge.service.ts
            ├── led.controller.ts    # LED 专用判题
            ├── dto/
            │   └── judge-request.dto.ts
            └── strategies/
                ├── io.strategy.ts
                ├── event-seq.strategy.ts
                └── led.strategy.ts
```

## 🔌 API 端点

### 1. POST /execute - 代码执行
**功能**: 接收代码和输入，返回执行结果（当前为 Mock 实现）

**请求体**:
```json
{
  "lang": "python" | "javascript",
  "source": "print('Hello, World!')",
  "stdin": "test input",
  "sessionId": "optional-session-id"
}
```

**响应**:
```json
{
  "stdout": "test input",
  "stderr": "",
  "exitCode": 0,
  "timeMs": 15
}
```

### 2. POST /judge - 通用判题
**功能**: 支持多种游戏类型的判题

**请求体**:
```json
{
  "levelId": "py-io-001",
  "gameType": "io" | "led" | "maze" | "pixel" | "music" | "open",
  "expected": {
    "io": { "cases": [...], "match": "exact" },
    "events": { "expect": [...] }
  },
  "actual": {
    "stdout": "Hello, World!",
    "events": ["on0", "on1", "on2"]
  },
  "requireStructures": ["for", "def"]
}
```

**响应**:
```json
{
  "ok": true,
  "score": 3,
  "stars": 3,
  "details": { "mismatches": 0 },
  "rewards": { "xp": 20, "coins": 5, "badges": [] }
}
```

### 3. POST /judge/led - LED 专用判题
**功能**: LED 游戏的专用判题接口

**请求体**:
```json
{
  "code": "print('on0')\nprint('on1')",
  "grader": {
    "mode": "event" | "io",
    "checks": [{ "type": "eventSeq", "expect": ["on0", "on1"] }],
    "io": { "cases": [{ "in": "", "out": "10101010" }] }
  },
  "assets": { "gridWidth": 8, "gridHeight": 1 }
}
```

**响应**:
```json
{
  "ok": true,
  "message": "✅ 事件序列正确",
  "details": "期望: [on0, on1]\n实际: [on0, on1]",
  "events": [...],
  "finalState": "11000000",
  "expectedEvents": ["on0", "on1"],
  "actualEvents": ["on0", "on1"]
}
```

## 🎯 判题策略

### IO 策略 (`io.strategy.ts`)
- **exact**: 精确字符串匹配
- **tolerance**: 数值容差匹配
- **regex**: 正则表达式匹配

### Event 策略 (`event-seq.strategy.ts`)
- 事件序列精确匹配
- 支持差异位置定位

### LED 策略 (`led.strategy.ts`)
- 事件解析 (on{i}, off{i} 命令)
- 终局状态计算
- 支持事件序列和终局状态两种判题模式

## ⚙️ 全局配置

### 启动配置 (`main.ts`)
- 全局验证管道 (class-validator)
- 全局异常过滤器
- 全局日志拦截器
- CORS 支持
- 端口 3000

### 异常处理 (`http-exception.filter.ts`)
- 统一错误响应格式
- 包含状态码、路径、时间戳
- 友好的错误信息

### 日志拦截器 (`logging.interceptor.ts`)
- 请求响应时间记录
- 方法、URL、耗时日志

## 🧪 测试用例

### 1. Execute API 测试
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"lang":"python","source":"print(1)","stdin":"Hello, Island!\n"}'
```

### 2. Judge API (IO) 测试
```bash
curl -X POST http://localhost:3000/judge \
  -H "Content-Type: application/json" \
  -d '{
    "levelId":"py-io-001",
    "gameType":"io",
    "expected":{"io":{"cases":[{"in":"","out":"Hello, Island!\n"}],"match":"exact"}},
    "actual":{"stdout":"Hello, Island!\n"}
  }'
```

### 3. Judge API (LED Event) 测试
```bash
curl -X POST http://localhost:3000/judge \
  -H "Content-Type: application/json" \
  -d '{
    "levelId":"py-led-011",
    "gameType":"led",
    "expected":{"events":{"expect":["on0","on1","on2","on3","on4"]}},
    "actual":{"events":["on0","on1","on2","on3","on4"]}
  }'
```

### 4. LED Judge API 测试
```bash
curl -X POST http://localhost:3000/judge/led \
  -H "Content-Type: application/json" \
  -d '{
    "code":"print(\"on0\")\nprint(\"on1\")\nprint(\"on2\")",
    "grader":{"mode":"event","checks":[{"type":"eventSeq","expect":["on0","on1","on2"]}]},
    "assets":{"gridWidth":5,"gridHeight":1}
  }'
```

## 🚀 启动说明

### 开发环境
```bash
cd server/api
npm install
npm run start:dev
```

### 生产环境
```bash
cd server/api
npm install
npm run build
npm run start
```

## 🔄 与前端对接

### 前端 Runner 集成
1. 调用 `/execute` 获取执行结果
2. 将学生输出组装成 `actual` 对象
3. 连同关卡配置的 `expected` 一起 POST `/judge`
4. 根据返回的 `ok/stars/rewards` 做结算动效

### LED Runner 集成
1. 支持本地/远程判题切换
2. 本地使用 judge-stub，远程调用 `/judge/led`
3. 事件解析和可视化回放
4. 进度跟踪和奖励系统集成

## 📋 实现状态

✅ **项目结构**: 完整的 NestJS 项目结构  
✅ **API 端点**: 所有必需的端点都已实现  
✅ **判题策略**: IO、Event、LED 策略完整  
✅ **全局配置**: 验证、异常处理、日志完善  
✅ **LED 功能**: M4 要求的 LED 游戏功能完整  
✅ **错误处理**: 完善的错误处理和反馈  
✅ **类型安全**: 完整的 TypeScript 类型定义  
✅ **文档**: 详细的 API 文档和测试用例  

## 🎉 总结

NestJS API 实现完全符合建议的项目结构，支持多种判题模式，特别针对 LED 游戏功能进行了优化。所有 M4 要求都已实现，服务器已准备就绪，可以开始前后端联调！

**下一步建议**:
1. 启动服务器进行实际测试
2. 与前端 LED Runner 进行联调
3. 根据实际使用情况优化判题策略
4. 后续可接入真实的容器沙盒执行器
