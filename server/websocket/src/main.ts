import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import pino from 'pino';
import { channels } from './channels.js';

const logger = pino({ name: 'kids-websocket', level: process.env.LOG_LEVEL ?? 'info' });

const port = Number(process.env.WS_PORT ?? 4070);

// 限制每个用户的并发连接数
const MAX_CONNECTIONS_PER_USER = 5;
const userConnections = new Map<string, Set<WebSocket>>();

const httpServer = createServer();
const wss = new WebSocketServer({ 
  server: httpServer,
  // 限制总连接数
  maxPayload: 1024 * 1024 // 1MB
});

// 清理断开的连接
function cleanupConnections(userId: string, socket: WebSocket) {
  const userSockets = userConnections.get(userId);
  if (userSockets) {
    userSockets.delete(socket);
    if (userSockets.size === 0) {
      userConnections.delete(userId);
    }
  }
}

function startHeartbeat(socket: WebSocket) {
  const interval = setInterval(() => {
    if (socket.readyState !== WebSocket.OPEN) {
      clearInterval(interval);
      return;
    }
    socket.ping();
  }, 15000);

  socket.on('close', () => clearInterval(interval));
  socket.on('error', (error) => logger.warn({ err: error }, 'ws_client_error'));

  return interval;
}

// 优化消息发送
function sendStubMessage(socket: WebSocket, channel: string) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    let message;
    if (channel.startsWith('run-results/')) {
      const sessionId = channel.split('/')[1] ?? 'demo-session';
      message = {
        channel,
        type: 'run-result',
        payload: {
          sessionId,
          status: 'completed',
          stdout: ['print("Hello Blocks!")'],
          generatedAt: new Date().toISOString(),
        },
      };
    } else if (channel.startsWith('notifications/')) {
      const userId = channel.split('/')[1] ?? 'demo-user';
      message = {
        channel,
        type: 'notification',
        payload: {
          userId,
          title: '练习提醒',
          body: '今日 Blockly 闯关开启，别忘了完成实验室任务哦！',
          sentAt: new Date().toISOString(),
        },
      };
    } else {
      message = {
        channel,
        type: 'error',
        payload: { message: 'Unknown channel. Expected run-results/<sessionId> or notifications/<userId>.' },
      };
    }
    
    // 使用异步发送避免阻塞
    setImmediate(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    });
  } catch (error) {
    logger.error({ err: error, channel }, 'Failed to send stub message');
  }
}

// 检查用户连接数限制
function checkConnectionLimit(userId: string): boolean {
  const userSockets = userConnections.get(userId) || new Set();
  return userSockets.size < MAX_CONNECTIONS_PER_USER;
}

wss.on('connection', (socket, request) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const channel = url.pathname.replace(/^\//, '') || 'notifications/demo-user';
    
    // 从查询参数或频道中提取用户ID
    const userId = url.searchParams.get('userId') || 
                  (channel.startsWith('notifications/') ? channel.split('/')[1] : 'anonymous');

    // 检查连接限制
    if (!checkConnectionLimit(userId)) {
      logger.warn({ userId, channel }, 'Connection limit exceeded');
      socket.close(1008, 'Connection limit exceeded');
      return;
    }

    // 记录用户连接
    const userSockets = userConnections.get(userId) || new Set();
    userSockets.add(socket);
    userConnections.set(userId, userSockets);

    logger.info({ msg: 'client_connected', channel, userId, connections: userSockets.size });

    // 发送欢迎消息
    socket.send(
      JSON.stringify({
        channel,
        type: 'welcome',
        payload: {
          heartbeatIntervalMs: 15000,
          channels,
        },
      }),
    );

    const heartbeatInterval = startHeartbeat(socket);

    // 发送示例消息
    setTimeout(() => sendStubMessage(socket, channel), 1000);

    // 监听连接关闭
    socket.on('close', () => {
      cleanupConnections(userId, socket);
      clearInterval(heartbeatInterval);
      logger.info({ msg: 'client_disconnected', channel, userId });
    });
  } catch (error) {
    logger.error({ err: error }, 'Error handling WebSocket connection');
    socket.close(1011, 'Internal server error');
  }
});

// 定期清理无效连接
setInterval(() => {
  let totalConnections = 0;
  for (const [userId, sockets] of userConnections.entries()) {
    let validSockets = 0;
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        validSockets++;
        totalConnections++;
      } else {
        sockets.delete(socket);
      }
    }
    if (validSockets === 0) {
      userConnections.delete(userId);
    }
  }
  logger.info({ msg: 'connection_cleanup', totalConnections });
}, 60000); // 每分钟清理一次

httpServer.listen(port, () => {
  logger.info({ msg: 'websocket_server_listening', port });
});