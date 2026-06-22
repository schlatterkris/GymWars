import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface WorkoutPlan {
  id: number;
  user_id: number;
  exercise_name: string;
  day_of_week: string;
  target_sets: number;
  target_reps: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function useWorkoutPlans(userId: number | null) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.workoutPlans.list(userId);
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addPlan = useCallback(async (plan: Omit<WorkoutPlan, 'id' | 'user_id'>) => {
    if (!userId) return;
    await api.workoutPlans.create({ ...plan, user_id: userId });
    await fetch();
  }, [userId, fetch]);

  const removePlan = useCallback(async (id: number) => {
    await api.workoutPlans.remove(id);
    await fetch();
  }, [fetch]);

  const getPlansByDay = useCallback((day: string) => {
    return plans.filter(p => p.day_of_week === day);
  }, [plans]);

  return { plans, loading, addPlan, removePlan, getPlansByDay, DAYS };
}
