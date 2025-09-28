# Docker 容器化执行器

## 概述

Docker 容器化执行器为儿童编程平台提供安全的代码执行环境，通过容器隔离确保用户代码无法影响主机系统。

## 安全特性

### 🔒 容器隔离
- **网络隔离**: `--network none` 禁用所有网络访问
- **文件系统隔离**: 只读文件系统 + 临时文件系统
- **用户隔离**: 非 root 用户运行
- **资源限制**: CPU、内存、进程数限制

### 🛡️ 资源限制
- **内存限制**: 128MB
- **CPU 限制**: 0.5 核心
- **进程数限制**: 64 个进程
- **执行超时**: 3-10 秒

### 📦 白名单库
只安装安全的 Python 库：
- `numpy` - 数学计算
- `scipy` - 科学计算
- `pandas` - 数据处理
- `Pillow` - 图像处理
- `python-dateutil` - 日期处理

## 快速开始

### 1. 构建镜像

```bash
cd server/executor/docker
./build.sh
```

### 2. 运行安全测试

```bash
node security-tests.js
```

### 3. 配置环境变量

```bash
# 启用 Docker 执行器
export USE_DOCKER=true

# 或设置生产环境
export NODE_ENV=production
```

## 使用方法

### 基本用法

```typescript
import { dockerRunner } from './dockerRunner';

const result = await dockerRunner.run({
  source: 'print("Hello World")',
  stdin: '',
  timeoutMs: 3000
});

console.log(result.stdout); // "Hello World"
```

### 在 ExecuteService 中使用

```typescript
// 自动选择执行器
if (USE_DOCKER) {
  return this.runPythonWithDocker(code, stdin, timeoutMs, started);
} else {
  return this.runPythonWithLocalExecutor(code, stdin, timeoutMs, started);
}
```

## 安全测试

### 测试用例

1. **系统命令执行测试**
   ```python
   import os
   os.system('ls /')  # 应该失败
   ```

2. **死循环超时测试**
   ```python
   while True:
       pass  # 应该被超时杀死
   ```

3. **内存炸弹测试**
   ```python
   data = 'x' * (10**9)  # 应该触发 OOM
   ```

4. **网络访问测试**
   ```python
   import urllib.request
   urllib.request.urlopen('http://www.google.com')  # 应该失败
   ```

5. **文件系统写入测试**
   ```python
   with open('/etc/test.txt', 'w') as f:
       f.write('test')  # 应该失败
   ```

6. **并发执行测试**
   - 同时运行 5 个容器
   - 验证独立性和隔离性

### 运行测试

```bash
node security-tests.js
```

期望输出：
```
🔒 开始 Docker 容器安全测试...

🧪 运行测试: 系统命令执行测试
✅ 通过
   详情: 退出码: 1, 错误: Error: [Errno 2] No such file or directory

🧪 运行测试: 死循环超时测试
✅ 通过
   详情: 超时: true, 持续时间: 3500ms

🧪 运行测试: 内存炸弹测试
✅ 通过
   详情: 退出码: 137, 错误: Memory error: cannot allocate memory

🧪 运行测试: 网络访问测试
✅ 通过
   详情: 退出码: 1, 错误: Network error: [Errno 101] Network is unreachable

🧪 运行测试: 文件系统写入测试
✅ 通过
   详情: 退出码: 1, 错误: File write error: [Errno 30] Read-only file system

🧪 运行测试: 并发执行测试
✅ 通过
   详情: 所有进程完成: true, 唯一输出数: 5

📊 安全测试总结:
==================================================
✅ 系统命令执行测试: 退出码: 1, 错误: Error: [Errno 2] No such file or directory
✅ 死循环超时测试: 超时: true, 持续时间: 3500ms
✅ 内存炸弹测试: 退出码: 137, 错误: Memory error: cannot allocate memory
✅ 网络访问测试: 退出码: 1, 错误: Network error: [Errno 101] Network is unreachable
✅ 文件系统写入测试: 退出码: 1, 错误: File write error: [Errno 30] Read-only file system
✅ 并发执行测试: 所有进程完成: true, 唯一输出数: 5
==================================================
总计: 6/6 通过
🎉 所有安全测试通过！容器环境安全可靠。
```

## 配置选项

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `USE_DOCKER` | `false` | 启用 Docker 执行器 |
| `NODE_ENV` | `development` | 生产环境自动启用 Docker |

### 资源限制

| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | 128MB | 防止内存炸弹 |
| CPU | 0.5 核心 | 限制计算资源 |
| 进程数 | 64 | 防止进程炸弹 |
| 网络 | 禁用 | 防止网络攻击 |
| 文件系统 | 只读 | 防止文件系统攻击 |

## 故障排除

### 常见问题

1. **Docker 不可用**
   ```
   Error: Docker is not available
   ```
   解决：确保 Docker 已安装并运行

2. **镜像不存在**
   ```
   Error: Docker image kids-code-python:latest not found
   ```
   解决：运行 `./build.sh` 构建镜像

3. **权限问题**
   ```
   Error: permission denied
   ```
   解决：确保用户有 Docker 权限

4. **资源不足**
   ```
   Error: no space left on device
   ```
   解决：清理 Docker 镜像和容器

### 调试模式

```bash
# 启用详细日志
export DEBUG=docker-runner

# 手动测试容器
docker run --rm --network none --memory=128m --cpus=0.5 kids-code-python:latest python3 -c "print('Hello World')"
```

## 性能优化

### 容器预热

```typescript
// 预热容器，减少首次执行延迟
await dockerRunner.isAvailable();
await dockerRunner.isImageAvailable();
```

### 并发控制

```typescript
// 限制并发容器数量
const MAX_CONCURRENT_CONTAINERS = 10;
const semaphore = new Semaphore(MAX_CONCURRENT_CONTAINERS);
```

### 缓存策略

```typescript
// 缓存常用代码执行结果
const cache = new Map();
const cacheKey = hash(code + stdin);
```

## 监控和日志

### 执行统计

```typescript
interface ExecutionStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  timeoutRate: number;
  errorRate: number;
}
```

### 安全事件

```typescript
interface SecurityEvent {
  timestamp: Date;
  userId: string;
  codeHash: string;
  eventType: 'timeout' | 'oom' | 'permission_denied' | 'network_blocked';
  details: any;
}
```

## 最佳实践

1. **定期更新镜像**: 保持基础镜像和依赖库最新
2. **监控资源使用**: 跟踪 CPU、内存使用情况
3. **日志审计**: 记录所有执行和安全事件
4. **备份策略**: 定期备份容器配置和数据
5. **安全扫描**: 定期扫描镜像漏洞

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 添加测试用例
4. 运行安全测试
5. 提交 Pull Request

## 许可证

MIT License
