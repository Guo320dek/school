import { useEffect, useRef } from 'react';

const RECONNECT_DELAY = 2000;

function getWsUrl(): string {
  // In production, connect to same host
  if (import.meta.env.PROD) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }
  // In development, connect to backend port
  return 'ws://localhost:3001';
}

export function useRealtime(table: string, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        ws = new WebSocket(getWsUrl());
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'change') {
              onRefreshRef.current();
            }
          } catch {}
        };
        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
        };
        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}
