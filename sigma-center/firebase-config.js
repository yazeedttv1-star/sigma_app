// بيانات مشروع Firebase الخاص بك (سنتر سيجما)
const firebaseConfig = {
    apiKey: "AIzaSyCoHGEyhlsjmB_diUNm-R8SXB0Gm0kXw0A",
    authDomain: "sigma-6f162.firebaseapp.com",
    databaseURL: "https://sigma-6f162-default-rtdb.firebaseio.com",
    projectId: "sigma-6f162",
    storageBucket: "sigma-6f162.firebasestorage.app",
    messagingSenderId: "420365348074",
    appId: "1:420365348074:web:0aaecb71ec613bb32abb93",
    measurementId: "G-BTSLXSPXM1"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}