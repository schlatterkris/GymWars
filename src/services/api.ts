const GAS_URL = import.meta.env.VITE_GAS_URL || '';

async function request(method: 'GET' | 'POST', path: string, body?: Record<string, unknown>) {
  const isGet = method === 'GET';
  const params: Record<string, string> = { path, ...((body || {}) as Record<string, string>) };

  const url = isGet
    ? `${GAS_URL}?${new URLSearchParams(params).toString()}`
    : GAS_URL;

  if (isGet) {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Request failed');
    return json.data;
  }

  const payload = JSON.stringify({ path, ...body });
  let res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, redirect: 'manual' });

  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    const location = res.headers.get('Location');
    if (!location) throw new Error('Redirect with no Location');
    res = await fetch(location, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
  }

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

export const api = {
  users: {
    get: (email?: string) => request('GET', '/users', email ? { email } : {}),
    create: (data: Record<string, unknown>) => request('POST', '/users', data),
  },
  checkins: {
    list: (userId: string | number) => request('GET', '/checkins', { userId: String(userId) }),
    create: (userId: string | number) => request('POST', '/checkins', { userId: String(userId) }),
  },
  challenges: {
    list: () => request('GET', '/challenges'),
    create: (data: Record<string, unknown>) => request('POST', '/challenges', data),
    update: (id: number, data: Record<string, unknown>) => request('POST', '/challenges', { id, ...data }),
  },
  challengeEntries: {
    list: (challengeId: string | number) => request('GET', '/challengeEntries', { challengeId: String(challengeId) }),
    create: (data: Record<string, unknown>) => request('POST', '/challengeEntries', data),
  },
  workoutPlans: {
    list: (userId: string | number) => request('GET', '/workoutPlans', { userId: String(userId) }),
    create: (data: Record<string, unknown>) => request('POST', '/workoutPlans', data),
    remove: (id: number) => request('POST', '/workoutPlans', { path: '/workoutPlans', id, _method: 'DELETE' }),
  },
  workoutEntries: {
    list: (userId: string | number) => request('GET', '/workoutEntries', { userId: String(userId) }),
    create: (data: Record<string, unknown>) => request('POST', '/workoutEntries', data),
  },
  reports: {
    streak: (userId: string | number) => request('GET', '/reports/streaks', { userId: String(userId) }),
    challengeResults: () => request('GET', '/reports/challengeResults'),
  },
};
