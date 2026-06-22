export function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const dateSet = new Set(dates.map(d => d.slice(0, 10)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const dow = cursor.getDay();
    if (dow === 0 || dow === 6) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const key = cursor.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (cursor.getTime() === today.getTime()) return 0;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      while (yesterday.getDay() === 0 || yesterday.getDay() === 6) {
        yesterday.setDate(yesterday.getDate() - 1);
      }
      if (cursor.getTime() === yesterday.getTime()) return 0;
      break;
    }
  }
  return streak;
}
