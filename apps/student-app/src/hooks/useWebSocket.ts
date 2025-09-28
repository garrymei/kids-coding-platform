import { useCallback, useRef, useState } from 'react';

export type WebSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>('idle');
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(
    (url: string, options?: UseWebSocketOptions) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        setStatus('connecting');
        const socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = (event) => {
          setStatus('connected');
          options?.onOpen?.(event);
        };

        socket.onmessage = (event) => {
          options?.onMessage?.(event);
        };

        socket.onclose = (event) => {
          setStatus('disconnected');
          options?.onClose?.(event);
        };

        socket.onerror = (event) => {
          setStatus('error');
          options?.onError?.(event);
        };
      } catch (error) {
        setStatus('error');
        console.error('[useWebSocket] Connection error:', error);
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('idle');
  }, []);

  return { status, connect, disconnect };
}
