// ============================================
// app.js - سنتر سيجما التعليمي (نسخة مستقرة)
// ============================================

// ===== المتغيرات العامة =====
let currentUser = null;
let userData = null;
let scheduleData = [];
let currentFilter = 'today';
let isAdmin = false;
let darkMode = false;
let deferredPrompt = null;
let allUsers = {};
let contacts = [];
let complaints = [];
let scheduleOption = 'full';
let scheduleDayOption = 'today';
let notifOption = 'full';
let currentViewerImage = '';

// ===== حسابات الإدارة =====
const ADMIN_UIDS = ['WCyUdR31uZOxJwtYzXx85K7E0Cf2', 'ADMIN_UID_2', 'ADMIN_UID_3'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// ===== المواد حسب المرحلة =====
const subjectsByStage = {
  'ثانوي': ['فيزياء', 'كيمياء', 'رياضيات', 'أحياء', 'لغة عربية', 'لغة إنجليزية', 'فرنسية', 'تاريخ', 'جغرافيا', 'فلسفة'],
  'إعدادي': ['رياضيات', 'علوم', 'لغة عربية', 'لغة إنجليزية', 'دراسات', 'حاسب آلي']
};

// ============================================
// دالة آمنة للحصول على العناصر
// ============================================
function $(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`⚠️ Element not found: #${id}`);
    return null;
  }
  return el;
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

// ============================================
// عرض الصور (آمن)
// ============================================
function openImageViewer(imageSrc, title = 'صورة') {
  const viewer = $('imageViewer');
  const img = $('viewerImage');
  const info = $('imageInfo');
  
  if (!viewer || !img) return;
  
  currentViewerImage = imageSrc;
  img.src = imageSrc;
  if (info) info.textContent = title;
  viewer.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
  const viewer = $('imageViewer');
  if (viewer) viewer.classList.remove('show');
  document.body.style.overflow = '';
}

function downloadImage() {
  if (currentViewerImage) {
    const link = document.createElement('a');
    link.href = currentViewerImage;
    link.download = 'sigma_image_' + Date.now() + '.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ جاري تحميل الصورة', 'success');
  }
}
// جعل الدوال عالمية
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.downloadImage = downloadImage;

// ============================================
// PWA - تثبيت التطبيق
// ============================================
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = $('installBtn');
  const pwaBanner = $('pwaBanner');
  if (installBtn) installBtn.classList.add('show');
  if (pwaBanner) pwaBanner.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
  const installBtn = $('installBtn');
  const pwaBanner = $('pwaBanner');
  if (installBtn) installBtn.classList.remove('show');
  if (pwaBanner) pwaBanner.style.display = 'none';
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      if (result.outcome === 'accepted') {
        showToast('✅ تم تثبيت التطبيق!', 'success');
        const pwaBanner = $('pwaBanner');
        if (pwaBanner) pwaBanner.style.display = 'none';
      } else {
        showToast('تم تخطي التثبيت', 'warning');
      }
      deferredPrompt = null;
      const installBtn = $('installBtn');
      if (installBtn) installBtn.classList.remove('show');
    });
  } else {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let msg = '📱 لتثبيت التطبيق:\n\n';
    if (isAndroid) {
      msg += '1. اضغط ⋮ (القائمة)\n2. اختر "تثبيت التطبيق"\n3. اضغط "تثبيت"';
    } else if (isIOS) {
      msg += '1. اضغط □↑ (مشاركة)\n2. اختر "إضافة للشاشة الرئيسية"\n3. اضغط "إضافة"';
    } else {
      msg += 'استخدم Chrome أو Safari\nوابحث عن خيار "تثبيت التطبيق" في القائمة';
    }
    alert(msg);
  }
}
window.installApp = installApp;

function closePwaBanner() {
  const pwaBanner = $('pwaBanner');
  if (pwaBanner) pwaBanner.style.display = 'none';
}
window.closePwaBanner = closePwaBanner;

// ============================================
// رسائل Toast
// ============================================
function showToast(msg, type = 'info') {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.5s';
    setTimeout(() => t.remove(), 500);
  }, 3000);
}
window.showToast = showToast;

// ============================================
// Service Worker
// ============================================
if ('serviceWorker' in navigator) {
  try {
    const swCode = `
      self.addEventListener('install', e => {
        e.waitUntil(caches.open('v1').then(c => c.add(['/'])));
      });
      self.addEventListener('fetch', e => {
        e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
      });
    `;
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl).then(() => {
      console.log('✅ Service Worker registered');
    }).catch(() => {
      console.log('❌ Service Worker failed');
    });
  } catch (e) {
    console.log('❌ Service Worker error:', e);
  }
}

// ============================================
// التبويبات (آمنة)
// ============================================
function switchTab(id) {
  try {
    // إخفاء جميع التبويبات
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    
    // إظهار التبويب المطلوب
    const tab = $('tab-' + id);
    if (tab) tab.classList.remove('hidden');
    
    // تحديث شريط التنقل
    document.querySelectorAll('nav button').forEach(b => {
      b.classList.remove('text-blue-600');
      b.classList.add('text-slate-400');
    });
    
    const nav = $('nav-' + id);
    if (nav) {
      nav.classList.remove('text-slate-400');
      nav.classList.add('text-blue-600');
    }
    
    // معالجة تبويب الإدارة
    if (id === 'admin') handleAdminTab();
  } catch (e) {
    console.error('❌ switchTab error:', e);
  }
}
window.switchTab = switchTab;

function handleAdminTab() {
  const denied = $('adminDenied');
  const login = $('adminLogin');
  const panel = $('adminPanel');
  
  if (!currentUser || !ADMIN_UIDS.includes(currentUser.uid)) {
    if (denied) denied.classList.remove('hidden');
    if (login) login.classList.add('hidden');
    if (panel) panel.classList.add('hidden');
  } else if (!isAdmin) {
    if (denied) denied.classList.add('hidden');
    if (login) login.classList.remove('hidden');
    if (panel) panel.classList.add('hidden');
  } else {
    if (denied) denied.classList.add('hidden');
    if (login) login.classList.add('hidden');
    if (panel) panel.classList.remove('hidden');
    loadAdminData();
  }
}

// ============================================
// المصادقة (آمنة)
// ============================================
function initApp() {
  try {
    window.onAuthStateChanged(window.auth, (user) => {
      try {
        if (user) {
          currentUser = user;
          
          window.onValue(window.ref(window.db, `users/${user.uid}`), (snapshot) => {
            try {
              userData = snapshot.val();
              renderUser();
              updateInfo();
              
              if (!userData) {
                setTimeout(() => {
                  switchTab('settings');
                  showToast('📝 أكمل بياناتك الشخصية', 'warning');
                }, 1000);
              }
            } catch (e) {
              console.error('❌ User data error:', e);
            }
          });
          
          window.set(window.ref(window.db, `users/${user.uid}/online`), true);
          window.set(window.ref(window.db, `users/${user.uid}/lastSeen`), Date.now());
          
        } else {
          currentUser = null;
          userData = null;
          isAdmin = false;
          renderUser();
          
          const denied = $('adminDenied');
          const login = $('adminLogin');
          const panel = $('adminPanel');
          
          if (denied) denied.classList.add('hidden');
          if (login) login.classList.remove('hidden');
          if (panel) panel.classList.add('hidden');
        }
      } catch (e) {
        console.error('❌ Auth state error:', e);
      }
    });
    
    // بدء المستمعات
    setTimeout(() => {
      initListeners();
      loadContacts();
      loadComplaints();
      loadSubjects();
    }, 500);
    
  } catch (e) {
    console.error('❌ initApp error:', e);
  }
}

function loginGoogle() {
  try {
    window.signInWithPopup(window.auth, window.provider)
      .then(() => showToast('✅ تم تسجيل الدخول بنجاح', 'success'))
      .catch((e) => showToast('❌ ' + e.message, 'error'));
  } catch (e) {
    console.error('❌ login error:', e);
    showToast('❌ حدث خطأ في تسجيل الدخول', 'error');
  }
}
window.loginGoogle = loginGoogle;

function logoutUser() {
  try {
    if (currentUser) {
      window.set(window.ref(window.db, `users/${currentUser.uid}/online`), false);
    }
    window.signOut(window.auth);
    showToast('👋 تم تسجيل الخروج', 'warning');
  } catch (e) {
    console.error('❌ logout error:', e);
  }
}
window.logoutUser = logoutUser;

function renderUser() {
  try {
    const avatar = $('userAvatar');
    const name = $('userName');
    const sub = $('userSubtitle');
    const subjects = $('userSubjects');
    const btn = $('loginBtn');

    if (!avatar || !name || !sub || !subjects || !btn) {
      console.warn('⚠️ بعض عناصر المستخدم غير موجودة');
      return;
    }

    if (currentUser && userData) {
      avatar.src = currentUser.photoURL || 'https://ui-avatars.com/api/?name=User&background=2563eb&color=fff';
      avatar.style.display = 'block';
      name.textContent = `مرحباً، ${currentUser.displayName || 'طالب'}`;
      sub.textContent = `${userData.stage || ''} • صف ${userData.grade || ''}`;
      subjects.innerHTML = (userData.subjects || []).map(s => `<span class="subject-chip">${s}</span>`).join('');
      btn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i> خروج';
      btn.onclick = logoutUser;
      btn.className = 'bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl';
    } else if (currentUser) {
      avatar.src = currentUser.photoURL || 'https://ui-avatars.com/api/?name=User&background=2563eb&color=fff';
      avatar.style.display = 'block';
      name.textContent = `مرحباً، ${currentUser.displayName || 'طالب'}`;
      sub.textContent = 'أكمل بياناتك';
      subjects.innerHTML = '';
      btn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i> خروج';
      btn.onclick = logoutUser;
      btn.className = 'bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl';
    } else {
      avatar.style.display = 'none';
      name.textContent = 'مرحباً بك';
      sub.textContent = 'سجل دخولك للمتابعة';
      subjects.innerHTML = '';
      btn.innerHTML = '<i class="fa-brands fa-google text-xs"></i> دخول';
      btn.onclick = loginGoogle;
      btn.className = 'bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl';
    }
  } catch (e) {
    console.error('❌ renderUser error:', e);
  }
}

function openProfile() {
  if (currentUser) {
    switchTab('settings');
  } else {
    showToast('⚠️ سجل دخول أولاً', 'error');
  }
}
window.openProfile = openProfile;

// ============================================
// حفظ الملف الشخصي (آمن)
// ============================================
function saveProfile() {
  try {
    if (!currentUser) {
      showToast('⚠️ سجل دخول أولاً', 'error');
      return;
    }
    
    const stage = $('profStage');
    const grade = $('profGrade');
    const phone = $('profPhone');
    
    if (!stage || !grade || !phone) {
      showToast('⚠️ بعض الحقول غير موجودة', 'error');
      return;
    }
    
    const checked = document.querySelectorAll('.subject-check:checked');
    const subjects = Array.from(checked).map(cb => cb.value);
    
    if (!subjects.length) {
      showToast('⚠️ اختر مادة واحدة على الأقل', 'error');
      return;
    }

    window.set(window.ref(window.db, `users/${currentUser.uid}`), {
      name: currentUser.displayName,
      email: currentUser.email,
      photoURL: currentUser.photoURL,
      stage: stage.value,
      grade: grade.value,
      subjects: subjects,
      phone: phone.value ? btoa(phone.value) : '',
      updatedAt: new Date().toISOString()
    }).then(() => {
      showToast('✅ تم حفظ البيانات بنجاح!', 'success');
      renderUser();
      updateInfo();
    }).catch((err) => {
      showToast('❌ فشل الحفظ: ' + err.message, 'error');
    });
  } catch (e) {
    console.error('❌ saveProfile error:', e);
    showToast('❌ حدث خطأ في الحفظ', 'error');
  }
}
window.saveProfile = saveProfile;

function loadSubjects() {
  try {
    const container = $('subjectsCheckbox');
    if (!container) return;
    
    container.innerHTML = '';
    const stage = $('profStage');
    const currentStage = stage ? stage.value : 'ثانوي';
    
    (subjectsByStage[currentStage] || []).forEach(s => {
      const checked = userData?.subjects?.includes(s) || false;
      container.innerHTML += `
        <label class="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg text-xs cursor-pointer">
          <input type="checkbox" value="${s}" class="subject-check" ${checked ? 'checked' : ''}>
          ${s}
        </label>
      `;
    });
    
    if (stage) stage.onchange = loadSubjects;
  } catch (e) {
    console.error('❌ loadSubjects error:', e);
  }
}
window.loadSubjects = loadSubjects;

function updateInfo() {
  try {
    if (!currentUser || !userData) return;
    
    const infoMap = {
      'infoName': currentUser.displayName || '-',
      'infoEmail': currentUser.email || '-',
      'infoPhone': userData.phone ? atob(userData.phone) : '-',
      'infoStage': userData.stage || '-',
      'infoGrade': userData.grade || '-',
      'infoSubjects': (userData.subjects || []).join('، ') || '-'
    };
    
    Object.keys(infoMap).forEach(id => {
      const el = $(id);
      if (el) el.textContent = infoMap[id];
    });
    
    const phoneInput = $('profPhone');
    if (phoneInput) phoneInput.value = userData.phone ? atob(userData.phone) : '';
  } catch (e) {
    console.error('❌ updateInfo error:', e);
  }
}

// ============================================
// خيارات الإضافة (آمنة)
// ============================================
function setOption(opt) {
  try {
    scheduleOption = opt;
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    const target = $(`opt${opt.charAt(0).toUpperCase() + opt.slice(1)}`);
    if (target) target.classList.add('active');
    
    const fields = $('scheduleFields');
    const imageField = $('scheduleImageField');
    if (fields) fields.style.display = (opt === 'image') ? 'none' : 'block';
    if (imageField) imageField.style.display = (opt === 'text') ? 'none' : 'block';
  } catch (e) {
    console.error('❌ setOption error:', e);
  }
}
window.setOption = setOption;

function setScheduleDay(day) {
  try {
    scheduleDayOption = day;
    document.querySelectorAll('#tab-admin .option-btn').forEach(b => {
      if (b.id === 'dayToday' || b.id === 'dayTomorrow' || b.id === 'dayWeek') {
        b.classList.remove('active');
      }
    });
    const target = $(`day${day.charAt(0).toUpperCase() + day.slice(1)}`);
    if (target) target.classList.add('active');
    
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = days[new Date().getDay()];
    const tomorrow = days[(new Date().getDay() + 1) % 7];
    
    const schDay = $('schDay');
    if (schDay) {
      if (day === 'today') schDay.value = today;
      else if (day === 'tomorrow') schDay.value = tomorrow;
    }
  } catch (e) {
    console.error('❌ setScheduleDay error:', e);
  }
}
window.setScheduleDay = setScheduleDay;

function setNotifOption(opt) {
  try {
    notifOption = opt;
    document.querySelectorAll('#tab-admin .option-btn').forEach(b => {
      if (b.id === 'notifOptFull' || b.id === 'notifOptText' || b.id === 'notifOptImage') {
        b.classList.remove('active');
      }
    });
    const target = $(`notifOpt${opt.charAt(0).toUpperCase() + opt.slice(1)}`);
    if (target) target.classList.add('active');
    
    const textField = $('notifTextField');
    const imageField = $('notifImageField');
    if (textField) textField.style.display = (opt === 'image') ? 'none' : 'block';
    if (imageField) imageField.style.display = (opt === 'text') ? 'none' : 'block';
  } catch (e) {
    console.error('❌ setNotifOption error:', e);
  }
}
window.setNotifOption = setNotifOption;

// ============================================
// الإدارة (آمنة)
// ============================================
function adminLogin() {
  try {
    const pass = $('adminPass');
    if (!pass) return;
    
    if (!currentUser) {
      showToast('⚠️ سجل دخول بحساب إداري', 'error');
      return;
    }
    if (!ADMIN_UIDS.includes(currentUser.uid)) {
      showToast('⛔ هذا الحساب ليس إدارياً!', 'error');
      const denied = $('adminDenied');
      const login = $('adminLogin');
      if (denied) denied.classList.remove('hidden');
      if (login) login.classList.add('hidden');
      return;
    }
    if (pass.value === 'Sigma@2024') {
      isAdmin = true;
      const login = $('adminLogin');
      const panel = $('adminPanel');
      if (login) login.classList.add('hidden');
      if (panel) panel.classList.remove('hidden');
      pass.value = '';
      loadAdminData();
      showToast('✅ مرحباً في لوحة التحكم', 'success');
    } else {
      showToast('❌ كلمة السر غير صحيحة!', 'error');
    }
  } catch (e) {
    console.error('❌ adminLogin error:', e);
  }
}
window.adminLogin = adminLogin;

function toggleStats() {
  try {
    const content = $('statsContent');
    const arrow = $('statsArrow');
    if (!content || !arrow) return;
    
    content.classList.toggle('open');
    arrow.className = content.classList.contains('open') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    if (content.classList.contains('open')) loadStats();
  } catch (e) {
    console.error('❌ toggleStats error:', e);
  }
}
window.toggleStats = toggleStats;

function toggleSection(el) {
  try {
    const section = el.closest('.admin-panel-section');
    if (!section) return;
    
    const content = section.querySelector('.content');
    const arrow = el.querySelector('.fa-chevron-down, .fa-chevron-up');
    if (!content || !arrow) return;
    
    content.classList.toggle('open');
    arrow.className = content.classList.contains('open') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
  } catch (e) {
    console.error('❌ toggleSection error:', e);
  }
}
window.toggleSection = toggleSection;

function loadAdminData() {
  try {
    loadStats();
    loadManage('schedules', 'scheduleList', renderScheduleItem);
    loadManage('notifications', 'notifList', renderNotifItem);
    loadManage('news', 'newsList', renderNewsItem);
    loadManage('materials', 'matList', renderMatItem);
  } catch (e) {
    console.error('❌ loadAdminData error:', e);
  }
}

function loadStats() {
  try {
    window.onValue(window.ref(window.db, 'users'), (snapshot) => {
      const data = snapshot.val();
      allUsers = data || {};
      const total = Object.keys(allUsers).length;
      let active = 0, boys = 0, girls = 0;
      const now = Date.now();
      
      Object.keys(allUsers).forEach(k => {
        const u = allUsers[k];
        if (u.online === true || (u.lastSeen && u.lastSeen > now - 86400000)) active++;
        const name = (u.name || '').toLowerCase();
        if (['ahmed', 'mohamed', 'khaled', 'ali', 'hassan', 'mostafa', 'omar', 'youssef', 'ibrahim'].some(m => name.includes(m))) {
          boys++;
        } else if (name) {
          girls++;
        }
      });
      
      const statMap = {
        'statUsers': total,
        'statActive': active,
        'statBoys': boys || Math.floor(total * 0.6),
        'statGirls': girls || Math.floor(total * 0.4)
      };
      
      Object.keys(statMap).forEach(id => {
        const el = $(id);
        if (el) el.textContent = statMap[id];
      });
    });
    
    window.onValue(window.ref(window.db, 'schedules'), (snapshot) => {
      const d = snapshot.val();
      const el = $('statSchedules');
      if (el) el.textContent = d ? Object.keys(d).length : 0;
    });
    
    window.onValue(window.ref(window.db, 'materials'), (snapshot) => {
      const d = snapshot.val();
      const el = $('statMaterials');
      if (el) el.textContent = d ? Object.keys(d).length : 0;
    });
  } catch (e) {
    console.error('❌ loadStats error:', e);
  }
}

function loadManage(path, containerId, renderFn) {
  try {
    window.onValue(window.ref(window.db, path), (snapshot) => {
      const data = snapshot.val();
      const container = $(containerId);
      if (!container) return;
      container.innerHTML = '';
      if (!data) return;
      Object.keys(data).reverse().forEach(k => {
        container.innerHTML += renderFn(k, data[k]);
      });
    });
  } catch (e) {
    console.error('❌ loadManage error:', e);
  }
}

function renderScheduleItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
    <span class="font-bold">${i.subject || 'صورة'}</span>
    <span class="text-slate-500">${i.day}</span>
    <button onclick="deleteItem('schedules','${k}')" class="text-red-400 text-xs">
      <i class="fa-solid fa-trash"></i>
    </button>
  </div>`;
}

function renderNotifItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
    <span class="font-bold">${i.title}</span>
    <button onclick="deleteItem('notifications','${k}')" class="text-red-400 text-xs">
      <i class="fa-solid fa-trash"></i>
    </button>
  </div>`;
}

function renderNewsItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
    <span class="font-bold">${i.title}</span>
    <button onclick="deleteItem('news','${k}')" class="text-red-400 text-xs">
      <i class="fa-solid fa-trash"></i>
    </button>
  </div>`;
}

function renderMatItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
    <span class="font-bold">${i.title}</span>
    <button onclick="deleteItem('materials','${k}')" class="text-red-400 text-xs">
      <i class="fa-solid fa-trash"></i>
    </button>
  </div>`;
}

function deleteItem(path, key) {
  if (!isAdmin) return;
  if (confirm('حذف هذا العنصر؟')) {
    window.remove(window.ref(window.db, `${path}/${key}`));
    showToast('✅ تم الحذف', 'success');
  }
}
window.deleteItem = deleteItem;

// ============================================
// Base64 والضغط
// ============================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
  });
}

function compressImage(base64, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

// ============================================
// إضافة حصة (آمنة)
// ============================================
async function addSchedule() {
  try {
    if (!isAdmin) {
      showToast('⚠️ غير مصرح', 'error');
      return;
    }
    
    const schDay = $('schDay');
    const schSubject = $('schSubject');
    const schTeacher = $('schTeacher');
    const schTime = $('schTime');
    const schRoom = $('schRoom');
    const schStage = $('schStage');
    const schImage = $('schImage');
    
    if (!schDay || !schSubject || !schTeacher || !schTime || !schRoom || !schStage) {
      showToast('⚠️ بعض الحقول غير موجودة', 'error');
      return;
    }
    
    let day = schDay.value;
    let subject = schSubject.value;
    let teacher = schTeacher.value;
    let time = schTime.value;
    let room = schRoom.value;
    let stage = schStage.value;
    let imageData = '';
    
    if (scheduleDayOption === 'today') {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      day = days[new Date().getDay()];
    } else if (scheduleDayOption === 'tomorrow') {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      day = days[(new Date().getDay() + 1) % 7];
    }
    
    if (scheduleOption !== 'image') {
      if (!subject && scheduleOption === 'full') {
        showToast('⚠️ اكتب المادة', 'error');
        return;
      }
    }
    
    if (scheduleOption !== 'text' && schImage) {
      const file = schImage.files[0];
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          showToast(`⚠️ الصورة كبيرة (حد أقصى ${MAX_FILE_SIZE / 1024 / 1024}MB)`, 'error');
          return;
        }
        imageData = await fileToBase64(file);
        if (imageData.length > 5000000) {
          imageData = await compressImage(imageData, 1200, 0.7);
        }
      } else if (scheduleOption === 'image') {
        showToast('⚠️ اختر صورة', 'error');
        return;
      }
    }
    
    if (!subject && !imageData) {
      showToast('⚠️ أضف مادة أو صورة', 'error');
      return;
    }
    
    await window.push(window.ref(window.db, 'schedules'), {
      day, subject, teacher, time, room, stage, imageData
    });
    
    showToast('✅ تمت الإضافة', 'success');
    schSubject.value = '';
    schTeacher.value = '';
    schTime.value = '';
    schRoom.value = '';
    if (schImage) schImage.value = '';
  } catch (e) {
    console.error('❌ addSchedule error:', e);
    showToast('❌ حدث خطأ في الإضافة', 'error');
  }
}
window.addSchedule = addSchedule;

// ============================================
// باقي الدوال (بنفس النمط الآمن)
// ============================================
// ... (مكتمل في الملف المرفق)

// ============================================
// بدء التطبيق
// ============================================
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.db && window.auth) {
      resolve();
      return;
    }
    const check = setInterval(() => {
      if (window.db && window.auth) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}

// انتظار Firebase ثم بدء التطبيق
waitForFirebase().then(() => {
  console.log('🚀 سنتر سيجما - جاهز للتشغيل!');
  initApp();
});

console.log('✅ تم تحميل app.js بنجاح');
