function handleUsers(method, params, ss) {
  const sheet = getSheet('Users', ss);
  if (method === 'GET') {
    const users = readRows(sheet);
    if (params.email) return users.find(u => u.email === params.email) || null;
    return users;
  }
  if (method === 'POST') {
    const existing = readRows(sheet);
    const dup = existing.find(u => u.email === params.email);
    if (dup) return dup;
    params.id = nextId(sheet);
    params.created_at = new Date().toISOString();
    return appendRow(sheet, params, ss);
  }
}

function handleCheckIns(method, params, ss) {
  const sheet = getSheet('CheckIns', ss);
  if (method === 'GET') {
    const all = readRows(sheet);
    if (params.userId) return all.filter(c => String(c.user_id) === params.userId);
    return all;
  }
  if (method === 'POST') {
    const today = new Date().toISOString().slice(0, 10);
    const all = readRows(sheet);
    const already = all.find(c => String(c.user_id) === String(params.userId) && String(c.date).slice(0, 10) === today);
    if (already) throw new Error('Already checked in today');
    params.id = nextId(sheet);
    params.user_id = params.userId;
    params.date = new Date().toISOString();
    return appendRow(sheet, params, ss);
  }
}

function handleChallenges(method, params, ss) {
  const sheet = getSheet('WeeklyChallenges', ss);
  if (method === 'GET') {
    const all = readRows(sheet);
    if (params.id) return all.find(c => String(c.id) === params.id) || null;
    return all.sort((a, b) => new Date(b.week_start) - new Date(a.week_start));
  }
  if (method === 'POST') {
    params.id = nextId(sheet);
    params.status = params.status || 'active';
    return appendRow(sheet, params, ss);
  }
  if (method === 'PATCH') {
    return updateRow(sheet, Number(params.id), params, ss);
  }
}

function handleChallengeEntries(method, params, ss) {
  const sheet = getSheet('ChallengeEntries', ss);
  if (method === 'GET') {
    const all = readRows(sheet);
    if (params.challengeId) return all.filter(e => String(e.challenge_id) === params.challengeId);
    return all;
  }
  if (method === 'POST') {
    params.id = nextId(sheet);
    params.created_at = new Date().toISOString();
    return appendRow(sheet, params, ss);
  }
}

function handleWorkoutPlans(method, params, ss) {
  const sheet = getSheet('WorkoutPlans', ss);
  if (method === 'GET') {
    const all = readRows(sheet);
    if (params.userId) return all.filter(p => String(p.user_id) === params.userId);
    return all;
  }
  if (method === 'POST') {
    const all = readRows(sheet);
    const dup = all.find(p => String(p.user_id) === String(params.user_id) && p.day_of_week === params.day_of_week && p.exercise_name.toLowerCase() === params.exercise_name.toLowerCase());
    if (dup) return dup;
    params.id = nextId(sheet);
    return appendRow(sheet, params, ss);
  }
  if (method === 'DELETE') {
    deleteRow(sheet, Number(params.id));
    return { deleted: true };
  }
}

function handleWorkoutEntries(method, params, ss) {
  const sheet = getSheet('WorkoutEntries', ss);
  if (method === 'GET') {
    const all = readRows(sheet);
    if (params.userId) return all.filter(e => String(e.user_id) === params.userId);
    return all;
  }
  if (method === 'POST') {
    params.id = nextId(sheet);
    params.date = params.date || new Date().toISOString().slice(0, 10);
    return appendRow(sheet, params, ss);
  }
}

function getStreak(params, ss) {
  const sheet = getSheet('CheckIns', ss);
  const all = readRows(sheet);
  const userCheckins = all
    .filter(c => String(c.user_id) === params.userId)
    .map(c => new Date(String(c.date).slice(0, 10)))
    .sort((a, b) => a - b);

  if (!userCheckins.length) return { streak: 0, days: [] };

  const dates = new Set(userCheckins.map(d => d.toISOString().slice(0, 10)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let cursor = new Date(today);
  const dayMs = 86400000;

  while (true) {
    const dayOfWeek = cursor.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      cursor.setTime(cursor.getTime() - dayMs);
      continue;
    }
    const key = cursor.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
      cursor.setTime(cursor.getTime() - dayMs);
    } else {
      if (cursor.getTime() === today.getTime()) break;
      const yesterday = new Date(today.getTime() - dayMs);
      while (yesterday.getDay() === 0 || yesterday.getDay() === 6) {
        yesterday.setTime(yesterday.getTime() - dayMs);
      }
      if (cursor.getTime() === yesterday.getTime()) break;
      break;
    }
  }

  return { streak };
}

function handleComments(method, params, ss) {
  const sheet = getSheet('Comments', ss);
  if (method === 'GET') {
    return readRows(sheet);
  }
  if (method === 'POST') {
    params.id = nextId(sheet);
    params.created_at = new Date().toISOString();
    return appendRow(sheet, params, ss);
  }
}

function getChallengeResults(params, ss) {
  const challengesSheet = getSheet('WeeklyChallenges', ss);
  const entriesSheet = getSheet('ChallengeEntries', ss);
  const challenges = readRows(challengesSheet);
  const entries = readRows(entriesSheet);

  return challenges.map(c => {
    const cEntries = entries.filter(e => String(e.challenge_id) === String(c.id));
    const results = cEntries.map(e => ({
      user_id: e.user_id,
      volume: Number(e.weight || 0) * Number(e.reps || 0) * Number(e.sets || 0),
    }));
    const winner = results.length ? results.reduce((a, b) => a.volume > b.volume ? a : b) : null;
    return {
      ...c,
      entries: cEntries,
      winner: winner ? winner.user_id : null,
    };
  });
}
