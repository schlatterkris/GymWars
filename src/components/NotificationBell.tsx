import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../services/AuthContext';

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, requestPermission } = useNotifications(user?.id ?? null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (unreadCount > 0) requestPermission();
  }, [unreadCount, requestPermission]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const timeAgo = (ts: number) => {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  const iconByType = (t: string) => {
    if (t === 'checkin') return '✅';
    if (t === 'comment') return '💬';
    return '🔥';
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(s => !s); if (!open) markRead(); }}
        className="btn"
        style={{
          position: 'relative', padding: '8px 12px', fontSize: '1.2rem',
          background: 'var(--slate-800)', borderRadius: 'var(--radius)',
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--orange-500)', color: '#fff',
            fontSize: '0.65rem', fontWeight: 700,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 320, maxHeight: 360, overflowY: 'auto',
          background: 'var(--slate-900)', border: '1px solid var(--slate-700)',
          borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 200,
        }}>
          {notifications.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
              No activity yet
            </p>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex', gap: 10, padding: '10px 12px',
                borderBottom: '1px solid var(--slate-800)',
                background: n.read ? 'transparent' : 'var(--orange-500-8)',
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1rem', marginTop: 2 }}>{iconByType(n.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-200)', wordBreak: 'break-word' }}>
                    {n.message}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginTop: 2 }}>
                    {timeAgo(n.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
