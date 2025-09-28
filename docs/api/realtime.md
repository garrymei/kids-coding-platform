# Realtime（WebSocket）

## 频道
- `run-results/<sessionId>`：运行结果推送
- `notifications/<userId>`：系统通知

## 连接
- `ws(s)://<host>/ws?token=<jwt>`
- 心跳：客户端每 30s ping；服务器 35s 超时断开

## 重连策略
- 指数退避：1s, 2s, 4s, 8s, ... 上限 30s
- 消息有 `seq`，客户端按序处理，丢失用 `resync` 指令补齐

## 消息示例
```json
{"ch":"run-results/run_abc123","type":"started","ts":1695100000}
{"ch":"run-results/run_abc123","type":"progress","pct":60}
{"ch":"run-results/run_abc123","type":"finished","ok":true,"stdout":"hello\n","timeMs":120}
```