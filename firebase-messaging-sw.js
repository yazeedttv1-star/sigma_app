/* Sigma Firebase Messaging Service Worker */

importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: "AIzaSyCoHGEyhlsjmB_diUNm-R8SXB8Gm0kXw0A",
  authDomain: "sigma-6f162.firebaseapp.com",
  databaseURL: "https://sigma-6f162-default-rtdb.firebaseio.com",
  projectId: "sigma-6f162",
  storageBucket: "sigma-6f162.firebasestorage.app",
  messagingSenderId: "420365348074",
  appId: "1:420365348074:web:0aaecb71ec613bb32abb93"
});

const messaging = firebase.messaging();

/* استقبال الإشعارات أثناء عمل التطبيق في الخلفية */

messaging.onBackgroundMessage((payload) => {

  const notification = payload.notification || {};

  const title = notification.title || 'منصة سيجما';

  const options = {
    body: notification.body || 'لديك إشعار جديد',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {
      url: '/'
    }
  };

  self.registration.showNotification(title, options);

});

/* فتح المنصة عند الضغط على الإشعار */

self.addEventListener('notificationclick', (event) => {

  event.notification.close();

  const target = event.notification.data?.url || '/';

  event.waitUntil(

    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windows) => {

      for (const win of windows) {

        if ('focus' in win) {
          win.focus();
          win.navigate(target);
          return;
        }

      }

      return clients.openWindow(target);

    })

  );

});
