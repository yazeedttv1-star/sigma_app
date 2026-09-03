// ============================================
// app.js - سنتر سيجما التعليمي
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
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 ميجابايت

// ===== المواد حسب المرحلة =====
const subjectsByStage = {
  'ثانوي': ['فيزياء', 'كيمياء', 'رياضيات', 'أحياء', 'لغة عربية', 'لغة إنجليزية', 'فرنسية', 'تاريخ', 'جغرافيا', 'فلسفة'],
  'إعدادي': ['رياضيات', 'علوم', 'لغة عربية', 'لغة إنجليزية', 'دراسات', 'حاسب آلي']
};

// ============================================
// عرض الصور
// ============================================
function openImageViewer(imageSrc, title = 'صورة') {
  const viewer = document.getElementById('imageViewer');
  const img = document.getElementById('viewerImage');
  const info = document.getElementById('imageInfo');
  
  if (!viewer || !img) return;
  
  currentViewerImage = imageSrc;
  img.src = imageSrc;
  if (info) info.textContent = title;
  viewer.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
  const viewer = document.getElementById('imageViewer');
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

// ============================================
// PWA - تثبيت التطبيق
// ============================================
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  const pwaBanner = document.getElementById('pwaBanner');
  if (installBtn) installBtn.classList.add('show');
  if (pwaBanner) pwaBanner.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
  const installBtn = document.getElementById('installBtn');
  const pwaBanner = document.getElementById('pwaBanner');
  if (installBtn) installBtn.classList.remove('show');
  if (pwaBanner) pwaBanner.style.display = 'none';
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      if (result.outcome === 'accepted') {
        showToast('✅ تم تثبيت التطبيق!', 'success');
        const pwaBanner = document.getElementById('pwaBanner');
        if (pwaBanner) pwaBanner.style.display = 'none';
      } else {
        showToast('تم تخطي التثبيت', 'warning');
      }
      deferredPrompt = null;
      const installBtn = document.getElementById('installBtn');
      if (installBtn) installBtn.classList.remove('show');
    });
  } else {
    // عرض تعليمات التثبيت اليدوي
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

function closePwaBanner() {
  const pwaBanner = document.getElementById('pwaBanner');
  if (pwaBanner) pwaBanner.style.display = 'none';
}

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

// ============================================
// Service Worker
// ============================================
if ('serviceWorker' in navigator) {
  const swCode = `
    self.addEventListener('install', e => {
      e.waitUntil(
        caches.open('v1').then(c => c.add(['/']))
      );
    });
    self.addEventListener('fetch', e => {
      e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
      );
    });
  `;
  const swBlob = new Blob([swCode], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(swBlob);
  
  navigator.serviceWorker.register(swUrl)
    .then(() => console.log('✅ Service Worker registered'))
    .catch(() => console.log('❌ Service Worker failed'));
}

// ============================================
// التبويبات
// ============================================
function switchTab(id) {
  // إخفاء جميع التبويبات
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  
  // إظهار التبويب المطلوب
  const tab = document.getElementById(`tab-${id}`);
  if (tab) tab.classList.remove('hidden');
  
  // تحديث شريط التنقل
  document.querySelectorAll('nav button').forEach(b => {
    b.classList.remove('text-blue-600');
    b.classList.add('text-slate-400');
  });
  
  const nav = document.getElementById(`nav-${id}`);
  if (nav) {
    nav.classList.remove('text-slate-400');
    nav.classList.add('text-blue-600');
  }
  
  // معالجة تبويب الإدارة
  if (id === 'admin') handleAdminTab();
}

function handleAdminTab() {
  const denied = document.getElementById('adminDenied');
  const login = document.getElementById('adminLogin');
  const panel = document.getElementById('adminPanel');
  
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
// المصادقة
// ============================================
function initApp() {
  window.onAuthStateChanged(window.auth, (user) => {
    if (user) {
      currentUser = user;
      
      // قراءة بيانات المستخدم
      window.onValue(window.ref(window.db, `users/${user.uid}`), (snapshot) => {
        userData = snapshot.val();
        renderUser();
        updateInfo();
        
        if (!userData) {
          setTimeout(() => {
            switchTab('settings');
            showToast('📝 أكمل بياناتك الشخصية', 'warning');
          }, 1000);
        }
      });
      
      // تحديث حالة التواجد
      window.set(window.ref(window.db, `users/${user.uid}/online`), true);
      window.set(window.ref(window.db, `users/${user.uid}/lastSeen`), Date.now());
      
    } else {
      currentUser = null;
      userData = null;
      isAdmin = false;
      renderUser();
      
      const denied = document.getElementById('adminDenied');
      const login = document.getElementById('adminLogin');
      const panel = document.getElementById('adminPanel');
      
      if (denied) denied.classList.add('hidden');
      if (login) login.classList.remove('hidden');
      if (panel) panel.classList.add('hidden');
    }
  });
  
  // بدء المستمعات
  initListeners();
  loadContacts();
  loadComplaints();
  loadSubjects();
}

function loginGoogle() {
  window.signInWithPopup(window.auth, window.provider)
    .then(() => showToast('✅ تم تسجيل الدخول بنجاح', 'success'))
    .catch((e) => showToast('❌ ' + e.message, 'error'));
}

function logoutUser() {
  if (currentUser) {
    window.set(window.ref(window.db, `users/${currentUser.uid}/online`), false);
  }
  window.signOut(window.auth);
  showToast('👋 تم تسجيل الخروج', 'warning');
}

function renderUser() {
  const avatar = document.getElementById('userAvatar');
  const name = document.getElementById('userName');
  const sub = document.getElementById('userSubtitle');
  const subjects = document.getElementById('userSubjects');
  const btn = document.getElementById('loginBtn');

  if (!avatar || !name || !sub || !subjects || !btn) return;

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
}

function openProfile() {
  if (currentUser) {
    switchTab('settings');
  } else {
    showToast('⚠️ سجل دخول أولاً', 'error');
  }
}

// ============================================
// حفظ الملف الشخصي
// ============================================
function saveProfile() {
  if (!currentUser) {
    showToast('⚠️ سجل دخول أولاً', 'error');
    return;
  }
  
  const stage = document.getElementById('profStage')?.value;
  const grade = document.getElementById('profGrade')?.value;
  const phone = document.getElementById('profPhone')?.value;
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
    stage,
    grade,
    subjects,
    phone: phone ? btoa(phone) : '',
    updatedAt: new Date().toISOString()
  }).then(() => {
    showToast('✅ تم حفظ البيانات بنجاح!', 'success');
    renderUser();
    updateInfo();
  }).catch((err) => {
    showToast('❌ فشل الحفظ: ' + err.message, 'error');
  });
}

function loadSubjects() {
  const container = document.getElementById('subjectsCheckbox');
  if (!container) return;
  
  container.innerHTML = '';
  const stage = document.getElementById('profStage')?.value || 'ثانوي';
  (subjectsByStage[stage] || []).forEach(s => {
    const checked = userData?.subjects?.includes(s) || false;
    container.innerHTML += `
      <label class="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg text-xs cursor-pointer">
        <input type="checkbox" value="${s}" class="subject-check" ${checked ? 'checked' : ''}>
        ${s}
      </label>
    `;
  });
  
  const profStage = document.getElementById('profStage');
  if (profStage) profStage.onchange = loadSubjects;
}

function updateInfo() {
  if (currentUser && userData) {
    const infoMap = {
      'infoName': currentUser.displayName || '-',
      'infoEmail': currentUser.email || '-',
      'infoPhone': userData.phone ? atob(userData.phone) : '-',
      'infoStage': userData.stage || '-',
      'infoGrade': userData.grade || '-',
      'infoSubjects': (userData.subjects || []).join('، ') || '-'
    };
    
    Object.keys(infoMap).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = infoMap[id];
    });
    
    const phoneInput = document.getElementById('profPhone');
    if (phoneInput) phoneInput.value = userData.phone ? atob(userData.phone) : '';
  }
}

// ============================================
// خيارات الإضافة
// ============================================
function setOption(opt) {
  scheduleOption = opt;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`opt${opt.charAt(0).toUpperCase() + opt.slice(1)}`);
  if (target) target.classList.add('active');
  
  const fields = document.getElementById('scheduleFields');
  const imageField = document.getElementById('scheduleImageField');
  if (fields) fields.style.display = (opt === 'image') ? 'none' : 'block';
  if (imageField) imageField.style.display = (opt === 'text') ? 'none' : 'block';
}

function setScheduleDay(day) {
  scheduleDayOption = day;
  document.querySelectorAll('#tab-admin .option-btn').forEach(b => {
    if (b.id === 'dayToday' || b.id === 'dayTomorrow' || b.id === 'dayWeek') {
      b.classList.remove('active');
    }
  });
  const target = document.getElementById(`day${day.charAt(0).toUpperCase() + day.slice(1)}`);
  if (target) target.classList.add('active');
  
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = days[new Date().getDay()];
  const tomorrow = days[(new Date().getDay() + 1) % 7];
  
  const schDay = document.getElementById('schDay');
  if (schDay) {
    if (day === 'today') schDay.value = today;
    else if (day === 'tomorrow') schDay.value = tomorrow;
  }
}

function setNotifOption(opt) {
  notifOption = opt;
  document.querySelectorAll('#tab-admin .option-btn').forEach(b => {
    if (b.id === 'notifOptFull' || b.id === 'notifOptText' || b.id === 'notifOptImage') {
      b.classList.remove('active');
    }
  });
  const target = document.getElementById(`notifOpt${opt.charAt(0).toUpperCase() + opt.slice(1)}`);
  if (target) target.classList.add('active');
  
  const textField = document.getElementById('notifTextField');
  const imageField = document.getElementById('notifImageField');
  if (textField) textField.style.display = (opt === 'image') ? 'none' : 'block';
  if (imageField) imageField.style.display = (opt === 'text') ? 'none' : 'block';
}

// ============================================
// الإدارة
// ============================================
function adminLogin() {
  const pass = document.getElementById('adminPass')?.value;
  if (!currentUser) {
    showToast('⚠️ سجل دخول بحساب إداري', 'error');
    return;
  }
  if (!ADMIN_UIDS.includes(currentUser.uid)) {
    showToast('⛔ هذا الحساب ليس إدارياً!', 'error');
    const denied = document.getElementById('adminDenied');
    const login = document.getElementById('adminLogin');
    if (denied) denied.classList.remove('hidden');
    if (login) login.classList.add('hidden');
    return;
  }
  if (pass === 'Sigma@2024') {
    isAdmin = true;
    const login = document.getElementById('adminLogin');
    const panel = document.getElementById('adminPanel');
    if (login) login.classList.add('hidden');
    if (panel) panel.classList.remove('hidden');
    if (document.getElementById('adminPass')) document.getElementById('adminPass').value = '';
    loadAdminData();
    showToast('✅ مرحباً في لوحة التحكم', 'success');
  } else {
    showToast('❌ كلمة السر غير صحيحة!', 'error');
  }
}

function toggleStats() {
  const content = document.getElementById('statsContent');
  const arrow = document.getElementById('statsArrow');
  if (!content || !arrow) return;
  
  content.classList.toggle('open');
  arrow.className = content.classList.contains('open') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
  if (content.classList.contains('open')) loadStats();
}

function toggleSection(el) {
  const section = el.closest('.admin-panel-section');
  if (!section) return;
  
  const content = section.querySelector('.content');
  const arrow = el.querySelector('.fa-chevron-down, .fa-chevron-up');
  if (!content || !arrow) return;
  
  content.classList.toggle('open');
  arrow.className = content.classList.contains('open') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
}

function loadAdminData() {
  loadStats();
  loadManage('schedules', 'scheduleList', renderScheduleItem);
  loadManage('notifications', 'notifList', renderNotifItem);
  loadManage('news', 'newsList', renderNewsItem);
  loadManage('materials', 'matList', renderMatItem);
}

function loadStats() {
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
      const el = document.getElementById(id);
      if (el) el.textContent = statMap[id];
    });
  });
  
  window.onValue(window.ref(window.db, 'schedules'), (snapshot) => {
    const d = snapshot.val();
    const el = document.getElementById('statSchedules');
    if (el) el.textContent = d ? Object.keys(d).length : 0;
  });
  
  window.onValue(window.ref(window.db, 'materials'), (snapshot) => {
    const d = snapshot.val();
    const el = document.getElementById('statMaterials');
    if (el) el.textContent = d ? Object.keys(d).length : 0;
  });
}

function loadManage(path, containerId, renderFn) {
  window.onValue(window.ref(window.db, path), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (!data) return;
    Object.keys(data).reverse().forEach(k => {
      container.innerHTML += renderFn(k, data[k]);
    });
  });
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
// إضافة حصة
// ============================================
async function addSchedule() {
  if (!isAdmin) {
    showToast('⚠️ غير مصرح', 'error');
    return;
  }
  
  const schDay = document.getElementById('schDay');
  const schSubject = document.getElementById('schSubject');
  const schTeacher = document.getElementById('schTeacher');
  const schTime = document.getElementById('schTime');
  const schRoom = document.getElementById('schRoom');
  const schStage = document.getElementById('schStage');
  const schImage = document.getElementById('schImage');
  
  if (!schDay || !schSubject || !schTeacher || !schTime || !schRoom || !schStage) return;
  
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
}

// ============================================
// إرسال إشعار
// ============================================
async function sendNotif() {
  if (!isAdmin) return;
  
  const notifTitle = document.getElementById('notifTitle');
  const notifBody = document.getElementById('notifBody');
  const notifImage = document.getElementById('notifImage');
  const notifStage = document.getElementById('notifStage');
  const notifGrade = document.getElementById('notifGrade');
  const notifSubject = document.getElementById('notifSubject');
  
  if (!notifTitle || !notifBody || !notifStage || !notifGrade || !notifSubject) return;
  
  const title = notifTitle.value;
  let body = '';
  let imageData = '';
  
  if (notifOption !== 'image') {
    body = notifBody.value;
    if (!body) {
      showToast('⚠️ اكتب النص', 'error');
      return;
    }
  }
  
  if (notifOption !== 'text' && notifImage) {
    const file = notifImage.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`⚠️ الصورة كبيرة (حد أقصى ${MAX_FILE_SIZE / 1024 / 1024}MB)`, 'error');
        return;
      }
      imageData = await fileToBase64(file);
      if (imageData.length > 5000000) {
        imageData = await compressImage(imageData, 1200, 0.7);
      }
    } else if (notifOption === 'image') {
      showToast('⚠️ اختر صورة', 'error');
      return;
    }
  }
  
  if (!title) {
    showToast('⚠️ اكتب العنوان', 'error');
    return;
  }
  if (!body && !imageData) {
    showToast('⚠️ أضف نص أو صورة', 'error');
    return;
  }
  
  const stage = notifStage.value;
  const grade = notifGrade.value;
  const subject = notifSubject.value;
  
  await window.push(window.ref(window.db, 'notifications'), {
    title, body, stage, grade, subject, imageData,
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG')
  });
  
  showToast('✅ تم الإرسال', 'success');
  notifTitle.value = '';
  notifBody.value = '';
  notifSubject.value = '';
  if (notifImage) notifImage.value = '';
}

// ============================================
// نشر خبر
// ============================================
async function addNews() {
  if (!isAdmin) return;
  
  const newsTitle = document.getElementById('newsTitle');
  const newsContent = document.getElementById('newsContent');
  const newsImage = document.getElementById('newsImage');
  
  if (!newsTitle || !newsContent) return;
  
  const title = newsTitle.value;
  const content = newsContent.value;
  
  if (!title || !content) {
    showToast('⚠️ اكتب العنوان والمحتوى', 'error');
    return;
  }
  
  let imageData = '';
  if (newsImage) {
    const file = newsImage.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`⚠️ الصورة كبيرة (حد أقصى ${MAX_FILE_SIZE / 1024 / 1024}MB)`, 'error');
        return;
      }
      imageData = await fileToBase64(file);
      if (imageData.length > 5000000) {
        imageData = await compressImage(imageData, 1200, 0.7);
      }
    }
  }
  
  await window.push(window.ref(window.db, 'news'), {
    title, content, imageData,
    date: new Date().toLocaleDateString('ar-EG')
  });
  
  showToast('✅ تم النشر', 'success');
  newsTitle.value = '';
  newsContent.value = '';
  if (newsImage) newsImage.value = '';
}

// ============================================
// رفع مذكرة
// ============================================
async function uploadMat() {
  if (!isAdmin) return;
  
  const matTitle = document.getElementById('matTitle');
  const matSubject = document.getElementById('matSubject');
  const matType = document.getElementById('matType');
  const matFile = document.getElementById('matFile');
  
  if (!matTitle || !matSubject || !matType || !matFile) return;
  
  const title = matTitle.value;
  const subject = matSubject.value;
  const type = matType.value;
  const file = matFile.files[0];
  
  if (!title || !file) {
    showToast('⚠️ اكتب الاسم واختر ملف', 'error');
    return;
  }
  
  if (file.size > 20 * 1024 * 1024) {
    showToast('⚠️ الملف كبير (حد أقصى 20MB)', 'error');
    return;
  }
  
  const fileData = await fileToBase64(file);
  
  await window.push(window.ref(window.db, 'materials'), {
    title, subject, type, fileData,
    fileName: file.name,
    date: new Date().toLocaleDateString('ar-EG')
  });
  
  showToast('✅ تم الرفع', 'success');
  matTitle.value = '';
  matSubject.value = '';
  if (matFile) matFile.value = '';
}

// ============================================
// أرقام السنتر
// ============================================
function loadContacts() {
  window.onValue(window.ref(window.db, 'contacts'), (snapshot) => {
    const data = snapshot.val();
    contacts = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : [];
    renderContacts();
  });
}

function renderContacts() {
  const container = document.getElementById('contactsList');
  const center = document.getElementById('centerContacts');
  
  if (container) {
    container.innerHTML = contacts.map(c => `
      <div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
        <span>${c.type === 'whatsapp' ? '💬' : '📞'} ${c.number}</span>
        <button onclick="deleteContact('${c.id}')" class="text-red-400 text-xs">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');
  }
  
  if (center) {
    center.innerHTML = contacts.length ? contacts.map(c => `
      <div class="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg text-xs">
        <i class="${c.type === 'whatsapp' ? 'fa-brands fa-whatsapp text-green-600' : 'fa-solid fa-phone text-blue-600'}"></i>
        <span>${c.number}</span>
      </div>
    `).join('') : '<p class="text-xs text-slate-400 text-center">لا توجد أرقام</p>';
  }
}

function addContact() {
  if (!isAdmin) return;
  
  const newContact = document.getElementById('newContact');
  const contactType = document.getElementById('contactType');
  
  if (!newContact || !contactType) return;
  
  const number = newContact.value;
  const type = contactType.value;
  
  if (!number) {
    showToast('⚠️ اكتب الرقم', 'error');
    return;
  }
  
  window.push(window.ref(window.db, 'contacts'), { number, type });
  newContact.value = '';
  showToast('✅ تم الإضافة', 'success');
}

function deleteContact(id) {
  if (!isAdmin || !confirm('حذف الرقم؟')) return;
  window.remove(window.ref(window.db, `contacts/${id}`));
  showToast('✅ تم الحذف', 'success');
}

// ============================================
// الشكاوى
// ============================================
function loadComplaints() {
  window.onValue(window.ref(window.db, 'complaints'), (snapshot) => {
    const data = snapshot.val();
    complaints = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : [];
    renderComplaints();
  });
}

function renderComplaints() {
  const container = document.getElementById('complaintsList');
  if (!container) return;
  
  if (!complaints.length) {
    container.innerHTML = '<div class="text-center py-3 text-slate-400 text-xs">لا توجد شكاوى</div>';
    return;
  }
  
  container.innerHTML = complaints.reverse().map(c => {
    let phone = 'غير متوفر';
    try {
      if (c.userPhone) phone = atob(c.userPhone);
    } catch (e) {}
    
    return `<div class="complaint-card">
      <div class="flex justify-between">
        <span class="name">${c.userName || 'طالب'}</span>
        <span class="phone">📱 ${phone}</span>
      </div>
      <div class="text">${c.text}</div>
      <div class="flex justify-between mt-1">
        <span class="date">${c.date || ''}</span>
        <button onclick="deleteComplaint('${c.id}')" class="text-red-400 text-xs">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

function deleteComplaint(id) {
  if (!isAdmin || !confirm('حذف الشكوى؟')) return;
  window.remove(window.ref(window.db, `complaints/${id}`));
  showToast('✅ تم الحذف', 'success');
}

function sendComplaint() {
  const complaintText = document.getElementById('complaintText');
  if (!complaintText) return;
  
  const text = complaintText.value;
  if (!text) {
    showToast('⚠️ اكتب الشكوى', 'error');
    return;
  }
  if (!currentUser) {
    showToast('⚠️ سجل دخول أولاً', 'error');
    return;
  }
  
  window.push(window.ref(window.db, 'complaints'), {
    text,
    userId: currentUser.uid,
    userName: currentUser.displayName,
    userEmail: currentUser.email,
    userPhone: userData?.phone || '',
    date: new Date().toLocaleString('ar-EG'),
    timestamp: Date.now()
  });
  
  complaintText.value = '';
  showToast('✅ تم الإرسال', 'success');
}

// ============================================
// الجدول
// ============================================
function filterSchedule(type) {
  currentFilter = type;
  
  document.querySelectorAll('#tab-schedule .flex button').forEach(b => {
    b.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
  });
  
  const map = { today: 'btnToday', tomorrow: 'btnTomorrow', all: 'btnAll' };
  const btn = document.getElementById(map[type]);
  if (btn) btn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
  
  renderSchedule();
}

function renderSchedule() {
  const container = document.getElementById('scheduleContainer');
  if (!container) return;
  
  if (!scheduleData.length) {
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد حصص</div>';
    return;
  }
  
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = days[new Date().getDay()];
  const tomorrow = days[(new Date().getDay() + 1) % 7];
  
  let items = [...scheduleData];
  if (currentFilter === 'today') items = items.filter(i => i.day === today);
  if (currentFilter === 'tomorrow') items = items.filter(i => i.day === tomorrow);
  
  if (!items.length) {
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد حصص</div>';
    return;
  }
  
  container.innerHTML = items.map(i => `
    <div class="schedule-item">
      ${i.imageData ? `<img src="${i.imageData}" class="w-full h-24 object-cover rounded-lg mb-2" onclick="event.stopPropagation();openImageViewer('${i.imageData}','${i.subject || 'صورة الحصة'}')">` : ''}
      <div class="flex justify-between">
        <div>
          <div class="flex gap-1 mb-0.5">
            <span class="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">${i.day}</span>
            <span class="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">${i.stage || ''}</span>
          </div>
          <div class="subject">${i.subject || 'صورة'}</div>
          <div class="teacher"><i class="fa-solid fa-chalkboard-user"></i> ${i.teacher || ''}</div>
        </div>
        <div class="text-center">
          <div class="time">${i.time || ''}</div>
          <div class="text-[9px] text-slate-400">${i.room || ''}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderMySchedule() {
  const container = document.getElementById('myScheduleToday');
  if (!container) return;
  
  if (!scheduleData.length || !userData) {
    container.innerHTML = '<div class="text-center py-3 text-slate-400 text-xs">لا توجد حصص لك اليوم</div>';
    return;
  }
  
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = days[new Date().getDay()];
  
  const my = scheduleData.filter(i => {
    const dayMatch = i.day === today;
    const stageMatch = i.stage === userData.stage || !i.stage;
    const subjectMatch = !i.subject || (userData.subjects && userData.subjects.includes(i.subject));
    return dayMatch && stageMatch && subjectMatch;
  });
  
  if (!my.length) {
    container.innerHTML = '<div class="text-center py-3 text-slate-400 text-xs">📭 لا توجد حصص لك اليوم</div>';
    return;
  }
  
  container.innerHTML = my.map(i => `
    <div class="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
      <div>
        <span class="font-bold text-sm">${i.subject || 'صورة'}</span>
        <span class="text-xs text-slate-500 block">${i.teacher || ''}</span>
      </div>
      <div class="text-center">
        <span class="text-sm font-extrabold text-amber-600">${i.time || ''}</span>
        <span class="text-[9px] text-slate-400 block">${i.room || ''}</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// المستمعات
// ============================================
function initListeners() {
  // جدول الحصص
  window.onValue(window.ref(window.db, 'schedules'), (snapshot) => {
    const data = snapshot.val();
    scheduleData = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : [];
    renderSchedule();
    renderMySchedule();
    
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = days[new Date().getDay()];
    const count = scheduleData.filter(i => i.day === today).length;
    const el = document.getElementById('todayCount');
    if (el) el.textContent = count;
  });
  
  // الملفات
  window.onValue(window.ref(window.db, 'materials'), (snapshot) => {
    const data = snapshot.val();
    const count = data ? Object.keys(data).length : 0;
    const el = document.getElementById('materialCount');
    if (el) el.textContent = count;
    
    const container = document.getElementById('libraryContainer');
    if (!container) return;
    
    if (!data) {
      container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد ملفات</div>';
      return;
    }
    
    container.innerHTML = Object.keys(data).reverse().map(k => {
      const item = data[k];
      const isImage = item.type === 'image' || (item.fileData && item.fileData.startsWith('data:image'));
      
      return `<div class="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-xl ${item.type === 'pdf' ? 'bg-red-50' : 'bg-green-50'} flex items-center justify-center">
            <i class="fa-solid ${item.type === 'pdf' ? 'fa-file-pdf text-red-500' : 'fa-image text-green-500'} text-xl"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm">${item.title}</h4>
            <p class="text-[9px] text-slate-400">${item.subject || ''} • ${item.date || ''}</p>
          </div>
        </div>
        ${isImage ? 
          `<button onclick="openImageViewer('${item.fileData}','${item.title}')" class="bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs"><i class="fa-solid fa-eye"></i> عرض</button>` : 
          `<a href="${item.fileData || '#'}" ${item.fileData ? `download="${item.fileName || 'file'}"` : 'onclick="event.preventDefault();showToast(\'⚠️ لا يوجد ملف\',\'error\')"'} target="_blank" class="bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs">تحميل</a>`
        }
      </div>`;
    }).join('');
  });
  
  // الأخبار
  window.onValue(window.ref(window.db, 'news'), (snapshot) => {
    const data = snapshot.val();
    
    ['homeNewsContainer', 'allNewsContainer'].forEach(id => {
      const container = document.getElementById(id);
      if (!container) return;
      
      if (!data) {
        container.innerHTML = '<div class="text-center py-3 text-slate-400 text-xs">لا توجد أخبار</div>';
        return;
      }
      
      const keys = Object.keys(data).reverse();
      container.innerHTML = keys.map((k, idx) => {
        if (id === 'homeNewsContainer' && idx > 1) return '';
        const item = data[k];
        return `<div class="bg-white rounded-xl overflow-hidden border border-slate-200 news-item">
          ${item.imageData ? `<img src="${item.imageData}" class="w-full h-28 object-cover cursor-pointer" onclick="openImageViewer('${item.imageData}','${item.title}')">` : ''}
          <div class="p-3">
            <div class="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded inline-block">${item.date || ''}</div>
            <h4 class="font-bold text-sm mt-1">${item.title}</h4>
            <p class="text-xs text-slate-500">${item.content}</p>
          </div>
        </div>`;
      }).join('');
    });
  });
  
  // الإشعارات
  window.onValue(window.ref(window.db, 'notifications'), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('notificationsContainer');
    const badge = document.getElementById('notifBadge');
    
    if (!container) return;
    
    if (!data) {
      if (badge) badge.classList.add('hidden');
      container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs"><i class="fa-regular fa-bell-slash text-2xl block mb-1"></i>لا توجد إشعارات</div>';
      return;
    }
    
    let found = false;
    if (badge) badge.classList.remove('hidden');
    
    container.innerHTML = Object.keys(data).reverse().map(k => {
      const item = data[k];
      let target = true;
      
      if (userData) {
        if (item.stage !== 'الكل' && item.stage !== userData.stage) target = false;
        if (item.grade !== 'الكل' && item.grade !== userData.grade) target = false;
      }
      
      if (!target) return '';
      found = true;
      
      return `<div class="bg-white p-3 rounded-xl border border-slate-200 notif-item">
        <div class="flex gap-2">
          ${item.imageData ? `<img src="${item.imageData}" class="w-12 h-12 rounded-lg object-cover cursor-pointer" onclick="openImageViewer('${item.imageData}','${item.title}')">` : ''}
          <div>
            <h4 class="font-bold text-sm">${item.title}</h4>
            <p class="text-xs text-slate-600">${item.body}</p>
            <div class="flex gap-1 mt-1">
              <span class="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">${item.stage} • صف ${item.grade}</span>
              ${item.subject ? `<span class="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">${item.subject}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
    
    if (!found) {
      container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">لا توجد إشعارات لك</div>';
      if (badge) badge.classList.add('hidden');
    }
  });
}

// ============================================
// وضع الليل
// ============================================
function toggleDarkMode() {
  darkMode = !darkMode;
  const app = document.getElementById('app');
  if (app) app.classList.toggle('dark-mode', darkMode);
  
  const icon = document.getElementById('darkIcon');
  if (icon) {
    icon.className = darkMode ? 'fa-solid fa-sun text-lg' : 'fa-solid fa-moon text-lg';
  }
}

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

// تصدير الدوال للاستخدام العالمي
window.installApp = installApp;
window.closePwaBanner = closePwaBanner;
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.downloadImage = downloadImage;
window.switchTab = switchTab;
window.loginGoogle = loginGoogle;
window.logoutUser = logoutUser;
window.openProfile = openProfile;
window.saveProfile = saveProfile;
window.loadSubjects = loadSubjects;
window.setOption = setOption;
window.setScheduleDay = setScheduleDay;
window.setNotifOption = setNotifOption;
window.adminLogin = adminLogin;
window.toggleStats = toggleStats;
window.toggleSection = toggleSection;
window.deleteItem = deleteItem;
window.addSchedule = addSchedule;
window.sendNotif = sendNotif;
window.addNews = addNews;
window.uploadMat = uploadMat;
window.addContact = addContact;
window.deleteContact = deleteContact;
window.sendComplaint = sendComplaint;
window.deleteComplaint = deleteComplaint;
window.filterSchedule = filterSchedule;
window.toggleDarkMode = toggleDarkMode;
window.showToast = showToast;

console.log('✅ تم تحميل app.js بنجاح');
