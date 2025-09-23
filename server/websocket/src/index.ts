import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';

// Node.js types
declare const process: {
  env: {
    JWT_SECRET?: string;
    WEBSOCKET_PORT?: string;
  };
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  sessionId?: string;
}

interface WebSocketMessage {
  type: 'run-results' | 'notifications' | 'heartbeat' | 'subscribe' | 'unsubscribe';
  data?: unknown;
  channel?: string;
}

class WebSocketService {
  private wss: WebSocketServer;
  private channels = new Map<string, Set<AuthenticatedWebSocket>>();
  private userSockets = new Map<string, Set<AuthenticatedWebSocket>>();

  constructor(port: number) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      this.handleConnection(ws, request);
    });

    server.listen(port, () => {
      console.log(`WebSocket server listening on port ${port}`);
    });

    // 心跳检测
    setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // 30秒心跳
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: unknown) {
    const url = parse(request.url || '', true);
    const token = url.query.token as string;

    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
      ws.userId = decoded.sub;
      ws.role = decoded.role;

      // eslint-disable-next-line no-console
      console.log(`User ${ws.userId} connected with role ${ws.role}`);

      // 添加到用户套接字映射
      if (!this.userSockets.has(ws.userId)) {
        this.userSockets.set(ws.userId, new Set());
      }
      this.userSockets.get(ws.userId)!.add(ws);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Invalid token:', error);
      ws.close(1008, 'Invalid token');
      return;
    }

    ws.on('message', (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Invalid message format:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('pong', () => {
      // 心跳响应
    });

    // 发送连接确认
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        userId: ws.userId,
      }),
    );
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'subscribe':
        this.subscribeToChannel(ws, message.channel!);
        break;
      case 'unsubscribe':
        this.unsubscribeFromChannel(ws, message.channel!);
        break;
      case 'heartbeat':
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        break;
      default:
        // eslint-disable-next-line no-console
        console.log('Unknown message type:', message.type);
    }
  }

  private subscribeToChannel(ws: AuthenticatedWebSocket, channel: string) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(ws);

    // eslint-disable-next-line no-console
    console.log(`User ${ws.userId} subscribed to channel ${channel}`);
    ws.send(
      JSON.stringify({
        type: 'subscribed',
        channel: channel,
      }),
    );
  }

  private unsubscribeFromChannel(ws: AuthenticatedWebSocket, channel: string) {
    const channelSockets = this.channels.get(channel);
    if (channelSockets) {
      channelSockets.delete(ws);
      if (channelSockets.size === 0) {
        this.channels.delete(channel);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`User ${ws.userId} unsubscribed from channel ${channel}`);
    ws.send(
      JSON.stringify({
        type: 'unsubscribed',
        channel: channel,
      }),
    );
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userSockets = this.userSockets.get(ws.userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          this.userSockets.delete(ws.userId);
        }
      }
    }

    // 从所有频道中移除
    this.channels.forEach((sockets, channel) => {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.channels.delete(channel);
      }
    });

    // eslint-disable-next-line no-console
    console.log(`User ${ws.userId} disconnected`);
  }

  // 发送运行结果到特定会话
  public sendRunResult(sessionId: string, result: unknown) {
    const channel = `run-results/${sessionId}`;
    const channelSockets = this.channels.get(channel);

    if (channelSockets) {
      const message = {
        type: 'run-results',
        channel: channel,
        data: result,
        timestamp: Date.now(),
      };

      channelSockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // 发送通知到特定用户
  public sendNotification(userId: string, notification: unknown) {
    const channel = `notifications/${userId}`;
    const channelSockets = this.channels.get(channel);

    if (channelSockets) {
      const message = {
        type: 'notifications',
        channel: channel,
        data: notification,
        timestamp: Date.now(),
      };

      channelSockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // 广播消息到所有连接
  public broadcast(message: unknown) {
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// 启动 WebSocket 服务
const port = Number(process.env.WEBSOCKET_PORT) || 3001;
const wsService = new WebSocketService(port);

// 导出服务实例供其他模块使用
export default wsService;

// 示例：定期发送测试消息
setInterval(() => {
  wsService.broadcast({
    type: 'heartbeat',
    message: 'Server heartbeat',
    timestamp: Date.now(),
  });
}, 60000); // 每分钟发送一次心跳
