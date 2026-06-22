export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let tokenClient: TokenClient | null = null;
let cachedToken: string | null = null;

export function initGoogleAuth(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const g = window.google;
      if (g?.accounts?.oauth2) {
        tokenClient = g.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'email profile openid',
          callback: (resp) => {
            if (resp.access_token) cachedToken = resp.access_token;
          },
        });
        resolve();
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

export function getToken(): string | null {
  return cachedToken;
}

export function signIn(): Promise<{ email: string; name: string; sub: string }> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Not initialized'));
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(resp);
      if (!resp.access_token) return reject(new Error('No access token'));
      cachedToken = resp.access_token;
      fetchUserInfo(resp.access_token).then(resolve);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

async function fetchUserInfo(token: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export function signOut() {
  cachedToken = null;
}
