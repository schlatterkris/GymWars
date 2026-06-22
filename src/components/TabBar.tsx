import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'Dashboard' },
  { path: '/plan', label: 'Plan' },
  { path: '/reports', label: 'Reports' },
];

export function TabBar() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--slate-900)', borderTop: '1px solid var(--slate-700)',
      display: 'flex', zIndex: 100,
    }}>
      {TABS.map(t => {
        const active = loc.pathname === t.path;
        return (
          <button
            key={t.path}
            onClick={() => nav(t.path)}
            style={{
              flex: 1, padding: '12px 0', textAlign: 'center',
              color: active ? 'var(--orange-500)' : 'var(--slate-400)',
              fontWeight: active ? 600 : 400,
              borderTop: active ? '2px solid var(--orange-500)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
