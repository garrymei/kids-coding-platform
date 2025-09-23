import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import pino from 'pino';
import { channels } from './channels.js';

const logger = pino({ name: 'kids-websocket', level: process.env.LOG_LEVEL ?? 'info' });

const port = Number(process.env.WS_PORT ?? 4070);

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

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

function sendStubMessage(socket: WebSocket, channel: string) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  if (channel.startsWith('run-results/')) {
    const sessionId = channel.split('/')[1] ?? 'demo-session';
    socket.send(
      JSON.stringify({
        channel,
        type: 'run-result',
        payload: {
          sessionId,
          status: 'completed',
          stdout: ['print("Hello Blocks!")'],
          generatedAt: new Date().toISOString(),
        },
      }),
    );
  } else if (channel.startsWith('notifications/')) {
    const userId = channel.split('/')[1] ?? 'demo-user';
    socket.send(
      JSON.stringify({
        channel,
        type: 'notification',
        payload: {
          userId,
          title: '练习提醒',
          body: '今日 Blockly 闯关开启，别忘了完成实验室任务哦！',
          sentAt: new Date().toISOString(),
        },
      }),
    );
  } else {
    socket.send(
      JSON.stringify({
        channel,
        type: 'error',
        payload: { message: 'Unknown channel. Expected run-results/<sessionId> or notifications/<userId>.' },
      }),
    );
  }
}

wss.on('connection', (socket, request) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const channel = url.pathname.replace(/^\//, '') || 'notifications/demo-user';

  logger.info({ msg: 'client_connected', channel });

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

  startHeartbeat(socket);

  setTimeout(() => sendStubMessage(socket, channel), 1000);
});

httpServer.listen(port, () => {
  logger.info({ msg: 'websocket_server_listening', port });
});
