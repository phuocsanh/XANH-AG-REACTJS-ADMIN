// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase configuration - same as admin and nextjs client
const firebaseConfig = {
  apiKey: "AIzaSyAGMx-HdOewyUD5uNHp40vF04rkfHvRr8g",
  authDomain: "xanh-ag.firebaseapp.com",
  projectId: "xanh-ag",
  storageBucket: "xanh-ag.firebasestorage.app",
  messagingSenderId: "694980744718",
  appId: "1:694980744718:web:6dcd46b6d0414e26ba4e5f",
  measurementId: "G-RN13VJVJZB"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Xanh AG Admin';
  const notificationOptions = {
    body: payload.notification?.body || 'Bạn có thông báo mới',
    icon: '/icons/pwa-icon-192-v5.png',
    badge: '/icons/pwa-icon-192-v5.png',
    tag: payload.data?.tag || 'default',
    requireInteraction: false,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
