import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

const CHEERS = [
  'Someone just checked in! Don\'t let them get ahead 💪',
  'Your opponent is putting in work. What about you? 🔥',
  'Consistency beats intensity. Stay locked in!',
  'Every rep counts. Don\'t skip today!',
  'Your future self will thank you for showing up.',
  'The only bad workout is the one you didn\'t do.',
  'Champions keep going when they don\'t feel like it.',
  'Your competition is grinding right now. Are you?',
  'Check in. Lift. Repeat. It\'s that simple.',
  'Small steps lead to big results. Stay consistent.',
  'They\'re not slowing down. Why are you? ⚡',
  'Streaks are built one day at a time. You\'ve got this!',
  'Winners show up even when they don\'t want to.',
  'Someone\'s taking your spot. Take it back.',
  'No days off. You know what to do.',
];

export interface Notification {
  id: string;
  type: 'checkin' | 'comment' | 'encouragement';
  message: string;
  userName?: string;
  timestamp: number;
  read: boolean;
}

export function useNotifications(currentUserId: number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const seenCommentIds = useRef<Set<number>>(new Set());
  const lastEncouragement = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifyRef = useRef<Notification[]>([]);
  const userIdRef = useRef(currentUserId);
  userIdRef.current = currentUserId;

  notifyRef.current = notifications;

  const addNotification = useCallback((n: Notification) => {
    setNotifications(prev => [n, ...prev].slice(0, 50));
    setUnreadCount(c => c + 1);

    if (document.hidden && Notification.permission === 'granted') {
      try {
        new Notification('GymWars', { body: n.message, icon: '/GymWars/favicon.ico' });
      } catch { /* ignore browser restrictions */ }
    }
  }, []);

  const markRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const poll = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;

    try {
      const [allCheckins, comments] = await Promise.all([
        api.checkins.list(),
        api.comments.list(),
      ]);

      const today = new Date().toISOString().slice(0, 10);

      const todayCheckins = (allCheckins as any[] || []).filter(
        (c: any) => String(c.date).slice(0, 10) === today && String(c.user_id) !== String(uid)
      );

      for (const c of todayCheckins) {
        const key = `checkin-${c.id}`;
        if (notifyRef.current.some(n => n.id === key)) continue;
        if (!c.user_name) {
          const allUsers = await api.users.get() as any[];
          const u = allUsers.find((x: any) => String(x.id) === String(c.user_id));
          c.user_name = u?.name || 'Someone';
        }
        addNotification({
          id: key,
          type: 'checkin',
          message: `${c.user_name || 'Someone'} checked in today!`,
          userName: c.user_name,
          timestamp: Date.now(),
          read: false,
        });
      }

      const newComments = (comments as any[] || []).filter(
        (c: any) => String(c.user_id) !== String(uid) && !seenCommentIds.current.has(c.id)
      );

      for (const c of newComments) {
        seenCommentIds.current.add(c.id);
        addNotification({
          id: `comment-${c.id}`,
          type: 'comment',
          message: `${c.user_name || 'Someone'}: ${c.message}`,
          userName: c.user_name,
          timestamp: Date.now(),
          read: false,
        });
      }

      if (Date.now() - lastEncouragement.current > 60000 && todayCheckins.length > 0) {
        lastEncouragement.current = Date.now();
        const quote = CHEERS[Math.floor(Math.random() * CHEERS.length)];
        addNotification({
          id: `cheer-${Date.now()}`,
          type: 'encouragement',
          message: quote,
          timestamp: Date.now(),
          read: false,
        });
      }
    } catch {
      // ignore poll errors
    }
  }, [addNotification]);

  useEffect(() => {
    if (!enabled || !currentUserId) return;
    poll();
    intervalRef.current = setInterval(poll, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enabled, currentUserId, poll]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return { notifications, unreadCount, markRead, enabled, setEnabled, requestPermission };
}
