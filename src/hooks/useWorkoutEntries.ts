import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface WorkoutEntry {
  id: number;
  user_id: number;
  exercise_name: string;
  date: string;
  weight: number;
  reps: number;
  sets: number;
}

export function useWorkoutEntries(userId: number | null) {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.workoutEntries.list(userId);
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const logEntry = useCallback(async (exerciseName: string, weight: number, reps: number, sets: number) => {
    if (!userId) return;
    await api.workoutEntries.create({
      user_id: userId,
      exercise_name: exerciseName,
      weight,
      reps,
      sets,
    });
    await fetch();
  }, [userId, fetch]);

  const getLastEntry = useCallback((exerciseName: string) => {
    const sorted = entries
      .filter(e => e.exercise_name.toLowerCase() === exerciseName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0] || null;
  }, [entries]);

  return { entries, loading, logEntry, getLastEntry };
}
