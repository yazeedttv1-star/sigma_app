// ============================================
// ملف تهيئة Firebase
// ============================================

// استيراد Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  onValue, 
  push, 
  set, 
  update, 
  remove, 
  get, 
  child 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ============================================
// إعدادات Firebase الخاصة بمشروع سنتر سيجما
// ============================================
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

// ============================================
// تهيئة Firebase
// ============================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// ============================================
// تصدير الوظائف للاستخدام في app.js
// ============================================
export {
  app,
  auth,
  database,
  storage,
  googleProvider,
  // دوال المصادقة
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  // دوال قاعدة البيانات
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  get,
  child,
  // دوال التخزين
  storageRef,
  uploadBytes,
  getDownloadURL
};
