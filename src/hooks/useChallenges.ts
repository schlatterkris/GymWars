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

const EXERCISES = [
  'Deadlift', 'Squat', 'Bench Press', 'Overhead Press',
  'Barbell Row', 'Pull Up', 'Push Up', 'Dumbbell Curl',
  'Tricep Dip', 'Leg Press', 'Plank', 'Burpee',
];

export function useChallenges(userId: number | null) {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<WeeklyChallenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      let data = await api.challenges.list();
      let active = data.find((c: WeeklyChallenge) => c.status === 'active');

      if (!active && data.length === 0) {
        const pick = EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
        const monday = new Date();
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        await api.challenges.create({
          exercise_name: pick,
          week_start: monday.toISOString().slice(0, 10),
          status: 'active',
        });
        data = await api.challenges.list();
        active = data.find((c: WeeklyChallenge) => c.status === 'active');
      }

      setChallenges(data);
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
