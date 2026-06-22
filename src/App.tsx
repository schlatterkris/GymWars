import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import { TabBar } from './components/TabBar';
import { Dashboard } from './pages/Dashboard';
import { PersonalPlan } from './pages/PersonalPlan';
import { Reports } from './pages/Reports';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--slate-950)' }}>
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--slate-950)', gap: 16, padding: 16 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>GymWars</h1>
        <p style={{ color: 'var(--slate-400)', textAlign: 'center' }}>Challenge your family to get fit</p>
        <button className="btn btn-primary" onClick={login}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename="/GymWars">
      <AuthProvider>
        <AuthGate>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<PersonalPlan />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <TabBar />
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  );
}
