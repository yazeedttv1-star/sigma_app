// Database Live State Engine
let dbState = {
    splash: { title: "سنتر سيجما التعليمي", sub: "أهلاً بك في منصتنا التعليمية المتكاملة", logo: "" },
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

let isAdminAuthenticated = false;

// ====== 0. المزامنة والاستماع اللحظي والحقيقي 100% (Firebase Live Sync) ======
window.addEventListener('DOMContentLoaded', () => {
    initFirebaseRealtimeSync();
});

function initFirebaseRealtimeSync() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const db = firebase.database();

    // 1. مزامنة شاشة الترحيب فورياً
    db.ref('splash').on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
            dbState.splash = val;
            updateSplashUI();
        }
    });

    // 2. مزامنة الهيكل الأكاديمي فورياً
    db.ref('structure').on('value', (snapshot) => {
        dbState.structure = snapshot.val() || {};
        renderAcademicDropdowns();
        renderAdminAcademicDropdowns();
        renderAdminAcademicTreeList();
    });

    // 3. مزامنة الأخبار والتنبيهات فورياً
    db.ref('news').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.news = [];
        if (data) {
            Object.keys(data).forEach(key => dbState.news.push({ id: key, ...data[key] }));
            dbState.news.reverse();
        }
        renderAdminNewsList();
        if (document.getElementById('home-screen').classList.contains('active')) renderHome();
    });

    // 4. مزامنة الجدول الأسبوعي فورياً
    db.ref('schedule').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.schedule = [];
        if (data) {
            Object.keys(data).forEach(key => dbState.schedule.push({ id: key, ...data[key] }));
        }
        renderAdminScheduleList();
        if (document.getElementById('home-screen').classList.contains('active')) renderHome();
    });

    // 5. مزامنة المذكرات والملفات فورياً
    db.ref('materials').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.materials = [];
        if (data) {
            Object.keys(data).forEach(key => dbState.materials.push({ id: key, ...data[key] }));
        }
        updateMaterialsFilterOptions();
        renderAdminMaterialsList();
        if (document.getElementById('materials-screen').classList.contains('active')) renderMaterials();
    });

    // 6. مزامنة الإشعارات فورياً
    db.ref('notifications').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.notifications = [];
        if (data) {
            Object.keys(data).forEach(key => dbState.notifications.push({ id: key, ...data[key] }));
            dbState.notifications.reverse();
        }
        renderAdminNotifList();
        if (document.getElementById('notifications-screen').classList.contains('active')) renderNotifications();
    });
}

// دالة عامة موحدة للإرسال والحذف الفوري في Firebase
function sendRealtimeUpdate(path, data, successMessage) {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        alert("تنبيه: Firebase غير مصل بشكل كامل، سيتم إجراء العملية محلياً.");
        return;
    }

    const dbRef = firebase.database().ref(path);
    let promise;

    if (data === null) {
        promise = dbRef.remove();
    } else if (typeof data === 'object' && !data.id && path.includes('/')) {
        promise = dbRef.set(data);
    } else if (typeof data === 'object' && !data.id) {
        promise = dbRef.push(data);
    } else {
        promise = dbRef.set(data);
    }

    promise.then(() => {
        if (successMessage) alert(successMessage);
    }).catch(err => {
        alert("خطأ في الإرسال الفوري: " + err.message);
    });
}

function updateSplashUI() {
    document.getElementById('splash-title').textContent = dbState.splash.title || "سنتر سيجما التعليمي";
    document.getElementById('splash-sub').textContent = dbState.splash.sub || "أهلاً بك في منصتنا التعليمية المتكاملة";
    
    if (dbState.splash.logo) {
        document.getElementById('splash-logo').src = dbState.splash.logo;
        document.getElementById('splash-logo').style.display = 'block';
        document.getElementById('splash-logo-placeholder').style.display = 'none';
    } else {
        document.getElementById('splash-logo').style.display = 'none';
        document.getElementById('splash-logo-placeholder').style.display = 'flex';
    }

    const adminTitle = document.getElementById('admin-splash-title');
    const adminSub = document.getElementById('admin-splash-sub');
    const adminLogo = document.getElementById('admin-splash-logo');
    if (adminTitle && !adminTitle.value) adminTitle.value = dbState.splash.title || "";
    if (adminSub && !adminSub.value) adminSub.value = dbState.splash.sub || "";
    if (adminLogo && !adminLogo.value) adminLogo.value = dbState.splash.logo || "";
}

// ====== 1. التنقل بين الشاشات والنظام الأمني ======
function goToScreen(screenId) {
    // حماية الشاشات: تمنع وصول أي طالب لشاشة الأدمن بدون كلمة المرور الصحيحة
    if (screenId === 'admin-dashboard-screen' && !isAdminAuthenticated) {
        alert("🔒 محاولة غير مصرح بها! يجب كتابة كلمة مرور الإدارة أولاً.");
        goToScreen('admin-login-screen');
        return;
    }

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

// ====== 2. تسجيل دخول الطلاب ======
function handleEmailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        firebase.auth().signInWithEmailAndPassword(email, pass)
            .then(res => {
                currentUser.email = res.user.email;
                goToScreen('selection-screen');
            })
            .catch(err => alert("خطأ في تسجيل دخول الطالب: " + err.message));
    } else {
        currentUser.email = email;
        goToScreen('selection-screen');
    }
}

function handleGoogleLogin() {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(res => {
                currentUser.email = res.user.email;
                goToScreen('selection-screen');
            })
            .catch(err => alert("خطأ في دخول Google: " + err.message));
    } else {
        currentUser.email = "student-google@gmail.com";
        goToScreen('selection-screen');
    }
}

// ====== 3. اختيار المواد والصف للطلاب ======
function renderAcademicDropdowns() {
    const select = document.getElementById('stage-select');
    if (!select) return;
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

// ====== 4. شاشات تصفح الطالب ======
function renderHome() {
    document.getElementById('user-display-name').textContent = currentUser.email || "طالب";

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
        chips.innerHTML = '<p class="empty-msg">لم تقم باختيار أي مواد مسجلة</p>';
    }

    const newsContainer = document.getElementById('news-list');
    newsContainer.innerHTML = '';
    if (dbState.news.length) {
        dbState.news.forEach(n => {
            const div = document.createElement('div');
            div.className = 'news-card';
            div.innerHTML = `<div><h5 style="color:#1e3c72; margin-bottom:4px;">${n.title}</h5><p style="font-size:12px; color:#444;">${n.body}</p></div>`;
            newsContainer.appendChild(div);
        });
    } else {
        newsContainer.innerHTML = '<p class="empty-msg">لا توجد أخبار تنبيهية حالياً</p>';
    }

    const tbody = document.getElementById('schedule-tbody');
    tbody.innerHTML = '';
    if (dbState.schedule.length) {
        dbState.schedule.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${s.day}</b></td><td>${s.subject}</td><td>${s.time}</td><td>${s.room}</td>`;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">الجدول الدراسي فارغ حالياً</td></tr>';
    }
}

function updateMaterialsFilterOptions() {
    const filter = document.getElementById('material-filter');
    if (!filter) return;
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
                    <h5 style="color:#1e3c72;">${m.title}</h5>
                    <p style="font-size:12px; color:gray;">المادة: ${m.subject}</p>
                </div>
                <a href="${m.url}" target="_blank" class="btn-primary" style="padding:6px 12px; font-size:12px; text-decoration:none; width:auto;">فتح PDF 📥</a>
            `;
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<p class="empty-msg">لا توجد مذكرات متاحة حالياً</p>';
    }
}

function renderNotifications() {
    const container = document.getElementById('notifications-container');
    container.innerHTML = '';

    if (dbState.notifications.length) {
        document.getElementById('notif-badge').textContent = dbState.notifications.length;
        dbState.notifications.forEach(n => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.margin = "0 0 10px 0";
            div.innerHTML = `<h5 style="color:#1e3c72; margin-bottom:5px;">🔔 ${n.title}</h5><p style="font-size:12px; color:#555;">${n.body}</p>`;
            container.appendChild(div);
        });
    } else {
        document.getElementById('notif-badge').textContent = '0';
        container.innerHTML = '<p class="empty-msg">لا توجد إشعارات جديدة</p>';
    }
}

// ====== 5. لوحة التحكم المقسمة إلى شاشات وحمايتها بالباسورد ======
function handleAdminLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-pass-input').value;
    
    // كلمة المرور السرية لفتح لوحة التحكم (يمكنك تغييرها من هنا)
    if (pass === "admin123") {
        isAdminAuthenticated = true;
        goToScreen('admin-dashboard-screen');
        renderAdminAcademicDropdowns();
        renderAdminAcademicTreeList();
        renderAdminNewsList();
        renderAdminScheduleList();
        renderAdminMaterialsList();
        renderAdminNotifList();
    } else {
        alert("❌ كلمة مرور الإدارة غير صحيحة!");
    }
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    document.getElementById('admin-pass-input').value = '';
    goToScreen('login-screen');
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-page').forEach(page => page.classList.remove('active'));

    const activeBtn = Array.from(document.querySelectorAll('.admin-tab-btn'))
        .find(b => b.getAttribute('onclick').includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');

    const targetPage = document.getElementById(tabId);
    if (targetPage) targetPage.classList.add('active');
}

// وظائف التحكم الفوري
function saveSplashSettings(e) {
    e.preventDefault();
    const title = document.getElementById('admin-splash-title').value.trim();
    const sub = document.getElementById('admin-splash-sub').value.trim();
    const logo = document.getElementById('admin-splash-logo').value.trim();

    sendRealtimeUpdate('splash', { title, sub, logo }, "⚡ تم تحديث السنتر واللوجو فوراً!");
}

function renderAdminAcademicDropdowns() {
    const stageGradeSelect = document.getElementById('admin-stage-dropdown-for-grade');
    const stageSubSelect = document.getElementById('admin-stage-dropdown-for-subject');
    if (!stageGradeSelect || !stageSubSelect) return;

    stageGradeSelect.innerHTML = '<option value="" disabled selected>اختر المرحلة...</option>';
    stageSubSelect.innerHTML = '<option value="" disabled selected>اختر المرحلة...</option>';

    Object.keys(dbState.structure).forEach(stg => {
        const opt1 = document.createElement('option');
        opt1.value = stg;
        opt1.textContent = stg;
        stageGradeSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = stg;
        opt2.textContent = stg;
        stageSubSelect.appendChild(opt2);
    });
}

function updateAdminGradesDropdown() {
    const stg = document.getElementById('admin-stage-dropdown-for-subject').value;
    const gradeSubSelect = document.getElementById('admin-grade-dropdown-for-subject');
    gradeSubSelect.innerHTML = '<option value="" disabled selected>اختر الصف...</option>';
    gradeSubSelect.disabled = false;

    if (dbState.structure[stg]) {
        Object.keys(dbState.structure[stg]).forEach(grd => {
            const opt = document.createElement('option');
            opt.value = grd;
            opt.textContent = grd;
            gradeSubSelect.appendChild(opt);
        });
    }
}

function addStageOnly(e) {
    e.preventDefault();
    const stg = document.getElementById('admin-new-stage-input').value.trim();
    if (!stg) return;
    if (!dbState.structure[stg]) dbState.structure[stg] = {};

    sendRealtimeUpdate('structure', dbState.structure, `⚡ تمت إضافة المرحلة "${stg}" فوراً!`);
    document.getElementById('admin-new-stage-input').value = '';
}

function addGradeOnly(e) {
    e.preventDefault();
    const stg = document.getElementById('admin-stage-dropdown-for-grade').value;
    const grd = document.getElementById('admin-new-grade-input').value.trim();
    if (!stg || !grd) return;

    if (!dbState.structure[stg]) dbState.structure[stg] = {};
    if (!dbState.structure[stg][grd]) dbState.structure[stg][grd] = [];

    sendRealtimeUpdate('structure', dbState.structure, `⚡ تمت إضافة الصف "${grd}" فوراً!`);
    document.getElementById('admin-new-grade-input').value = '';
}

function addSubjectOnly(e) {
    e.preventDefault();
    const stg = document.getElementById('admin-stage-dropdown-for-subject').value;
    const grd = document.getElementById('admin-grade-dropdown-for-subject').value;
    const sbj = document.getElementById('admin-new-subject-input').value.trim();
    if (!stg || !grd || !sbj) return;

    if (!dbState.structure[stg][grd].includes(sbj)) {
        dbState.structure[stg][grd].push(sbj);
    }

    sendRealtimeUpdate('structure', dbState.structure, `⚡ تمت إضافة المادة "${sbj}" فوراً!`);
    document.getElementById('admin-new-subject-input').value = '';
}

function renderAdminAcademicTreeList() {
    const container = document.getElementById('admin-academic-tree-list');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(dbState.structure).forEach(stg => {
        const stageDiv = document.createElement('div');
        stageDiv.className = 'admin-delete-item';
        stageDiv.innerHTML = `<span>🏛️ <b>${stg}</b></span><button class="btn-danger-sm" onclick="deleteStage('${stg}')">حذف المرحلة</button>`;
        container.appendChild(stageDiv);

        Object.keys(dbState.structure[stg] || {}).forEach(grd => {
            const gradeDiv = document.createElement('div');
            gradeDiv.className = 'admin-delete-item';
            gradeDiv.style.marginRight = '15px';
            gradeDiv.innerHTML = `<span>📚 ${grd}</span><button class="btn-danger-sm" onclick="deleteGrade('${stg}', '${grd}')">حذف الصف</button>`;
            container.appendChild(gradeDiv);

            (dbState.structure[stg][grd] || []).forEach(sbj => {
                const subDiv = document.createElement('div');
                subDiv.className = 'admin-delete-item';
                subDiv.style.marginRight = '30px';
                subDiv.style.background = '#fff';
                subDiv.innerHTML = `<span>📝 ${sbj}</span><button class="btn-danger-sm" onclick="deleteSubject('${stg}', '${grd}', '${sbj}')">حذف المادة</button>`;
                container.appendChild(subDiv);
            });
        });
    });
}

function deleteStage(stg) {
    if (confirm(`هل تريد حذف مرحلة "${stg}" بالكامل فوراً؟`)) {
        delete dbState.structure[stg];
        sendRealtimeUpdate('structure', dbState.structure, "⚡ تم حذف المرحلة فوراً");
    }
}

function deleteGrade(stg, grd) {
    if (confirm(`هل تريد حذف صف "${grd}" فوراً؟`)) {
        delete dbState.structure[stg][grd];
        sendRealtimeUpdate('structure', dbState.structure, "⚡ تم حذف الصف فوراً");
    }
}

function deleteSubject(stg, grd, sbj) {
    if (confirm(`هل تريد حذف مادة "${sbj}" فوراً؟`)) {
        dbState.structure[stg][grd] = dbState.structure[stg][grd].filter(s => s !== sbj);
        sendRealtimeUpdate('structure', dbState.structure, "⚡ تم حذف المادة فوراً");
    }
}

function addNewsItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-news-title').value;
    const body = document.getElementById('admin-news-body').value;
    
    sendRealtimeUpdate('news', { title, body, timestamp: Date.now() }, "⚡ تم نشر الخبر فوراً!");
    document.getElementById('admin-news-title').value = '';
    document.getElementById('admin-news-body').value = '';
}

function renderAdminNewsList() {
    const container = document.getElementById('admin-news-manage-list');
    if (!container) return;
    container.innerHTML = '';
    dbState.news.forEach(n => {
        const div = document.createElement('div');
        div.className = 'admin-delete-item';
        div.innerHTML = `<span><b>${n.title}</b></span><button class="btn-danger-sm" onclick="deleteNewsItem('${n.id}')">حذف الخبر</button>`;
        container.appendChild(div);
    });
}

function deleteNewsItem(id) {
    if (confirm("هل تريد حذف هذا الخبر فوراً؟")) {
        sendRealtimeUpdate('news/' + id, null, "⚡ تم حذف الخبر فوراً");
    }
}

function addScheduleEntry(e) {
    e.preventDefault();
    const day = document.getElementById('admin-sched-day').value;
    const subject = document.getElementById('admin-sched-subject').value;
    const time = document.getElementById('admin-sched-time').value;
    const room = document.getElementById('admin-sched-room').value;
    
    sendRealtimeUpdate('schedule', { day, subject, time, room }, "⚡ تم إضافة الحصة للجدول فوراً!");
}

function renderAdminScheduleList() {
    const container = document.getElementById('admin-schedule-manage-list');
    if (!container) return;
    container.innerHTML = '';
    dbState.schedule.forEach(s => {
        const div = document.createElement('div');
        div.className = 'admin-delete-item';
        div.innerHTML = `<span><b>${s.day}</b> - ${s.subject} (${s.time})</span><button class="btn-danger-sm" onclick="deleteScheduleItem('${s.id}')">حذف</button>`;
        container.appendChild(div);
    });
}

function deleteScheduleItem(id) {
    if (confirm("هل تريد حذف هذه الحصة فوراً؟")) {
        sendRealtimeUpdate('schedule/' + id, null, "⚡ تم حذف الحصة فوراً");
    }
}

function addMaterialItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-mat-title').value;
    const subject = document.getElementById('admin-mat-subject').value;
    const url = document.getElementById('admin-mat-url').value;

    sendRealtimeUpdate('materials', { title, subject, url }, "⚡ تم نشر المذكرة فوراً!");
    document.getElementById('admin-mat-title').value = '';
    document.getElementById('admin-mat-url').value = '';
}

function renderAdminMaterialsList() {
    const container = document.getElementById('admin-materials-manage-list');
    if (!container) return;
    container.innerHTML = '';
    dbState.materials.forEach(m => {
        const div = document.createElement('div');
        div.className = 'admin-delete-item';
        div.innerHTML = `<span><b>${m.title}</b> (${m.subject})</span><button class="btn-danger-sm" onclick="deleteMaterialItem('${m.id}')">حذف</button>`;
        container.appendChild(div);
    });
}

function deleteMaterialItem(id) {
    if (confirm("هل تريد حذف هذه المذكرة فوراً؟")) {
        sendRealtimeUpdate('materials/' + id, null, "⚡ تم حذف المذكرة فوراً");
    }
}

function sendNotificationItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-notif-title').value;
    const body = document.getElementById('admin-notif-body').value;

    sendRealtimeUpdate('notifications', { title, body, timestamp: Date.now() }, "⚡ تم بث الإشعار فوراً للطلاب!");
    document.getElementById('admin-notif-title').value = '';
    document.getElementById('admin-notif-body').value = '';
}

function renderAdminNotifList() {
    const container = document.getElementById('admin-notif-manage-list');
    if (!container) return;
    container.innerHTML = '';
    dbState.notifications.forEach(n => {
        const div = document.createElement('div');
        div.className = 'admin-delete-item';
        div.innerHTML = `<span><b>${n.title}</b></span><button class="btn-danger-sm" onclick="deleteNotifItem('${n.id}')">حذف</button>`;
        container.appendChild(div);
    });
}

function deleteNotifItem(id) {
    if (confirm("هل تريد حذف هذا الإشعار فوراً؟")) {
        sendRealtimeUpdate('notifications/' + id, null, "⚡ تم حذف الإشعار فوراً");
    }
}
