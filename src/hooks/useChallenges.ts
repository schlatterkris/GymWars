import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface WeeklyChallenge {
  id: number;
  exercise_name: string;
  week_start: string;
  status: string;
}

interface ChallengeEntry {
  id: number;
  challenge_id: number;
  user_id: number;
  weight: number;
  reps: number;
  sets: number;
  created_at: string;
}

export function useChallenges(userId: number | null) {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<WeeklyChallenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.challenges.list();
      setChallenges(data);
      const active = data.find((c: WeeklyChallenge) => c.status === 'active');
      setActiveChallenge(active || null);
      if (active) {
        const e = await api.challengeEntries.list(active.id);
        setEntries(e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const submitEntry = useCallback(async (weight: number, reps: number, sets: number) => {
    if (!activeChallenge || !userId) return;
    await api.challengeEntries.create({
      challenge_id: activeChallenge.id,
      user_id: userId,
      weight,
      reps,
      sets,
    });
    await fetch();
  }, [activeChallenge, userId, fetch]);

  return { challenges, activeChallenge, entries, loading, submitEntry };
}
