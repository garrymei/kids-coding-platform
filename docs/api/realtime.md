# WebSocket 实时通信 API

## 概述

WebSocket 服务提供实时通信功能，支持运行结果推送和用户通知。

## 连接方式

### 连接 URL

```
ws://localhost:3001?token=<JWT_TOKEN>
```

### 认证

连接时必须提供有效的 JWT token 作为查询参数。

## 频道规划

### 1. 运行结果频道

**频道名称**: `run-results/<sessionId>`

**用途**: 推送代码执行结果

**订阅方式**:

```javascript
ws.send(
  JSON.stringify({
    type: 'subscribe',
    channel: 'run-results/session-123',
  }),
);
```

**消息格式**:

```json
{
  "type": "run-results",
  "channel": "run-results/session-123",
  "data": {
    "stdout": "Hello, World!",
    "stderr": "",
    "exitCode": 0,
    "duration": 150
  },
  "timestamp": 1640995200000
}
```

### 2. 用户通知频道

**频道名称**: `notifications/<userId>`

**用途**: 推送用户相关的通知

**订阅方式**:

```javascript
ws.send(
  JSON.stringify({
    type: 'subscribe',
    channel: 'notifications/user-456',
  }),
);
```

**消息格式**:

```json
{
  "type": "notifications",
  "channel": "notifications/user-456",
  "data": {
    "title": "新的访问请求",
    "message": "家长张先生申请查看您的学习数据",
    "action": "approve_request",
    "requestId": "req-789"
  },
  "timestamp": 1640995200000
}
```

## 消息类型

### 客户端发送

#### 1. 订阅频道

```json
{
  "type": "subscribe",
  "channel": "频道名称"
}
```

#### 2. 取消订阅

```json
{
  "type": "unsubscribe",
  "channel": "频道名称"
}
```

#### 3. 心跳

```json
{
  "type": "heartbeat"
}
```

### 服务端发送

#### 1. 连接确认

```json
{
  "type": "connected",
  "message": "WebSocket connection established",
  "userId": "user-123"
}
```

#### 2. 订阅确认

```json
{
  "type": "subscribed",
  "channel": "频道名称"
}
```

#### 3. 取消订阅确认

```json
{
  "type": "unsubscribed",
  "channel": "频道名称"
}
```

#### 4. 心跳响应

```json
{
  "type": "heartbeat",
  "timestamp": 1640995200000
}
```

#### 5. 错误消息

```json
{
  "type": "error",
  "message": "错误描述"
}
```

## 心跳与重连策略

### 心跳机制

- **服务端心跳**: 每30秒发送一次 ping
- **客户端心跳**: 可主动发送心跳消息
- **心跳超时**: 如果30秒内没有收到 pong 响应，连接将被关闭

### 重连策略

建议客户端实现以下重连策略：

```javascript
class WebSocketClient {
  constructor(token) {
    this.token = token;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1秒
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(`ws://localhost:3001?token=${this.token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'run-results':
        this.onRunResult(message.data);
        break;
      case 'notifications':
        this.onNotification(message.data);
        break;
      case 'heartbeat':
        this.onHeartbeat(message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  subscribe(channel) {
    this.ws.send(
      JSON.stringify({
        type: 'subscribe',
        channel: channel,
      }),
    );
  }

  unsubscribe(channel) {
    this.ws.send(
      JSON.stringify({
        type: 'unsubscribe',
        channel: channel,
      }),
    );
  }

  sendHeartbeat() {
    this.ws.send(
      JSON.stringify({
        type: 'heartbeat',
      }),
    );
  }
}
```

## 使用示例

### 学生端 - 监听代码执行结果

```javascript
const wsClient = new WebSocketClient(userToken);

// 订阅运行结果频道
wsClient.subscribe(`run-results/${sessionId}`);

wsClient.onRunResult = (result) => {
  console.log('代码执行结果:', result);
  // 更新UI显示结果
};
```

### 家长端 - 监听通知

```javascript
const wsClient = new WebSocketClient(parentToken);

// 订阅通知频道
wsClient.subscribe(`notifications/${userId}`);

wsClient.onNotification = (notification) => {
  console.log('收到通知:', notification);
  // 显示通知弹窗
};
```

## 安全考虑

1. **认证**: 所有连接都需要有效的 JWT token
2. **频道隔离**: 用户只能订阅自己相关的频道
3. **消息验证**: 服务端验证所有消息格式
4. **连接限制**: 每个用户最多允许5个并发连接

## 错误处理

### 连接错误

- **1008**: 认证失败 - token 无效或缺失
- **1000**: 正常关闭
- **1006**: 异常关闭

### 消息错误

```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

## 性能优化

1. **消息压缩**: 大消息自动压缩
2. **批量发送**: 多个小消息合并发送
3. **连接池**: 限制并发连接数
4. **消息队列**: 离线消息缓存
