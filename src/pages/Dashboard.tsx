import { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useCheckIns } from '../hooks/useCheckIns';
import { useChallenges } from '../hooks/useChallenges';
import { CheckInButton } from '../components/CheckInButton';
import { CardSkeleton } from '../components/Skeleton';

export function Dashboard() {
  const { user } = useAuth();
  const { streak, checkedInToday, loading: ciLoading, checkIn } = useCheckIns(user?.id ?? null);
  const { activeChallenge, entries, loading: chLoading, submitEntry } = useChallenges(user?.id ?? null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');

  const myEntry = entries.find(e => String(e.user_id) === String(user?.id));
  const opponentEntry = entries.find(e => String(e.user_id) !== String(user?.id));

  const handleSubmitChallenge = async () => {
    if (!weight || !reps || !sets) return;
    await submitEntry(Number(weight), Number(reps), Number(sets));
    setWeight(''); setReps(''); setSets('');
  };

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      {ciLoading ? <CardSkeleton /> : (
        <CheckInButton
          checkedIn={checkedInToday}
          streak={streak}
          onCheckIn={checkIn}
          loading={false}
        />
      )}

      {chLoading ? <CardSkeleton /> : activeChallenge && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
            Weekly Challenge
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)', marginBottom: 8 }}>
            {activeChallenge.exercise_name}
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Weight</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="lbs" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Reps</label>
              <input type="number" value={reps} onChange={e => setReps(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Sets</label>
              <input type="number" value={sets} onChange={e => setSets(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmitChallenge} disabled={!!myEntry}>
            {myEntry ? '✓ Submitted' : 'Submit'}
          </button>
          {myEntry && (
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: 8 }}>
              You: {myEntry.weight}lbs × {myEntry.reps} reps × {myEntry.sets} sets = {Number(myEntry.weight) * Number(myEntry.reps) * Number(myEntry.sets)} volume
            </p>
          )}
          {opponentEntry && (
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: 4 }}>
              Opponent: {opponentEntry.weight}lbs × {opponentEntry.reps} reps × {opponentEntry.sets} sets = {Number(opponentEntry.weight) * Number(opponentEntry.reps) * Number(opponentEntry.sets)} volume
            </p>
          )}
        </div>
      )}
    </div>
  );
}
