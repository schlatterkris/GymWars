import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/GymWars/sw.js', { scope: '/GymWars/' }).catch(() => {});
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  (async () => {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      const { api } = await import('./services/api');
      const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
      if (token) {
        await api.pushTokens.register(token);
      }

      onMessage(messaging, (payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title || 'GymWars', {
            body: payload.notification.body,
            icon: '/GymWars/icon.svg',
          });
        }
      });
    } catch { /* FCM not configured, skip push */ }
  })();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
