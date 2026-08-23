// ============================================
// الملف الرئيسي للتطبيق - سنتر سيجما
// ============================================

import {
  auth,
  database,
  storage,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  get,
  child,
  storageRef,
  uploadBytes,
  getDownloadURL
} from './firebase-config.js';

// ============================================
// حالة التطبيق (State Management)
// ============================================
const AppState = {
  currentUser: null,
  currentPage: 'welcome',
  userRole: null, // 'student' أو 'admin'
  studentData: null,
  subjects: [],
  schedule: [],
  news: [],
  notifications: [],
  materials: [],
  selectedStage: '',
  selectedGrade: '',
  selectedSubject: ''
};

// ============================================
// دوال التنقل بين الصفحات
// ============================================
function navigateTo(page, data = null) {
  const pages = {
    welcome: showWelcomePage,
    login: showLoginPage,
    register: showRegisterPage,
    studentDashboard: showStudentDashboard,
    adminDashboard: showAdminDashboard,
    subjects: showSubjectsPage,
    materials: showMaterialsPage,
    notifications: showNotificationsPage,
    schedule: showSchedulePage,
    addSubject: showAddSubjectPage,
    addSchedule: showAddSchedulePage,
    addNotification: showAddNotificationPage,
    manageUsers: showManageUsersPage
  };

  AppState.currentPage = page;
  if (pages[page]) {
    pages[page](data);
  }
  updateActiveNav(page);
}

// ============================================
// شاشة الترحيب
// ============================================
function showWelcomePage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="welcome-page">
      <div class="welcome-container">
        <div class="logo-container">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%234F46E5'/%3E%3Ctext x='50' y='58' font-size='30' text-anchor='middle' fill='white' font-weight='bold'%3EΣ%3C/text%3E%3C/svg%3E" alt="Sigma Logo" class="logo-img">
        </div>
        <h1 class="welcome-title">مرحباً بك في</h1>
        <h2 class="welcome-subtitle">سنتر سيجما</h2>
        <p class="welcome-desc">منصة التعلم المتكاملة</p>
        <div class="welcome-buttons">
          <button onclick="navigateTo('login')" class="btn-primary btn-lg">
            تسجيل الدخول
          </button>
          <button onclick="navigateTo('register')" class="btn-secondary btn-lg">
            إنشاء حساب
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// شاشة تسجيل الدخول
// ============================================
function showLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <h2 class="auth-title">تسجيل الدخول</h2>
        <button onclick="handleGoogleSignIn()" class="btn-google">
          <svg class="google-icon" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          تسجيل الدخول بجوجل
        </button>
        <div class="divider">
          <span>أو</span>
        </div>
        <form id="loginForm" onsubmit="handleEmailLogin(event)">
          <input type="email" id="loginEmail" placeholder="البريد الإلكتروني" required>
          <input type="password" id="loginPassword" placeholder="كلمة المرور" required>
          <button type="submit" class="btn-primary">دخول</button>
        </form>
        <p class="auth-link">
          ليس لديك حساب؟ <a href="#" onclick="navigateTo('register')">إنشاء حساب</a>
        </p>
        <p class="auth-error" id="loginError"></p>
      </div>
    </div>
  `;
}

// ============================================
// شاشة إنشاء حساب
// ============================================
function showRegisterPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <h2 class="auth-title">إنشاء حساب جديد</h2>
        <form id="registerForm" onsubmit="handleRegister(event)">
          <input type="text" id="registerName" placeholder="الاسم الكامل" required>
          <input type="email" id="registerEmail" placeholder="البريد الإلكتروني" required>
          <input type="password" id="registerPassword" placeholder="كلمة المرور" required>
          <select id="registerRole" required>
            <option value="">اختر الدور</option>
            <option value="student">طالب</option>
            <option value="admin">أدمن</option>
          </select>
          <button type="submit" class="btn-primary">إنشاء حساب</button>
        </form>
        <p class="auth-link">
          لديك حساب بالفعل؟ <a href="#" onclick="navigateTo('login')">تسجيل الدخول</a>
        </p>
        <p class="auth-error" id="registerError"></p>
      </div>
    </div>
  `;
}

// ============================================
// لوحة تحكم الطالب
// ============================================
function showStudentDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-logo">
            <span class="logo-text">Σ سنتر سيجما</span>
          </div>
          <div class="nav-links">
            <button onclick="navigateTo('studentDashboard')" class="nav-link active">الرئيسية</button>
            <button onclick="navigateTo('subjects')" class="nav-link">المواد</button>
            <button onclick="navigateTo('schedule')" class="nav-link">الجدول</button>
            <button onclick="navigateTo('materials')" class="nav-link">المذكرات</button>
            <button onclick="navigateTo('notifications')" class="nav-link">الإشعارات</button>
          </div>
          <div class="nav-user">
            <span class="user-name">${AppState.currentUser?.displayName || 'طالب'}</span>
            <button onclick="handleLogout()" class="btn-logout">تسجيل خروج</button>
          </div>
        </div>
      </nav>
      
      <div class="dashboard-content">
        <div class="welcome-banner">
          <h1>مرحباً بك في سنتر سيجما</h1>
          <p>${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div class="dashboard-grid">
          <!-- آخر الأخبار -->
          <div class="card card-news">
            <h3 class="card-title">📰 آخر الأخبار</h3>
            <div id="newsList" class="news-list"></div>
          </div>
          
          <!-- الجدول الأسبوعي -->
          <div class="card card-schedule">
            <h3 class="card-title">📅 الجدول الأسبوعي</h3>
            <div id="scheduleList" class="schedule-grid"></div>
          </div>
          
          <!-- المواد المشترك فيها -->
          <div class="card card-subjects">
            <h3 class="card-title">📚 المواد المشترك فيها</h3>
            <div id="studentSubjects" class="subjects-tags"></div>
          </div>
        </div>
        
        <!-- الإشعارات السريعة -->
        <div class="card quick-notifications">
          <h3 class="card-title">🔔 آخر الإشعارات</h3>
          <div id="quickNotifications" class="notifications-list"></div>
        </div>
      </div>
    </div>
  `;
  
  // تحميل البيانات
  loadStudentData();
  loadNews();
  loadSchedule();
  loadStudentSubjects();
  loadNotifications();
}

// ============================================
// لوحة تحكم الأدمن
// ============================================
function showAdminDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      <nav class="navbar admin-nav">
        <div class="nav-container">
          <div class="nav-logo">
            <span class="logo-text">Σ سنتر سيجما - أدمن</span>
          </div>
          <div class="nav-links">
            <button onclick="navigateTo('adminDashboard')" class="nav-link active">لوحة التحكم</button>
            <button onclick="navigateTo('addSubject')" class="nav-link">إضافة مادة</button>
            <button onclick="navigateTo('addSchedule')" class="nav-link">إضافة جدول</button>
            <button onclick="navigateTo('addNotification')" class="nav-link">إضافة إشعار</button>
            <button onclick="navigateTo('manageUsers')" class="nav-link">إدارة المستخدمين</button>
          </div>
          <div class="nav-user">
            <span class="user-name">أدمن</span>
            <button onclick="handleLogout()" class="btn-logout">تسجيل خروج</button>
          </div>
        </div>
      </nav>
      
      <div class="dashboard-content">
        <div class="admin-stats">
          <div class="stat-card">
            <h3>عدد الطلاب</h3>
            <p id="studentCount">0</p>
          </div>
          <div class="stat-card">
            <h3>عدد المواد</h3>
            <p id="subjectCount">0</p>
          </div>
          <div class="stat-card">
            <h3>عدد الإشعارات</h3>
            <p id="notificationCount">0</p>
          </div>
        </div>
        
        <div class="admin-quick-actions">
          <h2>إجراءات سريعة</h2>
          <div class="action-grid">
            <button onclick="navigateTo('addSubject')" class="action-btn">➕ إضافة مادة</button>
            <button onclick="navigateTo('addSchedule')" class="action-btn">📅 إضافة جدول</button>
            <button onclick="navigateTo('addNotification')" class="action-btn">🔔 إضافة إشعار</button>
          </div>
        </div>
        
        <div class="card">
          <h3>آخر الإشعارات المرسلة</h3>
          <div id="adminNotificationsList"></div>
        </div>
      </div>
    </div>
  `;
  
  loadAdminStats();
  loadAllNotifications();
}

// ============================================
// دوال إدارة المواد
// ============================================
function showAddSubjectPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getAdminNav()}
      <div class="dashboard-content">
        <div class="form-container card">
          <h2>إضافة مادة جديدة</h2>
          <form id="addSubjectForm" onsubmit="handleAddSubject(event)">
            <input type="text" id="subjectName" placeholder="اسم المادة" required>
            <select id="subjectStage" required>
              <option value="">اختر المرحلة</option>
              <option value="الابتدائية">الابتدائية</option>
              <option value="المتوسطة">المتوسطة</option>
              <option value="الثانوية">الثانوية</option>
            </select>
            <input type="text" id="subjectGrade" placeholder="الصف (مثال: 6)" required>
            <input type="text" id="subjectTeacher" placeholder="اسم المدرس">
            <button type="submit" class="btn-primary">إضافة المادة</button>
          </form>
          <div id="subjectsList" class="items-list"></div>
        </div>
      </div>
    </div>
  `;
  loadAllSubjects();
}

// ============================================
// دوال إدارة الجدول
// ============================================
function showAddSchedulePage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getAdminNav()}
      <div class="dashboard-content">
        <div class="form-container card">
          <h2>إضافة موعد في الجدول</h2>
          <form id="addScheduleForm" onsubmit="handleAddSchedule(event)">
            <select id="scheduleDay" required>
              <option value="">اختر اليوم</option>
              <option value="الأحد">الأحد</option>
              <option value="الإثنين">الإثنين</option>
              <option value="الثلاثاء">الثلاثاء</option>
              <option value="الأربعاء">الأربعاء</option>
              <option value="الخميس">الخميس</option>
              <option value="الجمعة">الجمعة</option>
              <option value="السبت">السبت</option>
            </select>
            <input type="text" id="scheduleSubject" placeholder="اسم المادة" required>
            <input type="time" id="scheduleTime" required>
            <select id="scheduleStage" required>
              <option value="">اختر المرحلة</option>
              <option value="الابتدائية">الابتدائية</option>
              <option value="المتوسطة">المتوسطة</option>
              <option value="الثانوية">الثانوية</option>
            </select>
            <input type="text" id="scheduleGrade" placeholder="الصف">
            <button type="submit" class="btn-primary">إضافة الموعد</button>
          </form>
          <div id="scheduleList" class="items-list"></div>
        </div>
      </div>
    </div>
  `;
  loadAllSchedule();
}

// ============================================
// دوال إدارة الإشعارات
// ============================================
function showAddNotificationPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getAdminNav()}
      <div class="dashboard-content">
        <div class="form-container card">
          <h2>إضافة إشعار جديد</h2>
          <form id="addNotificationForm" onsubmit="handleAddNotification(event)">
            <input type="text" id="notificationTitle" placeholder="عنوان الإشعار" required>
            <textarea id="notificationContent" placeholder="محتوى الإشعار" required></textarea>
            <select id="notificationTarget" required>
              <option value="all">الكل</option>
              <option value="stage">مرحلة معينة</option>
              <option value="grade">صف معين</option>
              <option value="subject">مادة معينة</option>
            </select>
            <div id="targetFields">
              <select id="notificationStage">
                <option value="">اختر المرحلة</option>
                <option value="الابتدائية">الابتدائية</option>
                <option value="المتوسطة">المتوسطة</option>
                <option value="الثانوية">الثانوية</option>
              </select>
              <input type="text" id="notificationGrade" placeholder="الصف">
              <input type="text" id="notificationSubject" placeholder="المادة">
            </div>
            <button type="submit" class="btn-primary">إرسال الإشعار</button>
          </form>
          <div id="notificationsList" class="items-list"></div>
        </div>
      </div>
    </div>
  `;
  loadAllNotifications();
}

// ============================================
// دوال عرض المواد والجدول والمذكرات
// ============================================
function showSubjectsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getStudentNav()}
      <div class="dashboard-content">
        <div class="card">
          <h2>📚 المواد الدراسية</h2>
          <div id="allSubjectsList" class="subjects-grid"></div>
        </div>
      </div>
    </div>
  `;
  loadAllSubjects();
}

function showSchedulePage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getStudentNav()}
      <div class="dashboard-content">
        <div class="card">
          <h2>📅 الجدول الأسبوعي</h2>
          <div id="fullSchedule" class="schedule-table"></div>
        </div>
      </div>
    </div>
  `;
  loadFullSchedule();
}

function showMaterialsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getStudentNav()}
      <div class="dashboard-content">
        <div class="card">
          <h2>📄 المذكرات والصور</h2>
          <div id="materialsList" class="materials-grid"></div>
        </div>
      </div>
    </div>
  `;
  loadMaterials();
}

function showNotificationsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getStudentNav()}
      <div class="dashboard-content">
        <div class="card">
          <h2>🔔 جميع الإشعارات</h2>
          <div id="allNotifications" class="notifications-list"></div>
        </div>
      </div>
    </div>
  `;
  loadAllNotifications();
}

function showManageUsersPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-page">
      ${getAdminNav()}
      <div class="dashboard-content">
        <div class="card">
          <h2>👥 إدارة المستخدمين</h2>
          <div id="usersList" class="users-list"></div>
        </div>
      </div>
    </div>
  `;
  loadUsers();
}

// ============================================
// دوال مساعدة للتنقل (Navbars)
// ============================================
function getStudentNav() {
  return `
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <span class="logo-text">Σ سنتر سيجما</span>
        </div>
        <div class="nav-links">
          <button onclick="navigateTo('studentDashboard')" class="nav-link">الرئيسية</button>
          <button onclick="navigateTo('subjects')" class="nav-link active">المواد</button>
          <button onclick="navigateTo('schedule')" class="nav-link">الجدول</button>
          <button onclick="navigateTo('materials')" class="nav-link">المذكرات</button>
          <button onclick="navigateTo('notifications')" class="nav-link">الإشعارات</button>
        </div>
        <div class="nav-user">
          <span class="user-name">${AppState.currentUser?.displayName || 'طالب'}</span>
          <button onclick="handleLogout()" class="btn-logout">تسجيل خروج</button>
        </div>
      </div>
    </nav>
  `;
}

function getAdminNav() {
  return `
    <nav class="navbar admin-nav">
      <div class="nav-container">
        <div class="nav-logo">
          <span class="logo-text">Σ سنتر سيجما - أدمن</span>
        </div>
        <div class="nav-links">
          <button onclick="navigateTo('adminDashboard')" class="nav-link">لوحة التحكم</button>
          <button onclick="navigateTo('addSubject')" class="nav-link">إضافة مادة</button>
          <button onclick="navigateTo('addSchedule')" class="nav-link">إضافة جدول</button>
          <button onclick="navigateTo('addNotification')" class="nav-link">إضافة إشعار</button>
          <button onclick="navigateTo('manageUsers')" class="nav-link">إدارة المستخدمين</button>
        </div>
        <div class="nav-user">
          <span class="user-name">أدمن</span>
          <button onclick="handleLogout()" class="btn-logout">تسجيل خروج</button>
        </div>
      </div>
    </nav>
  `;
}

function updateActiveNav(page) {
  // تحديث حالة التنقل النشط
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
}

// ============================================
// دوال المصادقة (Authentication)
// ============================================

// تسجيل الدخول بجوجل
window.handleGoogleSignIn = async function() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    AppState.currentUser = user;
    
    // التحقق من دور المستخدم
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    if (userData?.role === 'admin') {
      AppState.userRole = 'admin';
      navigateTo('adminDashboard');
    } else {
      AppState.userRole = 'student';
      navigateTo('studentDashboard');
    }
  } catch (error) {
    document.getElementById('loginError').textContent = error.message;
  }
};

// تسجيل الدخول بالبريد وكلمة المرور
window.handleEmailLogin = async function(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    AppState.currentUser = user;
    
    // التحقق من دور المستخدم
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    if (userData?.role === 'admin') {
      AppState.userRole = 'admin';
      navigateTo('adminDashboard');
    } else {
      AppState.userRole = 'student';
      navigateTo('studentDashboard');
    }
  } catch (error) {
    document.getElementById('loginError').textContent = error.message;
  }
};

// إنشاء حساب جديد
window.handleRegister = async function(event) {
  event.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // حفظ بيانات المستخدم في قاعدة البيانات
    await set(ref(database, `users/${user.uid}`), {
      name: name,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    });
    
    // تحديث الاسم في حساب Firebase
    await updateProfile(user, { displayName: name });
    
    AppState.currentUser = user;
    AppState.userRole = role;
    
    if (role === 'admin') {
      navigateTo('adminDashboard');
    } else {
      navigateTo('studentDashboard');
    }
  } catch (error) {
    document.getElementById('registerError').textContent = error.message;
  }
};

// تسجيل الخروج
window.handleLogout = async function() {
  try {
    await signOut(auth);
    AppState.currentUser = null;
    AppState.userRole = null;
    navigateTo('welcome');
  } catch (error) {
    alert('حدث خطأ أثناء تسجيل الخروج: ' + error.message);
  }
};

// ============================================
// دوال تحميل البيانات من Firebase
// ============================================

// تحميل بيانات الطالب
function loadStudentData() {
  if (!AppState.currentUser) return;
  
  const userRef = ref(database, `students/${AppState.currentUser.uid}`);
  onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      AppState.studentData = data;
    }
  });
}

// تحميل الأخبار
function loadNews() {
  const newsRef = ref(database, 'news');
  onValue(newsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      AppState.news = Object.values(data).reverse();
      renderNews();
    }
  });
}

function renderNews() {
  const newsList = document.getElementById('newsList');
  if (!newsList) return;
  
  if (AppState.news.length === 0) {
    newsList.innerHTML = '<p class="empty-message">لا توجد أخبار حالياً</p>';
    return;
  }
  
  newsList.innerHTML = AppState.news.slice(0, 5).map(news => `
    <div class="news-item">
      <h4>${news.title}</h4>
      <p>${news.content}</p>
      <span class="news-date">${news.date || new Date().toLocaleDateString('ar-EG')}</span>
    </div>
  `).join('');
}

// تحميل الجدول
function loadSchedule() {
  const scheduleRef = ref(database, 'schedule');
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      AppState.schedule = Object.values(data);
      renderSchedule();
    }
  });
}

function renderSchedule() {
  const scheduleList = document.getElementById('scheduleList');
  if (!scheduleList) return;
  
  if (AppState.schedule.length === 0) {
    scheduleList.innerHTML = '<p class="empty-message">لا يوجد جدول حالياً</p>';
    return;
  }
  
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const scheduleGrid = {};
  
  days.forEach(day => {
    scheduleGrid[day] = AppState.schedule.filter(s => s.day === day);
  });
  
  scheduleList.innerHTML = days.map(day => `
    <div class="schedule-day">
      <div class="day-header">${day}</div>
      <div class="day-items">
        ${scheduleGrid[day].length > 0 ? 
          scheduleGrid[day].map(s => `<span class="schedule-item">${s.subject} - ${s.time || ''}</span>`).join('') :
          '<span class="schedule-empty">-</span>'
        }
      </div>
    </div>
  `).join('');
}

// تحميل مواد الطالب
function loadStudentSubjects() {
  if (!AppState.currentUser) return;
  
  const subjectsRef = ref(database, `students/${AppState.currentUser.uid}/subjects`);
  onValue(subjectsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const subjectsList = document.getElementById('studentSubjects');
      if (subjectsList) {
        const subjects = Object.values(data);
        subjectsList.innerHTML = subjects.map(s => `
          <span class="subject-tag">${s.name || s}</span>
        `).join('');
      }
    }
  });
}

// تحميل الإشعارات
function loadNotifications() {
  const notificationsRef = ref(database, 'notifications');
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      AppState.notifications = Object.values(data).reverse();
      renderNotifications();
    }
  });
}

function renderNotifications() {
  const quickNotif = document.getElementById('quickNotifications');
  if (quickNotif) {
    const recent = AppState.notifications.slice(0, 3);
    quickNotif.innerHTML = recent.length > 0 ?
      recent.map(n => `
        <div class="notification-item">
          <h4>${n.title}</h4>
          <p>${n.content}</p>
          <span class="notif-date">${n.date || new Date().toLocaleDateString('ar-EG')}</span>
        </div>
      `).join('') :
      '<p class="empty-message">لا توجد إشعارات</p>';
  }
}

// تحميل جميع المواد (للأدمن)
function loadAllSubjects() {
  const subjectsRef = ref(database, 'subjects');
  onValue(subjectsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const subjects = Object.values(data);
      const subjectsList = document.getElementById('subjectsList') || document.getElementById('allSubjectsList');
      if (subjectsList) {
        subjectsList.innerHTML = subjects.map((s, index) => `
          <div class="item-card">
            <span>${s.name}</span>
            <span class="badge">${s.stage || ''} - ${s.grade || ''}</span>
            <button onclick="deleteItem('subjects', '${Object.keys(data)[index]}')" class="btn-delete">×</button>
          </div>
        `).join('');
      }
      
      // تحديث عدد المواد
      const countEl = document.getElementById('subjectCount');
      if (countEl) countEl.textContent = subjects.length;
    }
  });
}

// تحميل الجدول كامل
function loadFullSchedule() {
  const scheduleRef = ref(database, 'schedule');
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const schedule = Object.values(data);
      const container = document.getElementById('fullSchedule');
      if (container) {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        container.innerHTML = `
          <table class="schedule-table">
            <thead>
              <tr>
                ${days.map(day => `<th>${day}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                ${days.map(day => `
                  <td>
                    ${schedule.filter(s => s.day === day).map(s => `
                      <div class="schedule-cell">
                        <strong>${s.subject}</strong>
                        <span>${s.time || ''}</span>
                      </div>
                    `).join('') || '-'}
                  </td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        `;
      }
    }
  });
}

// تحميل المذكرات
function loadMaterials() {
  const materialsRef = ref(database, 'materials');
  onValue(materialsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const materials = Object.values(data);
      const container = document.getElementById('materialsList');
      if (container) {
        container.innerHTML = materials.map(m => `
          <div class="material-card">
            <h4>${m.name}</h4>
            <p>${m.subject || ''}</p>
            ${m.pdfUrl ? `<a href="${m.pdfUrl}" target="_blank" class="btn-download">📄 تحميل PDF</a>` : ''}
            ${m.imageUrl ? `<img src="${m.imageUrl}" alt="${m.name}" class="material-image">` : ''}
          </div>
        `).join('');
      }
    }
  });
}

// تحميل جميع الإشعارات
function loadAllNotifications() {
  const notificationsRef = ref(database, 'notifications');
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const notifications = Object.values(data).reverse();
      const container = document.getElementById('allNotifications') || document.getElementById('adminNotificationsList') || document.getElementById('notificationsList');
      if (container) {
        container.innerHTML = notifications.map(n => `
          <div class="notification-item">
            <h4>${n.title}</h4>
            <p>${n.content}</p>
            <span class="notif-date">${n.date || new Date().toLocaleDateString('ar-EG')}</span>
            ${n.target ? `<span class="badge">${n.target}</span>` : ''}
          </div>
        `).join('');
      }
      
      // تحديث عدد الإشعارات
      const countEl = document.getElementById('notificationCount');
      if (countEl) countEl.textContent = notifications.length;
    }
  });
}

// تحميل الجدول كامل (للأدمن)
function loadAllSchedule() {
  const scheduleRef = ref(database, 'schedule');
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const schedule = Object.values(data);
      const container = document.getElementById('scheduleList');
      if (container) {
        container.innerHTML = schedule.map((s, index) => `
          <div class="item-card">
            <span>${s.day} - ${s.subject}</span>
            <span class="badge">${s.time || ''}</span>
            <button onclick="deleteItem('schedule', '${Object.keys(data)[index]}')" class="btn-delete">×</button>
          </div>
        `).join('');
      }
    }
  });
}

// تحميل المستخدمين
function loadUsers() {
  const usersRef = ref(database, 'users');
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const users = Object.values(data);
      const container = document.getElementById('usersList');
      if (container) {
        container.innerHTML = users.map(u => `
          <div class="user-card">
            <div class="user-info">
              <strong>${u.name}</strong>
              <span>${u.email}</span>
              <span class="badge">${u.role || 'طالب'}</span>
            </div>
          </div>
        `).join('');
        
        // تحديث عدد الطلاب
        const countEl = document.getElementById('studentCount');
        if (countEl) countEl.textContent = users.filter(u => u.role !== 'admin').length;
      }
    }
  });
}

// تحميل إحصائيات الأدمن
function loadAdminStats() {
  loadAllSubjects();
  loadAllNotifications();
  loadUsers();
}

// ============================================
// دوال إدارة البيانات (CRUD)
// ============================================

// إضافة مادة
window.handleAddSubject = async function(event) {
  event.preventDefault();
  const name = document.getElementById('subjectName').value;
  const stage = document.getElementById('subjectStage').value;
  const grade = document.getElementById('subjectGrade').value;
  const teacher = document.getElementById('subjectTeacher').value;
  
  try {
    const newRef = push(ref(database, 'subjects'));
    await set(newRef, {
      name,
      stage,
      grade,
      teacher,
      createdAt: new Date().toISOString()
    });
    alert('تم إضافة المادة بنجاح!');
    document.getElementById('addSubjectForm').reset();
  } catch (error) {
    alert('حدث خطأ: ' + error.message);
  }
};

// إضافة موعد في الجدول
window.handleAddSchedule = async function(event) {
  event.preventDefault();
  const day = document.getElementById('scheduleDay').value;
  const subject = document.getElementById('scheduleSubject').value;
  const time = document.getElementById('scheduleTime').value;
  const stage = document.getElementById('scheduleStage').value;
  const grade = document.getElementById('scheduleGrade').value;
  
  try {
    const newRef = push(ref(database, 'schedule'));
    await set(newRef, {
      day,
      subject,
      time,
      stage,
      grade,
      createdAt: new Date().toISOString()
    });
    alert('تم إضافة الموعد بنجاح!');
    document.getElementById('addScheduleForm').reset();
  } catch (error) {
    alert('حدث خطأ: ' + error.message);
  }
};

// إضافة إشعار
window.handleAddNotification = async function(event) {
  event.preventDefault();
  const title = document.getElementById('notificationTitle').value;
  const content = document.getElementById('notificationContent').value;
  const target = document.getElementById('notificationTarget').value;
  const stage = document.getElementById('notificationStage').value;
  const grade = document.getElementById('notificationGrade').value;
  const subject = document.getElementById('notificationSubject').value;
  
  try {
    const newRef = push(ref(database, 'notifications'));
    await set(newRef, {
      title,
      content,
      target,
      stage,
      grade,
      subject,
      date: new Date().toLocaleDateString('ar-EG'),
      createdAt: new Date().toISOString()
    });
    alert('تم إرسال الإشعار بنجاح!');
    document.getElementById('addNotificationForm').reset();
  } catch (error) {
    alert('حدث خطأ: ' + error.message);
  }
};

// حذف عنصر
window.deleteItem = async function(collection, id) {
  if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
  
  try {
    await remove(ref(database, `${collection}/${id}`));
    alert('تم الحذف بنجاح!');
  } catch (error) {
    alert('حدث خطأ: ' + error.message);
  }
};

// ============================================
// مراقبة حالة المصادقة
// ============================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    AppState.currentUser = user;
    // التحقق من دور المستخدم
    const userRef = ref(database, `users/${user.uid}`);
    get(userRef).then((snapshot) => {
      const userData = snapshot.val();
      if (userData?.role === 'admin') {
        AppState.userRole = 'admin';
        if (AppState.currentPage !== 'adminDashboard') {
          navigateTo('adminDashboard');
        }
      } else {
        AppState.userRole = 'student';
        if (AppState.currentPage !== 'studentDashboard' && 
            AppState.currentPage !== 'subjects' && 
            AppState.currentPage !== 'schedule' && 
            AppState.currentPage !== 'materials' && 
            AppState.currentPage !== 'notifications') {
          navigateTo('studentDashboard');
        }
      }
    });
  } else {
    AppState.currentUser = null;
    AppState.userRole = null;
    if (AppState.currentPage !== 'welcome' && 
        AppState.currentPage !== 'login' && 
        AppState.currentPage !== 'register') {
      navigateTo('welcome');
    }
  }
});

// ============================================
// تهيئة التطبيق
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  navigateTo('welcome');
});

// جعل الدوال عامة للاستخدام في HTML
window.navigateTo = navigateTo;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleEmailLogin = handleEmailLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.handleAddSubject = handleAddSubject;
window.handleAddSchedule = handleAddSchedule;
window.handleAddNotification = handleAddNotification;
window.deleteItem = deleteItem;
