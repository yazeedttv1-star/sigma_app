// ============================================
// app.js - سنتر سيجما التعليمي
// النسخة النهائية - تدعم 500+ مستخدم
// ============================================

// ===== المتغيرات العامة =====
let currentUser = null, userData = null, scheduleData = [];
let currentFilter = 'today', isAdmin = false, darkMode = false;
let allUsers = {}, contacts = [], complaints = [], scheduleOption = 'full';
let scheduleDayOption = 'today', notifOption = 'full';
let currentViewerImage = '';
let lastUserKey = null;
const PAGE_SIZE = 30;

const ADMIN_UIDS = ['WCyUdR31uZOxJwtYzXx85K7E0Cf2', 'ADMIN_UID_2', 'ADMIN_UID_3'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

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
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.downloadImage = downloadImage;

// ============================================
// Toast Notifications
// ============================================
function showToast(msg, type = 'info') {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3000);
}
window.showToast = showToast;

// ============================================
// انتظار Firebase
// ============================================
function waitForFirebase() {
  return new Promise(resolve => {
    if (window.db && window.auth) { resolve(); return; }
    const check = setInterval(() => {
      if (window.db && window.auth) { clearInterval(check); resolve(); }
    }, 100);
  });
}

// ============================================
// التبويبات
// ============================================
function switchTab(id) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`tab-${id}`)?.classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b => {
    b.classList.remove('text-blue-600');
    b.classList.add('text-slate-400');
  });
  const nav = document.getElementById(`nav-${id}`);
  if (nav) { nav.classList.remove('text-slate-400'); nav.classList.add('text-blue-600'); }
  if (id === 'admin') handleAdminTab();
}
window.switchTab = switchTab;

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
  window.onAuthStateChanged(window.auth, user => {
    if (user) {
      currentUser = user;
      window.onValue(window.ref(window.db, `users/${user.uid}`), snap => {
        userData = snap.val();
        renderUser();
        updateInfo();
        if (!userData) {
          setTimeout(() => { switchTab('settings'); showToast('📝 أكمل بياناتك', 'warning'); }, 1000);
        }
        document.getElementById('tab-login').classList.add('hidden');
        document.getElementById('tab-register').classList.add('hidden');
        document.getElementById('tab-home').classList.remove('hidden');
        document.querySelectorAll('nav button').forEach(b => {
          b.classList.remove('text-blue-600');
          b.classList.add('text-slate-400');
        });
        const nav = document.getElementById('nav-home');
        if (nav) { nav.classList.remove('text-slate-400'); nav.classList.add('text-blue-600'); }
      });
      window.set(window.ref(window.db, `users/${user.uid}/online`), true);
      window.set(window.ref(window.db, `users/${user.uid}/lastSeen`), Date.now());
    } else {
      currentUser = null; userData = null; isAdmin = false;
      document.getElementById('tab-login').classList.remove('hidden');
      document.getElementById('tab-register').classList.add('hidden');
      document.getElementById('tab-home').classList.add('hidden');
      document.getElementById('tab-schedule').classList.add('hidden');
      document.getElementById('tab-library').classList.add('hidden');
      document.getElementById('tab-news').classList.add('hidden');
      document.getElementById('tab-notifications').classList.add('hidden');
      document.getElementById('tab-exams').classList.add('hidden');
      document.getElementById('tab-results').classList.add('hidden');
      document.getElementById('tab-teachers').classList.add('hidden');
      document.getElementById('tab-settings').classList.add('hidden');
      document.getElementById('tab-admin').classList.add('hidden');
      document.querySelectorAll('nav button').forEach(b => {
        b.classList.remove('text-blue-600');
        b.classList.add('text-slate-400');
      });
      renderUser();
      document.getElementById('adminDenied').classList.add('hidden');
      document.getElementById('adminLogin').classList.remove('hidden');
      document.getElementById('adminPanel').classList.add('hidden');
    }
  });
  initListeners();
  loadContacts();
  loadComplaints();
  loadSubjects();
  loadTeachers();
  loadExams();
  loadResults();
  loadWeeklyFollow();
  loadProfileRequests();
}

// ===== تسجيل الدخول =====
function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showToast('⚠️ يرجى ملء جميع الحقول', 'error');
    return;
  }
  
  window.signInWithEmailAndPassword(window.auth, email, password)
    .then(result => {
      showToast('✅ تم تسجيل الدخول بنجاح', 'success');
    })
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        showToast('❌ لا يوجد حساب بهذا البريد', 'error');
      } else if (error.code === 'auth/wrong-password') {
        showToast('❌ كلمة المرور غير صحيحة', 'error');
      } else {
        showToast('❌ ' + error.message, 'error');
      }
    });
}
window.loginUser = loginUser;

// ===== إنشاء حساب جديد =====
function registerUser() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const idFile = document.getElementById('regIdImage').files[0];
  
  if (!name || !email || !phone || !password) {
    showToast('⚠️ يرجى ملء جميع الحقول', 'error');
    return;
  }
  
  if (password.length < 6) {
    showToast('⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
    return;
  }
  
  if (!idFile) {
    showToast('⚠️ يرجى رفع صورة البطاقة أو شهادة الميلاد', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.readAsDataURL(idFile);
  reader.onload = async function() {
    const idImage = reader.result;
    
    try {
      const result = await window.createUserWithEmailAndPassword(window.auth, email, password);
      const user = result.user;
      
      await window.set(window.ref(window.db, `users/${user.uid}`), {
        name: name,
        email: email,
        phone: phone,
        idImage: idImage,
        stage: '',
        grade: '',
        subjects: [],
        school: '',
        parentPhone: '',
        profileStatus: 'pending',
        createdAt: new Date().toISOString(),
        online: true,
        lastSeen: Date.now()
      });
      
      showToast('✅ تم إنشاء الحساب بنجاح! انتظر موافقة الإدارة', 'success');
      
      document.getElementById('regName').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPhone').value = '';
      document.getElementById('regPassword').value = '';
      document.getElementById('regIdImage').value = '';
      
      switchTab('login');
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showToast('❌ هذا البريد الإلكتروني مستخدم بالفعل', 'error');
      } else {
        showToast('❌ ' + error.message, 'error');
      }
    }
  };
}
window.registerUser = registerUser;

// ===== تسجيل الخروج =====
function logoutUser() {
  if (currentUser) {
    window.set(window.ref(window.db, `users/${currentUser.uid}/online`), false);
  }
  window.signOut(window.auth);
  showToast('👋 تم تسجيل الخروج', 'warning');
}
window.logoutUser = logoutUser;

// ===== حذف الحساب =====
function deleteAccount() {
  if (!currentUser) return showToast('⚠️ سجل دخول أولاً', 'error');
  
  if (confirm('⚠️ هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
    const uid = currentUser.uid;
    
    window.remove(window.ref(window.db, `users/${uid}`))
      .then(() => {
        return window.deleteUser(currentUser);
      })
      .then(() => {
        showToast('✅ تم حذف الحساب بنجاح', 'success');
        window.location.reload();
      })
      .catch(error => {
        if (error.code === 'auth/requires-recent-login') {
          showToast('⚠️ يرجى تسجيل الدخول مرة أخرى ثم المحاولة', 'warning');
          logoutUser();
        } else {
          showToast('❌ ' + error.message, 'error');
        }
      });
  }
}
window.deleteAccount = deleteAccount;

function renderUser() {
  const avatar = document.getElementById('userAvatar');
  const name = document.getElementById('userName');
  const sub = document.getElementById('userSubtitle');
  const subjects = document.getElementById('userSubjects');
  const btn = document.getElementById('loginBtn');

  if (currentUser && userData) {
    avatar.src = userData.idImage || 'https://ui-avatars.com/api/?name=User&background=2563eb&color=fff';
    avatar.style.display = 'block';
    name.textContent = `مرحباً، ${userData.name || 'طالب'}`;
    sub.textContent = `${userData.stage || ''} • صف ${userData.grade || ''}`;
    subjects.innerHTML = (userData.subjects || []).map(s => `<span class="subject-chip">${s}</span>`).join('');
    btn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i> خروج';
    btn.onclick = logoutUser;
    btn.className = 'bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl';
  } else if (currentUser) {
    avatar.src = 'https://ui-avatars.com/api/?name=User&background=2563eb&color=fff';
    avatar.style.display = 'block';
    name.textContent = `مرحباً، ${currentUser.email || 'طالب'}`;
    sub.textContent = 'أكمل بياناتك';
    subjects.innerHTML = '';
    btn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i> خروج';
    btn.onclick = logoutUser;
    btn.className = 'bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl';
  } else {
    avatar.style.display = 'none';
    name.textContent = 'مرحباً بك';
    sub.textContent = 'سجل دخولك';
    subjects.innerHTML = '';
  }
}

function openProfile() { if (currentUser) switchTab('settings'); else showToast('⚠️ سجل دخول', 'error'); }
window.openProfile = openProfile;

// ============================================
// حفظ الملف الشخصي
// ============================================
function saveProfile() {
  if (!currentUser) return showToast('⚠️ سجل دخول', 'error');
  
  const stage = document.getElementById('profStage').value;
  const grade = document.getElementById('profGrade').value;
  const phone = document.getElementById('profPhone').value;
  const school = document.getElementById('profSchool').value;
  const parentPhone = document.getElementById('profParentPhone').value;
  const checked = document.querySelectorAll('.subject-check:checked');
  const subjects = Array.from(checked).map(cb => cb.value);
  
  if (!subjects.length) return showToast('⚠️ اختر مادة', 'error');

  window.update(window.ref(window.db, `users/${currentUser.uid}`), {
    stage, grade, subjects,
    phone: phone,
    school: school,
    parentPhone: parentPhone,
    profileStatus: userData?.profileStatus || 'pending',
    updatedAt: new Date().toISOString()
  }).then(() => { 
    showToast('✅ تم حفظ البيانات', 'success'); 
    renderUser(); 
    updateInfo(); 
  });
}
window.saveProfile = saveProfile;

function loadSubjects() {
  const container = document.getElementById('subjectsCheckbox');
  if (!container) return;
  container.innerHTML = '';
  const stage = document.getElementById('profStage').value;
  (subjectsByStage[stage] || []).forEach(s => {
    const checked = userData?.subjects?.includes(s) || false;
    container.innerHTML += `<label class="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg text-xs cursor-pointer"><input type="checkbox" value="${s}" class="subject-check" ${checked?'checked':''}> ${s}</label>`;
  });
  document.getElementById('profStage').onchange = loadSubjects;
}
window.loadSubjects = loadSubjects;

function updateInfo() {
  if (currentUser && userData) {
    document.getElementById('infoName').textContent = userData.name || '-';
    document.getElementById('infoEmail').textContent = userData.email || '-';
    document.getElementById('infoPhone').textContent = userData.phone || '-';
    document.getElementById('infoParentPhone').textContent = userData.parentPhone || '-';
    document.getElementById('infoSchool').textContent = userData.school || '-';
    document.getElementById('infoStage').textContent = userData.stage || '-';
    document.getElementById('infoGrade').textContent = userData.grade || '-';
    document.getElementById('infoSubjects').textContent = (userData.subjects || []).join('، ') || '-';
    document.getElementById('infoStatus').textContent = userData.profileStatus === 'approved' ? '✅ معتمدة' : '⏳ قيد المراجعة';
    document.getElementById('infoStatus').className = userData.profileStatus === 'approved' ? 'font-bold text-green-600' : 'font-bold text-amber-600';
    
    document.getElementById('profPhone').value = userData.phone || '';
    document.getElementById('profSchool').value = userData.school || '';
    document.getElementById('profParentPhone').value = userData.parentPhone || '';
  }
}

// ============================================
// خيارات الإضافة
// ============================================
function setOption(opt) {
  scheduleOption = opt;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`opt${opt.charAt(0).toUpperCase()+opt.slice(1)}`).classList.add('active');
  document.getElementById('scheduleFields').style.display = (opt === 'image') ? 'none' : 'block';
  document.getElementById('scheduleImageField').style.display = (opt === 'text') ? 'none' : 'block';
}
window.setOption = setOption;

function setScheduleDay(day) {
  scheduleDayOption = day;
  document.querySelectorAll('#tab-admin .option-btn').forEach(b => {
    if (b.id === 'dayToday' || b.id === 'dayTomorrow' || b.id === 'dayWeek') {
      b.classList.remove('active');
    }
  });
  document.getElementById(`day${day.charAt(0).toUpperCase()+day.slice(1)}`).classList.add('active');
  
  const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const today = days[new Date().getDay()];
  const tomorrow = days[(new Date().getDay()+1)%7];
  
  if (day === 'today') {
    document.getElementById('schDay').value = today;
  } else if (day === 'tomorrow') {
    document.getElementById('schDay').value = tomorrow;
  }
}
window.setScheduleDay = setScheduleDay;

function setNotifOption(opt) {
  notifOption = opt;
  document.querySelectorAll('#tab-admin .option-btn').forEach(b => {
    if (b.id === 'notifOptFull' || b.id === 'notifOptText' || b.id === 'notifOptImage') {
      b.classList.remove('active');
    }
  });
  document.getElementById(`notifOpt${opt.charAt(0).toUpperCase()+opt.slice(1)}`).classList.add('active');
  document.getElementById('notifTextField').style.display = (opt === 'image') ? 'none' : 'block';
  document.getElementById('notifImageField').style.display = (opt === 'text') ? 'none' : 'block';
}
window.setNotifOption = setNotifOption;

// ============================================
// إدارة
// ============================================
function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  if (!currentUser) return showToast('⚠️ سجل دخول بحساب إداري', 'error');
  if (!ADMIN_UIDS.includes(currentUser.uid)) {
    showToast('⛔ ليس إدارياً', 'error');
    document.getElementById('adminDenied').classList.remove('hidden');
    document.getElementById('adminLogin').classList.add('hidden');
    return;
  }
  if (pass === 'Sigma@2024') {
    isAdmin = true;
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('adminPass').value = '';
    loadAdminData();
    showToast('✅ مرحباً في لوحة التحكم', 'success');
  } else {
    showToast('❌ كلمة السر خاطئة', 'error');
  }
}
window.adminLogin = adminLogin;

function toggleStats() {
  const content = document.getElementById('statsContent');
  const arrow = document.getElementById('statsArrow');
  content.classList.toggle('open');
  arrow.className = content.classList.contains('open') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
  if (content.classList.contains('open')) loadStats();
}
window.toggleStats = toggleStats;

function toggleSection(el) {
  const content = el.closest('.admin-panel-section').querySelector('.content');
  const arrow = el.querySelector('.fa-chevron-down, .fa-chevron-up');
  content.classList.toggle('open');
  arrow.className = content.classList.contains('open') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
}
window.toggleSection = toggleSection;

function loadAdminData() {
  loadStats();
  loadManage('schedules', 'scheduleList', renderScheduleItem);
  loadManage('notifications', 'notifList', renderNotifItem);
  loadManage('news', 'newsList', renderNewsItem);
  loadManage('materials', 'matList', renderMatItem);
}

function loadStats() {
  window.onValue(window.ref(window.db, 'users'), snap => {
    const data = snap.val();
    allUsers = data || {};
    const total = Object.keys(allUsers).length;
    let active = 0, boys = 0, girls = 0;
    const now = Date.now();
    Object.keys(allUsers).forEach(k => {
      const u = allUsers[k];
      if (u.online === true || (u.lastSeen && u.lastSeen > now - 86400000)) active++;
      const name = (u.name || '').toLowerCase();
      if (['ahmed','mohamed','khaled','ali','hassan','mostafa','omar','youssef','ibrahim'].some(m => name.includes(m))) boys++;
      else if (name) girls++;
    });
    document.getElementById('statUsers').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statBoys').textContent = boys || Math.floor(total * 0.6);
    document.getElementById('statGirls').textContent = girls || Math.floor(total * 0.4);
  });
  window.onValue(window.ref(window.db, 'schedules'), snap => {
    const d = snap.val();
    document.getElementById('statSchedules').textContent = d ? Object.keys(d).length : 0;
  });
  window.onValue(window.ref(window.db, 'materials'), snap => {
    const d = snap.val();
    document.getElementById('statMaterials').textContent = d ? Object.keys(d).length : 0;
  });
  window.onValue(window.ref(window.db, 'teachers'), snap => {
    const d = snap.val();
    document.getElementById('statTeachers').textContent = d ? Object.keys(d).length : 0;
  });
  window.onValue(window.ref(window.db, 'exams'), snap => {
    const d = snap.val();
    document.getElementById('statExams').textContent = d ? Object.keys(d).length : 0;
  });
  window.onValue(window.ref(window.db, 'results'), snap => {
    const d = snap.val();
    document.getElementById('statResults').textContent = d ? Object.keys(d).length : 0;
  });
  window.onValue(window.ref(window.db, 'notifications'), snap => {
    const d = snap.val();
    document.getElementById('statNotifs').textContent = d ? Object.keys(d).length : 0;
  });
}

function loadManage(path, containerId, renderFn) {
  window.onValue(window.ref(window.db, path), snap => {
    const data = snap.val();
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (!data) return;
    const keys = Object.keys(data).reverse().slice(0, 20);
    keys.forEach(k => container.innerHTML += renderFn(k, data[k]));
  });
}

function renderScheduleItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs"><span class="font-bold">${i.subject||'صورة'}</span><span class="text-slate-500">${i.day}</span><button onclick="deleteItem('schedules','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
}
function renderNotifItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs"><span class="font-bold">${i.title}</span><button onclick="deleteItem('notifications','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
}
function renderNewsItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs"><span class="font-bold">${i.title}</span><button onclick="deleteItem('news','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
}
function renderMatItem(k, i) {
  return `<div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs"><span class="font-bold">${i.title}</span><button onclick="deleteItem('materials','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
}

function deleteItem(path, key) {
  if (!isAdmin) return;
  if (confirm('حذف هذا العنصر؟')) {
    window.remove(window.ref(window.db, `${path}/${key}`));
    showToast('✅ تم الحذف', 'success');
  }
}
window.deleteItem = deleteItem;

function deleteAll(path) {
  if (!isAdmin) return;
  const names = {
    'notifications': 'الإشعارات',
    'news': 'الأخبار',
    'schedules': 'الحصص',
    'materials': 'الملفات',
    'exams': 'الامتحانات',
    'results': 'النتائج'
  };
  if (confirm(`⚠️ هل أنت متأكد من حذف كل ${names[path] || path}؟`)) {
    window.set(window.ref(window.db, path), null);
    showToast(`✅ تم حذف كل ${names[path] || path}`, 'success');
  }
}
window.deleteAll = deleteAll;

// ============================================
// إدارة المدرسين
// ============================================
function loadTeachers() {
  window.onValue(window.ref(window.db, 'teachers'), snap => {
    const data = snap.val();
    const container = document.getElementById('teachersContainer');
    const list = document.getElementById('teachersList');
    
    if (container) {
      container.innerHTML = '';
      if (!data) {
        container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا يوجد مدرسين</div>';
        return;
      }
      const keys = Object.keys(data).reverse().slice(0, 15);
      keys.forEach(k => {
        const t = data[k];
        container.innerHTML += `
          <div class="bg-white rounded-xl p-3 border border-slate-200">
            <div class="flex justify-between">
              <div>
                <span class="font-bold text-sm">${t.name}</span>
                <span class="text-xs text-slate-500 block">${t.subject}</span>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    if (list) {
      list.innerHTML = '';
      if (!data) return;
      const keys = Object.keys(data).reverse().slice(0, 15);
      keys.forEach(k => {
        const t = data[k];
        list.innerHTML += `
          <div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
            <span><strong>${t.name}</strong> - ${t.subject}</span>
            <button onclick="deleteItem('teachers','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
      });
    }
  });
}

function addTeacher() {
  if (!isAdmin) return;
  const name = document.getElementById('teacherName').value;
  const subject = document.getElementById('teacherSubject').value;
  if (!name || !subject) return showToast('⚠️ اكتب الاسم والمادة', 'error');
  window.push(window.ref(window.db, 'teachers'), { name, subject });
  document.getElementById('teacherName').value = '';
  document.getElementById('teacherSubject').value = '';
  showToast('✅ تم إضافة المدرس', 'success');
}
window.addTeacher = addTeacher;

// ============================================
// نظام الامتحانات
// ============================================
function loadExams() {
  window.onValue(window.ref(window.db, 'exams'), snap => {
    const data = snap.val();
    const container = document.getElementById('examsContainer');
    const list = document.getElementById('examsList');
    
    if (container) {
      container.innerHTML = '';
      if (!data) {
        container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد امتحانات</div>';
        return;
      }
      const keys = Object.keys(data).reverse().slice(0, 15);
      keys.forEach(k => {
        const e = data[k];
        container.innerHTML += `
          <div class="exam-card">
            <div class="flex justify-between">
              <div>
                <div class="exam-title">${e.title}</div>
                <div class="exam-info">📚 ${e.subject} • 📅 ${e.date}</div>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    if (list) {
      list.innerHTML = '';
      if (!data) return;
      const keys = Object.keys(data).reverse().slice(0, 15);
      keys.forEach(k => {
        const e = data[k];
        list.innerHTML += `
          <div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
            <span><strong>${e.title}</strong> - ${e.subject} (${e.date})</span>
            <button onclick="deleteItem('exams','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
      });
    }
  });
}

function addExam() {
  if (!isAdmin) return;
  const title = document.getElementById('examTitle').value;
  const subject = document.getElementById('examSubject').value;
  const date = document.getElementById('examDate').value;
  if (!title || !subject || !date) return showToast('⚠️ املأ جميع الحقول', 'error');
  window.push(window.ref(window.db, 'exams'), { title, subject, date });
  document.getElementById('examTitle').value = '';
  document.getElementById('examSubject').value = '';
  document.getElementById('examDate').value = '';
  showToast('✅ تم إضافة الامتحان', 'success');
}
window.addExam = addExam;

// ============================================
// نظام النتائج
// ============================================
function loadResults() {
  window.onValue(window.ref(window.db, 'results'), snap => {
    const data = snap.val();
    const container = document.getElementById('resultsContainer');
    const list = document.getElementById('resultsList');
    const select = document.getElementById('resultStudent');
    
    if (select) {
      select.innerHTML = '<option value="">اختر الطالب</option>';
      window.onValue(window.ref(window.db, 'users'), snap2 => {
        const users = snap2.val();
        if (users) {
          const keys = Object.keys(users).slice(0, 50);
          keys.forEach(k => {
            const u = users[k];
            select.innerHTML += `<option value="${k}">${u.name || 'طالب'}</option>`;
          });
        }
      });
    }
    
    if (container) {
      container.innerHTML = '';
      if (!data) {
        container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد نتائج</div>';
        return;
      }
      if (currentUser) {
        let found = false;
        const keys = Object.keys(data).reverse().slice(0, 20);
        keys.forEach(k => {
          const r = data[k];
          if (r.userId === currentUser.uid) {
            found = true;
            container.innerHTML += `
              <div class="result-card">
                <div class="flex justify-between">
                  <div>
                    <div class="result-subject">${r.subject}</div>
                    <div class="text-xs text-slate-500">${r.date || ''}</div>
                  </div>
                  <div class="result-score">${r.score}%</div>
                </div>
              </div>
            `;
          }
        });
        if (!found) {
          container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد نتائج لك</div>';
        }
      }
    }
    
    if (list) {
      list.innerHTML = '';
      if (!data) return;
      const keys = Object.keys(data).reverse().slice(0, 15);
      keys.forEach(k => {
        const r = data[k];
        list.innerHTML += `
          <div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
            <span><strong>${r.subject}</strong> - ${r.score}%</span>
            <button onclick="deleteItem('results','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
      });
    }
  });
}

function addResult() {
  if (!isAdmin) return;
  const userId = document.getElementById('resultStudent').value;
  const subject = document.getElementById('resultSubject').value;
  const score = document.getElementById('resultScore').value;
  if (!userId || !subject || !score) return showToast('⚠️ املأ جميع الحقول', 'error');
  window.push(window.ref(window.db, 'results'), { userId, subject, score, date: new Date().toLocaleDateString('ar-EG') });
  document.getElementById('resultSubject').value = '';
  document.getElementById('resultScore').value = '';
  showToast('✅ تم إضافة النتيجة', 'success');
}
window.addResult = addResult;

// ============================================
// المتابعة الأسبوعية
// ============================================
function loadWeeklyFollow() {
  window.onValue(window.ref(window.db, 'weekly_follow'), snap => {
    const data = snap.val();
    const list = document.getElementById('weeklyList');
    const select = document.getElementById('weeklyStudent');
    
    if (select) {
      select.innerHTML = '<option value="">اختر الطالب</option>';
      window.onValue(window.ref(window.db, 'users'), snap2 => {
        const users = snap2.val();
        if (users) {
          const keys = Object.keys(users).slice(0, 50);
          keys.forEach(k => {
            const u = users[k];
            select.innerHTML += `<option value="${k}">${u.name || 'طالب'}</option>`;
          });
        }
      });
    }
    
    if (list) {
      list.innerHTML = '';
      if (!data) {
        list.innerHTML = '<div class="text-center py-2 text-slate-400 text-xs">لا توجد متابعات</div>';
        return;
      }
      const keys = Object.keys(data).reverse().slice(0, 15);
      keys.forEach(k => {
        const f = data[k];
        list.innerHTML += `
          <div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
            <span><strong>${f.subject}</strong> - ${f.note}</span>
            <button onclick="deleteItem('weekly_follow','${k}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
      });
    }
  });
}

function addWeeklyFollow() {
  if (!isAdmin) return;
  const userId = document.getElementById('weeklyStudent').value;
  const subject = document.getElementById('weeklySubject').value;
  const note = document.getElementById('weeklyNote').value;
  if (!userId || !subject || !note) return showToast('⚠️ املأ جميع الحقول', 'error');
  window.push(window.ref(window.db, 'weekly_follow'), { userId, subject, note, date: new Date().toLocaleDateString('ar-EG') });
  document.getElementById('weeklySubject').value = '';
  document.getElementById('weeklyNote').value = '';
  showToast('✅ تم إضافة المتابعة', 'success');
}
window.addWeeklyFollow = addWeeklyFollow;

// ============================================
// طلبات تعديل البيانات
// ============================================
function loadProfileRequests() {
  window.onValue(window.ref(window.db, 'profile_requests'), snap => {
    const data = snap.val();
    const container = document.getElementById('profileRequestsList');
    if (!container) return;
    container.innerHTML = '';
    if (!data) {
      container.innerHTML = '<div class="text-center py-3 text-slate-400 text-xs">لا توجد طلبات</div>';
      return;
    }
    const keys = Object.keys(data).reverse().slice(0, 15);
    keys.forEach(k => {
      const r = data[k];
      container.innerHTML += `
        <div class="p-2 bg-slate-50 rounded-lg text-xs">
          <div class="flex justify-between">
            <span class="font-bold">${r.userName || 'طالب'}</span>
            <span class="${r.status === 'pending' ? 'text-amber-500' : 'text-green-500'}">${r.status === 'pending' ? '⏳ قيد المراجعة' : '✅ تم الموافقة'}</span>
          </div>
          <div class="text-slate-500">🏫 ${r.school} • 📱 ${r.parentPhone}</div>
          <div class="text-[10px] text-slate-400">${r.date}</div>
          ${r.idImage ? `<img src="${r.idImage}" class="w-16 h-16 object-cover rounded mt-1 cursor-pointer" onclick="openImageViewer('${r.idImage}','بطاقة الطالب')">` : ''}
          ${r.status === 'pending' ? `
            <div class="flex gap-1 mt-1">
              <button onclick="approveProfile('${k}')" class="bg-green-500 text-white px-2 py-0.5 rounded text-[10px]">✅ موافقة</button>
              <button onclick="rejectProfile('${k}')" class="bg-red-500 text-white px-2 py-0.5 rounded text-[10px]">❌ رفض</button>
            </div>
          ` : ''}
        </div>
      `;
    });
  });
}

function approveProfile(key) {
  if (!isAdmin) return;
  window.update(window.ref(window.db, `profile_requests/${key}/status`), 'approved');
  showToast('✅ تم الموافقة على الطلب', 'success');
}
window.approveProfile = approveProfile;

function rejectProfile(key) {
  if (!isAdmin) return;
  window.update(window.ref(window.db, `profile_requests/${key}/status`), 'rejected');
  showToast('❌ تم رفض الطلب', 'warning');
}
window.rejectProfile = rejectProfile;

// ============================================
// Base64
// ============================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
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
  if (!isAdmin) return showToast('⚠️ غير مصرح', 'error');
  
  let day = document.getElementById('schDay').value;
  let subject = document.getElementById('schSubject').value;
  let teacher = document.getElementById('schTeacher').value;
  let time = document.getElementById('schTime').value;
  let room = document.getElementById('schRoom').value;
  let stage = document.getElementById('schStage').value;
  let imageData = '';
  
  if (scheduleDayOption === 'today') {
    const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    day = days[new Date().getDay()];
  } else if (scheduleDayOption === 'tomorrow') {
    const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    day = days[(new Date().getDay()+1)%7];
  }
  
  if (scheduleOption !== 'image') {
    if (!subject && scheduleOption === 'full') return showToast('⚠️ اكتب المادة', 'error');
  }
  
  if (scheduleOption !== 'text') {
    const file = document.getElementById('schImage').files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return showToast(`⚠️ الصورة كبيرة (حد أقصى ${MAX_FILE_SIZE/1024/1024}MB)`, 'error');
      }
      imageData = await fileToBase64(file);
      if (imageData.length > 5000000) {
        imageData = await compressImage(imageData, 1200, 0.7);
      }
    } else if (scheduleOption === 'image') return showToast('⚠️ اختر صورة', 'error');
  }
  
  if (!subject && !imageData) return showToast('⚠️ أضف مادة أو صورة', 'error');
  
  await window.push(window.ref(window.db, 'schedules'), { day, subject, teacher, time, room, stage, imageData });
  showToast('✅ تمت الإضافة', 'success');
  document.getElementById('schSubject').value = '';
  document.getElementById('schTeacher').value = '';
  document.getElementById('schTime').value = '';
  document.getElementById('schRoom').value = '';
  document.getElementById('schImage').value = '';
}
window.addSchedule = addSchedule;

// ============================================
// إرسال إشعار
// ============================================
async function sendNotif() {
  if (!isAdmin) return;
  const title = document.getElementById('notifTitle').value;
  let body = '';
  let imageData = '';
  
  if (notifOption !== 'image') {
    body = document.getElementById('notifBody').value;
    if (!body) return showToast('⚠️ اكتب النص', 'error');
  }
  
  if (notifOption !== 'text') {
    const file = document.getElementById('notifImage').files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return showToast(`⚠️ الصورة كبيرة (حد أقصى ${MAX_FILE_SIZE/1024/1024}MB)`, 'error');
      }
      imageData = await fileToBase64(file);
      if (imageData.length > 5000000) {
        imageData = await compressImage(imageData, 1200, 0.7);
      }
    } else if (notifOption === 'image') return showToast('⚠️ اختر صورة', 'error');
  }
  
  if (!title) return showToast('⚠️ اكتب العنوان', 'error');
  if (!body && !imageData) return showToast('⚠️ أضف نص أو صورة', 'error');
  
  const stage = document.getElementById('notifStage').value;
  const grade = document.getElementById('notifGrade').value;
  const subject = document.getElementById('notifSubject').value;
  
  await window.push(window.ref(window.db, 'notifications'), { 
    title, body, stage, grade, subject, imageData,
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG')
  });
  
  showToast('✅ تم الإرسال', 'success');
  document.getElementById('notifTitle').value = '';
  document.getElementById('notifBody').value = '';
  document.getElementById('notifSubject').value = '';
  document.getElementById('notifImage').value = '';
}
window.sendNotif = sendNotif;

// ============================================
// نشر خبر
// ============================================
async function addNews() {
  if (!isAdmin) return;
  const title = document.getElementById('newsTitle').value;
  const content = document.getElementById('newsContent').value;
  if (!title || !content) return showToast('⚠️ اكتب العنوان والمحتوى', 'error');
  let imageData = '';
  const file = document.getElementById('newsImage').files[0];
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return showToast(`⚠️ الصورة كبيرة (حد أقصى ${MAX_FILE_SIZE/1024/1024}MB)`, 'error');
    }
    imageData = await fileToBase64(file);
    if (imageData.length > 5000000) {
      imageData = await compressImage(imageData, 1200, 0.7);
    }
  }
  await window.push(window.ref(window.db, 'news'), { title, content, imageData, date: new Date().toLocaleDateString('ar-EG') });
  showToast('✅ تم النشر', 'success');
  document.getElementById('newsTitle').value = '';
  document.getElementById('newsContent').value = '';
  document.getElementById('newsImage').value = '';
}
window.addNews = addNews;

// ============================================
// رفع مذكرة
// ============================================
async function uploadMat() {
  if (!isAdmin) return;
  const title = document.getElementById('matTitle').value;
  const subject = document.getElementById('matSubject').value;
  const type = document.getElementById('matType').value;
  const file = document.getElementById('matFile').files[0];
  if (!title || !file) return showToast('⚠️ اكتب الاسم واختر ملف', 'error');
  if (file.size > 20 * 1024 * 1024) return showToast('⚠️ الملف كبير (حد أقصى 20MB)', 'error');
  const fileData = await fileToBase64(file);
  await window.push(window.ref(window.db, 'materials'), { title, subject, type, fileData, fileName: file.name, date: new Date().toLocaleDateString('ar-EG') });
  showToast('✅ تم الرفع', 'success');
  document.getElementById('matTitle').value = '';
  document.getElementById('matSubject').value = '';
  document.getElementById('matFile').value = '';
}
window.uploadMat = uploadMat;

// ============================================
// أرقام السنتر والدعم
// ============================================
function loadContacts() {
  window.onValue(window.ref(window.db, 'contacts'), snap => {
    const data = snap.val();
    contacts = data ? Object.keys(data).map(k => ({id:k, ...data[k]})) : [];
    renderContacts();
  });
}

function renderContacts() {
  const container = document.getElementById('contactsList');
  const center = document.getElementById('centerContacts');
  const support = document.getElementById('supportContacts');
  
  const centerNumbers = contacts.filter(c => c.type === 'phone' || c.type === 'whatsapp');
  const supportNumbers = contacts.filter(c => c.type === 'support');
  
  if (container) {
    container.innerHTML = contacts.map(c => `
      <div class="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-xs">
        <span>${c.type === 'whatsapp' ? '💬' : c.type === 'support' ? '🛠️' : '📞'} ${c.number}</span>
        <button onclick="deleteContact('${c.id}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }
  
  if (center) {
    center.innerHTML = centerNumbers.length ? centerNumbers.map(c => `
      <div class="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg text-xs">
        <i class="${c.type === 'whatsapp' ? 'fa-brands fa-whatsapp text-green-600' : 'fa-solid fa-phone text-blue-600'}"></i>
        <span>${c.number}</span>
      </div>
    `).join('') : '<p class="text-xs text-slate-400 text-center">لا توجد أرقام</p>';
  }
  
  if (support) {
    support.innerHTML = supportNumbers.length ? supportNumbers.map(c => `
      <div class="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg text-xs">
        <i class="fa-solid fa-headset text-cyan-600"></i>
        <span>${c.number}</span>
      </div>
    `).join('') : `
      <div class="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg text-xs">
        <i class="fa-solid fa-phone text-blue-600"></i>
        <span>01012345678</span>
      </div>
      <div class="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg text-xs">
        <i class="fa-brands fa-whatsapp text-green-600"></i>
        <span>01012345678</span>
      </div>
    `;
  }
}

function addContact() {
  if (!isAdmin) return;
  const number = document.getElementById('newContact').value;
  const type = document.getElementById('contactType').value;
  if (!number) return showToast('⚠️ اكتب الرقم', 'error');
  window.push(window.ref(window.db, 'contacts'), { number, type });
  document.getElementById('newContact').value = '';
  showToast('✅ تم الإضافة', 'success');
}
window.addContact = addContact;

function deleteContact(id) {
  if (!isAdmin || !confirm('حذف الرقم؟')) return;
  window.remove(window.ref(window.db, `contacts/${id}`));
  showToast('✅ تم الحذف', 'success');
}
window.deleteContact = deleteContact;

// ============================================
// الشكاوى
// ============================================
function loadComplaints() {
  window.onValue(window.ref(window.db, 'complaints'), snap => {
    const data = snap.val();
    complaints = data ? Object.keys(data).map(k => ({id:k, ...data[k]})) : [];
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
  container.innerHTML = complaints.reverse().slice(0, 15).map(c => {
    let phone = c.userPhone || 'غير متوفر';
    return `<div class="complaint-card"><div class="flex justify-between"><span class="name">${c.userName||'طالب'}</span><span class="phone">📱 ${phone}</span></div><div class="text">${c.text}</div><div class="flex justify-between mt-1"><span class="date">${c.date||''}</span><button onclick="deleteComplaint('${c.id}')" class="text-red-400 text-xs"><i class="fa-solid fa-trash"></i></button></div></div>`;
  }).join('');
}

function deleteComplaint(id) {
  if (!isAdmin || !confirm('حذف الشكوى؟')) return;
  window.remove(window.ref(window.db, `complaints/${id}`));
  showToast('✅ تم الحذف', 'success');
}
window.deleteComplaint = deleteComplaint;

function sendComplaint() {
  const text = document.getElementById('complaintText').value;
  if (!text) return showToast('⚠️ اكتب الشكوى', 'error');
  if (!currentUser) return showToast('⚠️ سجل دخول أولاً', 'error');
  window.push(window.ref(window.db, 'complaints'), {
    text, userId: currentUser.uid, userName: userData?.name || currentUser.email,
    userEmail: currentUser.email, userPhone: userData?.phone || '',
    date: new Date().toLocaleString('ar-EG'), timestamp: Date.now()
  });
  document.getElementById('complaintText').value = '';
  showToast('✅ تم الإرسال', 'success');
}
window.sendComplaint = sendComplaint;

// ============================================
// الجدول
// ============================================
function filterSchedule(type) {
  currentFilter = type;
  document.querySelectorAll('#tab-schedule .flex button').forEach(b => {
    b.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
  });
  const map = {today:'btnToday', tomorrow:'btnTomorrow', all:'btnAll'};
  const btn = document.getElementById(map[type]);
  if (btn) btn.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
  renderSchedule();
}
window.filterSchedule = filterSchedule;

function renderSchedule() {
  const container = document.getElementById('scheduleContainer');
  if (!container) return;
  if (!scheduleData.length) {
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد حصص</div>';
    return;
  }
  const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const today = days[new Date().getDay()];
  const tomorrow = days[(new Date().getDay()+1)%7];
  let items = [...scheduleData];
  if (currentFilter === 'today') items = items.filter(i => i.day === today);
  if (currentFilter === 'tomorrow') items = items.filter(i => i.day === tomorrow);
  if (!items.length) {
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد حصص</div>';
    return;
  }
  items = items.slice(0, 20);
  container.innerHTML = items.map(i => `
    <div class="schedule-item">
      ${i.imageData ? `<img src="${i.imageData}" class="w-full h-24 object-cover rounded-lg mb-2" onclick="event.stopPropagation();openImageViewer('${i.imageData}','${i.subject||'صورة الحصة'}')">` : ''}
      <div class="flex justify-between">
        <div>
          <div class="flex gap-1 mb-0.5">
            <span class="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">${i.day}</span>
            <span class="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">${i.stage||''}</span>
          </div>
          <div class="subject">${i.subject||'صورة'}</div>
          <div class="teacher"><i class="fa-solid fa-chalkboard-user"></i> ${i.teacher||''}</div>
        </div>
        <div class="text-center">
          <div class="time">${i.time||''}</div>
          <div class="text-[9px] text-slate-400">${i.room||''}</div>
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
  const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
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
  
  container.innerHTML = my.slice(0, 10).map(i => `
    <div class="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
      <div>
        <span class="font-bold text-sm">${i.subject||'صورة'}</span>
        <span class="text-xs text-slate-500 block">${i.teacher||''}</span>
      </div>
      <div class="text-center">
        <span class="text-sm font-extrabold text-amber-600">${i.time||''}</span>
        <span class="text-[9px] text-slate-400 block">${i.room||''}</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// المستمعات
// ============================================
function initListeners() {
  window.onValue(window.ref(window.db, 'schedules'), snap => {
    const d = snap.val();
    scheduleData = d ? Object.keys(d).map(k => ({id:k, ...d[k]})) : [];
    renderSchedule();
    renderMySchedule();
    const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const today = days[new Date().getDay()];
    document.getElementById('todayCount').textContent = scheduleData.filter(i => i.day === today).length;
  });
  
  window.onValue(window.ref(window.db, 'materials'), snap => {
    const d = snap.val();
    document.getElementById('materialCount').textContent = d ? Object.keys(d).length : 0;
    const container = document.getElementById('libraryContainer');
    if (!container) return;
    if (!d) { container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">لا توجد ملفات</div>'; return; }
    const keys = Object.keys(d).reverse().slice(0, 20);
    container.innerHTML = keys.map(k => {
      const i = d[k];
      const isImage = i.type === 'image' || (i.fileData && i.fileData.startsWith('data:image'));
      return `<div class="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-xl ${i.type==='pdf'?'bg-red-50':'bg-green-50'} flex items-center justify-center">
            <i class="fa-solid ${i.type==='pdf'?'fa-file-pdf text-red-500':'fa-image text-green-500'} text-xl"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm">${i.title}</h4>
            <p class="text-[9px] text-slate-400">${i.subject||''} • ${i.date||''}</p>
          </div>
        </div>
        ${isImage ? `<button onclick="openImageViewer('${i.fileData}','${i.title}')" class="bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs"><i class="fa-solid fa-eye"></i> عرض</button>` : 
        `<a href="${i.fileData||'#'}" ${i.fileData ? `download="${i.fileName||'file'}"` : 'onclick="event.preventDefault();showToast(\'⚠️ لا يوجد ملف\',\'error\')"'} target="_blank" class="bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs">تحميل</a>`}
      </div>`;
    }).join('');
  });
  
  window.onValue(window.ref(window.db, 'news'), snap => {
    const d = snap.val();
    ['homeNewsContainer', 'allNewsContainer'].forEach(id => {
      const c = document.getElementById(id);
      if (!c) return;
      if (!d) { c.innerHTML = '<div class="text-center py-3 text-slate-400 text-xs">لا توجد أخبار</div>'; return; }
      const keys = Object.keys(d).reverse().slice(0, id === 'homeNewsContainer' ? 3 : 20);
      c.innerHTML = keys.map((k) => {
        const i = d[k];
        return `<div class="bg-white rounded-xl overflow-hidden border border-slate-200 news-item">
          ${i.imageData ? `<img src="${i.imageData}" class="w-full h-28 object-cover cursor-pointer" onclick="openImageViewer('${i.imageData}','${i.title}')">` : ''}
          <div class="p-3">
            <div class="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded inline-block">${i.date||''}</div>
            <h4 class="font-bold text-sm mt-1">${i.title}</h4>
            <p class="text-xs text-slate-500">${i.content}</p>
          </div>
        </div>`;
      }).join('');
    });
  });
  
  window.onValue(window.ref(window.db, 'notifications'), snap => {
    const d = snap.val();
    const container = document.getElementById('notificationsContainer');
    const badge = document.getElementById('notifBadge');
    if (!container) return;
    if (!d) { badge?.classList.add('hidden'); container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs"><i class="fa-regular fa-bell-slash text-2xl block mb-1"></i>لا توجد إشعارات</div>'; return; }
    let found = false;
    badge?.classList.remove('hidden');
    const keys = Object.keys(d).reverse().slice(0, 20);
    container.innerHTML = keys.map(k => {
      const i = d[k];
      let target = true;
      if (userData) {
        if (i.stage !== 'الكل' && i.stage !== userData.stage) target = false;
        if (i.grade !== 'الكل' && i.grade !== userData.grade) target = false;
      }
      if (!target) return '';
      found = true;
      return `<div class="bg-white p-3 rounded-xl border border-slate-200 notif-item">
        <div class="flex gap-2">
          ${i.imageData ? `<img src="${i.imageData}" class="w-12 h-12 rounded-lg object-cover cursor-pointer" onclick="openImageViewer('${i.imageData}','${i.title}')">` : ''}
          <div>
            <h4 class="font-bold text-sm">${i.title}</h4>
            <p class="text-xs text-slate-600">${i.body}</p>
            <div class="flex gap-1 mt-1">
              <span class="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">${i.stage} • صف ${i.grade}</span>
              ${i.subject ? `<span class="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">${i.subject}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
    if (!found) { container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">لا توجد إشعارات لك</div>'; badge?.classList.add('hidden'); }
  });
}

// ============================================
// وضع الليل
// ============================================
function toggleDarkMode() {
  darkMode = !darkMode;
  document.getElementById('app').classList.toggle('dark-mode', darkMode);
  document.getElementById('darkIcon').className = darkMode ? 'fa-solid fa-sun text-lg' : 'fa-solid fa-moon text-lg';
}
window.toggleDarkMode = toggleDarkMode;

// ============================================
// بدء التطبيق
// ============================================
waitForFirebase().then(() => {
  console.log('🚀 سنتر سيجما - جاهز للتشغيل!');
  console.log('📊 يدعم حتى 500+ مستخدم متزامن');
  initApp();
});

console.log('✅ app.js تم تحميله بنجاح');
