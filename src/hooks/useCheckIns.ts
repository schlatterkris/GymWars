import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface CheckIn {
  id: number;
  user_id: number;
  date: string;
}

export function useCheckIns(userId: number | null) {
  const [checkins, setCheckIns] = useState<CheckIn[]>([]);
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.checkins.list(userId);
      setCheckIns(data);
      const today = new Date().toISOString().slice(0, 10);
      setCheckedInToday(data.some((c: CheckIn) => String(c.date).slice(0, 10) === today));
      const streakData = await api.reports.streak(userId);
      setStreak(streakData.streak);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const checkIn = useCallback(async () => {
    if (!userId) return;
    await api.checkins.create(userId);
    await fetch();
  }, [userId, fetch]);

  return { checkins, streak, checkedInToday, loading, checkIn };
}
