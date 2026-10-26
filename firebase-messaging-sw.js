// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCoHGEyhlsjmB_diUNm-R8SXB0Gm0kXw0A",
  authDomain: "sigma-6f162.firebaseapp.com",
  databaseURL: "https://sigma-6f162-default-rtdb.firebaseio.com",
  projectId: "sigma-6f162",
  storageBucket: "sigma-6f162.firebasestorage.app",
  messagingSenderId: "420365348074",
  appId: "1:420365348074:web:0aaecb71ec613bb32abb93"
});

const messaging = firebase.messaging();

// يُستدعى عندما يصل إشعار والتطبيق مغلق أو في الخلفية
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'منصة سيجما التعليمية';
  const options = {
    body: payload.notification?.body || 'لديك إشعار جديد',
    tag: 'sigma-notification',       // يمنع تكرار الإشعار نفسه
    renotify: true,
    data: { url: payload.fcmOptions?.link || '/' }
  };
  self.registration.showNotification(title, options);
});

// عند الضغط على الإشعار: افتح التطبيق أو انتقل إلى نافذة مفتوحة
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
