import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

export function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challengeResults, setChallengeResults] = useState<any[]>([]);
  const [userEntries, setUserEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [results, entries, allUsers, streakData] = await Promise.all([
          api.reports.challengeResults(),
          api.workoutEntries.list(user.id),
          api.users.get(),
          api.reports.streak(user.id),
        ]);
        setChallengeResults(results);
        setUserEntries(entries);
        setUsers(allUsers);
        setStreak(streakData.streak);
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

  const chartData = challengeResults
    .filter((c: any) => c.entries?.length >= 2)
    .map((c: any) => {
      const w = c.entries.reduce((acc: any, e: any) => {
        const vol = Number(e.weight || 0) * Number(e.reps || 0) * Number(e.sets || 0);
        acc[userName(e.user_id)] = (acc[userName(e.user_id)] || 0) + vol;
        return acc;
      }, {});
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

  return (
    <div className="page">
      <h1 className="page-title">Reports</h1>

      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Current Streak</p>
        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--orange-500)' }}>
          {loading ? '...' : `${streak} day${streak !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? <><CardSkeleton /><CardSkeleton /></> : (
        <>
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
                  {Object.keys(chartData[0] || {}).filter(k => k !== 'week' && k !== 'exercise').map((name, i) => (
                    <Bar key={name} dataKey={name} fill={i === 0 ? 'var(--orange-500)' : 'var(--slate-400)'} radius={[4, 4, 0, 0]} />
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
