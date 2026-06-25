import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

const DAY_MS = 86400000;
const COLORS = ['var(--orange-500)', 'var(--slate-400)', '#60a5fa', '#34d399', '#f472b6'];

export function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challengeResults, setChallengeResults] = useState<any[]>([]);
  const [userEntries, setUserEntries] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [results, entries, allUsers, streakData, ci] = await Promise.all([
          api.reports.challengeResults(),
          api.workoutEntries.list(user.id),
          api.users.get(),
          api.reports.streak(user.id),
          api.checkins.list(user.id),
        ]);
        setChallengeResults(results);
        setUserEntries(entries);
        setUsers(allUsers);
        setStreak(streakData.streak);
        setCheckins(ci);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const userName = (id: string | number) => {
    const u = users.find((u: any) => String(u.id) === String(id));
    return u ? u.name : `User ${id}`;
  };

  const checkedDates = new Set(
    checkins.map((c: any) => String(c.date).slice(0, 10))
  );

  const last30Days: { date: string; label: string; checked: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    last30Days.push({
      date: key,
      label: d.toLocaleDateString('en', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      checked: checkedDates.has(key),
    });
  }

  const volumeByDay: Record<string, number> = {};
  userEntries.forEach((e: any) => {
    const day = String(e.date).slice(0, 10);
    const vol = Number(e.weight || 0) * Number(e.reps || 0) * Number(e.sets || 0);
    volumeByDay[day] = (volumeByDay[day] || 0) + vol;
  });

  const volumeTrend = last30Days.map(d => ({
    date: d.date,
    volume: volumeByDay[d.date] || 0,
  }));

  const chartData = challengeResults
    .filter((c: any) => c.entries?.length >= 2)
    .map((c: any) => {
      const w: Record<string, any> = {};
      c.entries.forEach((e: any) => {
        const vol = Number(e.weight || 0) * Number(e.reps || 0) * Number(e.sets || 0);
        const name = userName(e.user_id);
        w[name] = (w[name] || 0) + vol;
      });
      return {
        week: c.week_start?.slice(0, 10) || c.id,
        exercise: c.exercise_name,
        ...w,
      };
    });

  const volumeByExercise: Record<string, { weight: number; reps: number; sets: number }[]> = {};
  userEntries.forEach((e: any) => {
    if (!volumeByExercise[e.exercise_name]) volumeByExercise[e.exercise_name] = [];
    volumeByExercise[e.exercise_name].push({
      weight: Number(e.weight || 0),
      reps: Number(e.reps || 0),
      sets: Number(e.sets || 0),
    });
  });

  const progressionData = Object.entries(volumeByExercise).map(([name, entries]) => {
    const totalVolume = entries.reduce((s, e) => s + e.weight * e.reps * e.sets, 0);
    return { exercise: name, totalVolume, entries: entries.length };
  }).sort((a, b) => b.totalVolume - a.totalVolume);

  const dateFormatter = (val: string) => {
    const d = new Date(val);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="page">
      <h1 className="page-title">Reports</h1>

      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Current Streak</p>
        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--orange-500)' }}>
          {loading ? '...' : `${streak} day${streak !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? <><CardSkeleton /><CardSkeleton /><CardSkeleton /></> : (
        <>
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Last 30 Days</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {last30Days.map(d => (
                <div key={d.date} title={d.label}
                  style={{
                    width: 20, height: 20, borderRadius: 3,
                    background: d.checked ? 'var(--orange-500)' : 'var(--slate-700)',
                    opacity: d.checked ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--slate-500)' }}>
              <span>{last30Days[0]?.label}</span>
              <span>{last30Days[last30Days.length - 1]?.label}</span>
            </div>
          </div>

          {volumeTrend.some(d => d.volume > 0) && (
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Workout Volume (30 days)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={volumeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-700)" />
                  <XAxis dataKey="date" tickFormatter={dateFormatter} tick={{ fontSize: 10, fill: 'var(--slate-400)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--slate-400)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--slate-800)', border: '1px solid var(--slate-600)', borderRadius: 4 }}
                    labelStyle={{ color: 'var(--slate-100)' }}
                    labelFormatter={(val: any) => { const d = new Date(val); return `${d.getMonth() + 1}/${d.getDate()}`; }}
                  />
                  <Line type="monotone" dataKey="volume" stroke="var(--orange-500)" strokeWidth={2} dot={{ r: 3 }} name="Volume" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Weekly Challenge Winners</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-700)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--slate-400)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--slate-400)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--slate-800)', border: '1px solid var(--slate-600)', borderRadius: 4 }}
                    labelStyle={{ color: 'var(--slate-100)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {Object.keys(chartData[0] || {}).filter(k => k !== 'week' && k !== 'exercise').map((name, i) => (
                    <Bar key={name} dataKey={name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {progressionData.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>
                Progression by Exercise
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {progressionData.map(p => (
                  <div key={p.exercise} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--slate-700)',
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.exercise}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{p.entries} sessions</p>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--orange-500)' }}>
                      {p.totalVolume.toLocaleString()} vol
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chartData.length === 0 && progressionData.length === 0 && (
            <div className="card">
              <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                No data yet. Check in and log workouts to see reports.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
