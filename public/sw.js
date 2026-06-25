const CACHE = 'gymwars-v1';
const ASSETS = ['/GymWars/', '/GymWars/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'GymWars', body: 'Something happened!' };
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/GymWars/icon.svg',
    badge: '/GymWars/icon.svg',
    vibrate: [200, 100, 200],
    tag: 'gymwars-push',
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/GymWars/'));
});
