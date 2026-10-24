importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyCoHGEyhlsjmB_diUNm-R8SXB0Gm0kXw0A",
  authDomain: "sigma-6f162.firebaseapp.com",
  projectId: "sigma-6f162",
  storageBucket: "sigma-6f162.firebasestorage.app",
  messagingSenderId: "420365348074",
  appId: "1:420365348074:web:0aaecb71ec613bb32abb93"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title || 'إشعار جديد', {
    body: payload.notification.body || 'لديك إشعار جديد من منصة سيجما',
    icon: '/icon-192.png'
  });
});
