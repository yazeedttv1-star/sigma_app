// Database State (تخزين محلي متزامن مع Firebase)
let dbState = {
    splash: { title: "سنتر سيجما", sub: "أهلاً بك في تطبيقنا التعليمي", logo: "" },
    structure: {},
    news: [],
    schedule: [],
    materials: [],
    notifications: []
};

let currentUser = {
    email: "",
    selectedStage: "",
    selectedGrade: "",
    selectedSubjects: []
};

// ====== 0. المزامنة والاستماع للبيانات من Firebase ======
window.addEventListener('DOMContentLoaded', () => {
    initFirebaseSync();
});

function initFirebaseSync() {
    if (!firebase.apps.length) return;

    const db = firebase.database();

    // 1. جلب إعدادات الشاشة الرئيسية
    db.ref('splash').on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
            dbState.splash = val;
            updateSplashUI();
        }
    });

    // 2. جلب الهيكل الأكاديمي (المراحل والصفوف والمواد)
    db.ref('structure').on('value', (snapshot) => {
        dbState.structure = snapshot.val() || {};
        renderAcademicDropdowns();
    });

    // 3. جلب الأخبار
    db.ref('news').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.news = data ? Object.values(data).reverse() : [];
        if (document.getElementById('home-screen').classList.contains('active')) {
            renderHome();
        }
    });

    // 4. جلب الجدول الأسبوعي
    db.ref('schedule').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.schedule = data ? Object.values(data) : [];
        if (document.getElementById('home-screen').classList.contains('active')) {
            renderHome();
        }
    });

    // 5. جلب المذكرات
    db.ref('materials').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.materials = data ? Object.values(data) : [];
        updateMaterialsFilterOptions();
        if (document.getElementById('materials-screen').classList.contains('active')) {
            renderMaterials();
        }
    });

    // 6. جلب الإشعارات
    db.ref('notifications').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.notifications = data ? Object.values(data).reverse() : [];
        if (document.getElementById('notifications-screen').classList.contains('active')) {
            renderNotifications();
        }
    });
}

function updateSplashUI() {
    document.getElementById('splash-title').textContent = dbState.splash.title || "سنتر سيجما";
    document.getElementById('splash-sub').textContent = dbState.splash.sub || "أهلاً بك في تطبيقنا التعليمي";
    if (dbState.splash.logo) {
        document.getElementById('splash-logo').src = dbState.splash.logo;
        document.getElementById('splash-logo').style.display = 'block';
        document.getElementById('splash-logo-placeholder').style.display = 'none';
    }
}

// ====== 1. إدارة التنقل بين الشاشات ======
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    const bottomBar = document.getElementById('bottom-bar');
    const mainScreens = ['home-screen', 'materials-screen', 'notifications-screen'];

    if (mainScreens.includes(screenId)) {
        bottomBar.style.display = 'flex';
        updateNavState(screenId);
    } else {
        bottomBar.style.display = 'none';
    }

    if (screenId === 'home-screen') renderHome();
    if (screenId === 'materials-screen') renderMaterials();
    if (screenId === 'notifications-screen') renderNotifications();
}

function updateNavState(screenId) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (screenId === 'home-screen') document.getElementById('nav-home').classList.add('active');
    if (screenId === 'materials-screen') document.getElementById('nav-materials').classList.add('active');
    if (screenId === 'notifications-screen') document.getElementById('nav-notifs').classList.add('active');
}

// ====== 2. المصادقة وتسجيل الدخول ======
function handleEmailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (firebase.apps.length) {
        firebase.auth().signInWithEmailAndPassword(email, pass)
            .then(res => {
                currentUser.email = res.user.email;
                goToScreen('selection-screen');
            })
            .catch(err => alert("خطأ في تسجيل الدخول: " + err.message));
    } else {
        currentUser.email = email;
        goToScreen('selection-screen');
    }
}

function handleGoogleLogin() {
    if (firebase.apps.length) {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(res => {
                currentUser.email = res.user.email;
                goToScreen('selection-screen');
            })
            .catch(err => alert("خطأ: " + err.message));
    } else {
        currentUser.email = "google-user@gmail.com";
        goToScreen('selection-screen');
    }
}

// ====== 3. شاشة الاختيار والتسجيل ======
function renderAcademicDropdowns() {
    const select = document.getElementById('stage-select');
    select.innerHTML = '<option value="" disabled selected>اختر المرحلة...</option>';
    Object.keys(dbState.structure).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        select.appendChild(opt);
    });
}

function updateGradesDropdown() {
    const stage = document.getElementById('stage-select').value;
    const gradeSelect = document.getElementById('grade-select');
    gradeSelect.innerHTML = '<option value="" disabled selected>اختر الصف...</option>';
    gradeSelect.disabled = false;

    if (dbState.structure[stage]) {
        Object.keys(dbState.structure[stage]).forEach(grade => {
            const opt = document.createElement('option');
            opt.value = grade;
            opt.textContent = grade;
            gradeSelect.appendChild(opt);
        });
    }
}

function updateSubjectsDropdown() {
    const stage = document.getElementById('stage-select').value;
    const grade = document.getElementById('grade-select').value;
    const container = document.getElementById('subjects-checkboxes');
    container.innerHTML = '';

    if (dbState.structure[stage] && dbState.structure[stage][grade]) {
        dbState.structure[stage][grade].forEach((sub, i) => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `<input type="checkbox" value="${sub}" id="sub-${i}"> <label for="sub-${i}">${sub}</label>`;
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<p class="empty-msg">لا توجد مواد مضافة لهذا الصف بعد</p>';
    }
}

function handleSelectionSubmit(e) {
    e.preventDefault();
    currentUser.selectedStage = document.getElementById('stage-select').value;
    currentUser.selectedGrade = document.getElementById('grade-select').value;
    currentUser.selectedSubjects = [];

    document.querySelectorAll('#subjects-checkboxes input:checked').forEach(cb => {
        currentUser.selectedSubjects.push(cb.value);
    });

    goToScreen('home-screen');
}

// ====== 4. عرض الواجهة الرئيسية ======
function renderHome() {
    document.getElementById('user-display-name').textContent = currentUser.email || "طالب";

    // المواد المشترك بها
    const chips = document.getElementById('enrolled-subjects');
    chips.innerHTML = '';
    if (currentUser.selectedSubjects.length) {
        currentUser.selectedSubjects.forEach(s => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = s;
            chips.appendChild(chip);
        });
    } else {
        chips.innerHTML = '<p class="empty-msg">لم تقم باختيار مواد</p>';
    }

    // الأخبار
    const newsContainer = document.getElementById('news-list');
    newsContainer.innerHTML = '';
    if (dbState.news.length) {
        dbState.news.forEach(n => {
            const div = document.createElement('div');
            div.className = 'news-card';
            div.innerHTML = `<h5>${n.title}</h5><p style="font-size:12px;">${n.body}</p>`;
            newsContainer.appendChild(div);
        });
    } else {
        newsContainer.innerHTML = '<p class="empty-msg">لا توجد أخبار تنبيهية حالياً</p>';
    }

    // الجدول
    const tbody = document.getElementById('schedule-tbody');
    tbody.innerHTML = '';
    if (dbState.schedule.length) {
        dbState.schedule.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${s.day}</td><td>${s.subject}</td><td>${s.time}</td><td>${s.room}</td>`;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">الجدول فارغ حالياً</td></tr>';
    }
}

// ====== 5. شاشة المذكرات ======
function updateMaterialsFilterOptions() {
    const filter = document.getElementById('material-filter');
    filter.innerHTML = '<option value="ALL">جميع المواد</option>';
    const subjects = [...new Set(dbState.materials.map(m => m.subject))];
    subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        filter.appendChild(opt);
    });
}

function renderMaterials() {
    const filter = document.getElementById('material-filter').value;
    const container = document.getElementById('materials-container');
    container.innerHTML = '';

    const list = filter === 'ALL' ? dbState.materials : dbState.materials.filter(m => m.subject === filter);

    if (list.length) {
        list.forEach(m => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.innerHTML = `
                <div>
                    <h5>${m.title}</h5>
                    <p style="font-size:11px; color:gray;">${m.subject}</p>
                </div>
                <a href="${m.url}" target="_blank" class="btn-primary" style="padding:4px 10px; font-size:12px; text-decoration:none;">فتح</a>
            `;
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<p class="empty-msg">لا توجد مذكرات متاحة</p>';
    }
}

// ====== 6. شاشة الإشعارات ======
function renderNotifications() {
    const container = document.getElementById('notifications-container');
    container.innerHTML = '';

    if (dbState.notifications.length) {
        document.getElementById('notif-badge').textContent = dbState.notifications.length;
        dbState.notifications.forEach(n => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.marginBottom = '8px';
            div.innerHTML = `<h5>${n.title}</h5><p style="font-size:12px; color:#555;">${n.body}</p>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('notif-badge').textContent = '0';
        container.innerHTML = '<p class="empty-msg">لا توجد إشعارات جديدة</p>';
    }
}

// ====== 7. لوحة تحكم الأدمن (حفظ حقيقي في Firebase) ======
function handleAdminLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-pass-input').value;

    if (pass === "admin123") {
        goToScreen('admin-dashboard-screen');
    } else {
        alert("كلمة المرور غير صحيحة!");
    }
}

function logoutAdmin() {
    document.getElementById('admin-pass-input').value = '';
    goToScreen('login-screen');
}

function saveSplashSettings(e) {
    e.preventDefault();
    const title = document.getElementById('admin-splash-title').value;
    const sub = document.getElementById('admin-splash-sub').value;
    const logo = document.getElementById('admin-splash-logo').value;

    const splashData = {
        title: title || dbState.splash.title,
        sub: sub || dbState.splash.sub,
        logo: logo || dbState.splash.logo
    };

    firebase.database().ref('splash').set(splashData)
        .then(() => alert("تم حفظ إعدادات شاشة الترحيب في Firebase!"))
        .catch(err => alert("خطأ في الحفظ: " + err.message));
}

function addAcademicStructure(e) {
    e.preventDefault();
    const stg = document.getElementById('admin-stage-input').value;
    const grd = document.getElementById('admin-grade-input').value;
    const sbj = document.getElementById('admin-subject-input').value;

    if (!dbState.structure[stg]) dbState.structure[stg] = {};
    if (!dbState.structure[stg][grd]) dbState.structure[stg][grd] = [];
    if (!dbState.structure[stg][grd].includes(sbj)) dbState.structure[stg][grd].push(sbj);

    firebase.database().ref('structure').set(dbState.structure)
        .then(() => alert("تمت إضافة النظام إلى Firebase بنجاح!"))
        .catch(err => alert("خطأ في الحفظ: " + err.message));
}

function addNewsItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-news-title').value;
    const body = document.getElementById('admin-news-body').value;

    firebase.database().ref('news').push({ title, body, timestamp: Date.now() })
        .then(() => {
            alert("تم نشر الخبر في Firebase!");
            document.getElementById('admin-news-title').value = '';
            document.getElementById('admin-news-body').value = '';
        })
        .catch(err => alert("خطأ في النشر: " + err.message));
}

function addScheduleEntry(e) {
    e.preventDefault();
    const day = document.getElementById('admin-sched-day').value;
    const subject = document.getElementById('admin-sched-subject').value;
    const time = document.getElementById('admin-sched-time').value;
    const room = document.getElementById('admin-sched-room').value;

    firebase.database().ref('schedule').push({ day, subject, time, room })
        .then(() => {
            alert("تمت إضافة الحصة للجدول!");
            document.getElementById('admin-sched-day').value = '';
            document.getElementById('admin-sched-subject').value = '';
            document.getElementById('admin-sched-time').value = '';
            document.getElementById('admin-sched-room').value = '';
        })
        .catch(err => alert("خطأ في الإضافة: " + err.message));
}

function addMaterialItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-mat-title').value;
    const subject = document.getElementById('admin-mat-subject').value;
    const url = document.getElementById('admin-mat-url').value;

    firebase.database().ref('materials').push({ title, subject, url })
        .then(() => {
            alert("تم رفع المذكرة بنجاح!");
            document.getElementById('admin-mat-title').value = '';
            document.getElementById('admin-mat-subject').value = '';
            document.getElementById('admin-mat-url').value = '';
        })
        .catch(err => alert("خطأ في إضافة المذكرة: " + err.message));
}

function sendNotificationItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-notif-title').value;
    const body = document.getElementById('admin-notif-body').value;

    firebase.database().ref('notifications').push({ title, body, timestamp: Date.now() })
        .then(() => {
            alert("تم إرسال الإشعار لجميع الطلاب!");
            document.getElementById('admin-notif-title').value = '';
            document.getElementById('admin-notif-body').value = '';
        })
        .catch(err => alert("خطأ في إرسال الإشعار: " + err.message));
}