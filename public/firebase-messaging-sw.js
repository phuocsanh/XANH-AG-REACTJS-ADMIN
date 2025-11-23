importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
