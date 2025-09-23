# WebSocket 服务

实时通信服务，支持运行结果推送和通知系统。

## 功能特性

- **JWT 认证**: 基于 JWT 的 WebSocket 连接认证
- **频道订阅**: 支持按频道订阅消息
- **运行结果推送**: `run-results/<sessionId>` 频道
- **通知系统**: `notifications/<userId>` 频道
- **心跳检测**: 自动检测连接状态
- **重连策略**: 客户端自动重连机制

## 频道规范

### 运行结果频道

- **格式**: `run-results/<sessionId>`
- **用途**: 推送代码执行结果
- **示例**: `run-results/abc123-def456-ghi789`

### 通知频道

- **格式**: `notifications/<userId>`
- **用途**: 推送用户通知
- **示例**: `notifications/95ed77bf-074b-448f-8d7a-0a4f83fac000`

## 消息格式

### 客户端发送

```json
{
  "type": "subscribe|unsubscribe|heartbeat",
  "channel": "run-results/sessionId",
  "data": {}
}
```

### 服务端推送

```json
{
  "type": "run-results|notifications|heartbeat",
  "channel": "run-results/sessionId",
  "data": {},
  "timestamp": 1640995200000
}
```

## 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build && pnpm start
```

## 环境变量

- `WEBSOCKET_PORT`: WebSocket 服务端口 (默认: 3001)
- `JWT_SECRET`: JWT 密钥 (默认: your-secret-key)

## 客户端连接示例

```javascript
const token = 'your-jwt-token';
const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

ws.onopen = () => {
  // 订阅运行结果频道
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      channel: 'run-results/session123',
    }),
  );
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```
