import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';

interface Notification {
  id: string;
  table: string;
  action: string;
  time: number;
  read: boolean;
}

const TABLE_LABELS: Record<string, string> = {
  announcements: '通知公告',
  exam_scores: '成绩',
  timetable_entries: '课表',
  grade_courses: '课程',
  students: '学生',
  staff: '教职工',
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const toastShown = useRef<Set<string>>(new Set());

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.PROD
      ? `${proto}//${window.location.host}`
      : 'ws://localhost:3001';

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'change' && TABLE_LABELS[msg.table]) {
              const now = Date.now();
              const id = `${msg.table}_${now}`;
              setNotifications((prev) => [{ id, table: msg.table, action: '更新', time: now, read: false }, ...prev].slice(0, 50));

              // Toast only once per table per 5 seconds
              const toastKey = msg.table;
              if (!toastShown.current.has(toastKey)) {
                toastShown.current.add(toastKey);
                message.info(`${TABLE_LABELS[msg.table]} 有更新`, 2);
                setTimeout(() => toastShown.current.delete(toastKey), 5000);
              }
            }
          } catch {}
        };
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 2000); };
        ws.onerror = () => { ws?.close(); };
      } catch {
        reconnectTimer = setTimeout(connect, 2000);
      }
    }

    connect();
    return () => { clearTimeout(reconnectTimer); ws?.close(); };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => setNotifications([]);

  return { notifications, unreadCount, markAllRead, clearAll, TABLE_LABELS };
}
