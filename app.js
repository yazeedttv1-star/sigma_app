// Database State
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

// ====== 0. المزامنة والاستماع اللحظي للبيانات من Firebase ======
window.addEventListener('DOMContentLoaded', () => {
    initFirebaseSync();
});

function initFirebaseSync() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const db = firebase.database();

    // 1. شاشة الترحيب
    db.ref('splash').on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
            dbState.splash = val;
            updateSplashUI();
        }
    });

    // 2. الهيكل الأكاديمي
    db.ref('structure').on('value', (snapshot) => {
        dbState.structure = snapshot.val() || {};
        renderAcademicDropdowns();
        renderAdminAcademicDropdowns();
        renderAdminAcademicTreeList();
    });

    // 3. الأخبار
    db.ref('news').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.news = [];
        if (data) {
            Object.keys(data).forEach(key => {
                dbState.news.push({ id: key, ...data[key] });
            });
            dbState.news.reverse();
        }
        renderAdminNewsList();
        if (document.getElementById('home-screen').classList.contains('active')) {
            renderHome();
        }
    });

    // 4. الجدول الأسبوعي
    db.ref('schedule').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.schedule = [];
        if (data) {
            Object.keys(data).forEach(key => {
                dbState.schedule.push({ id: key, ...data[key] });
            });
        }
        renderAdminScheduleList();
        if (document.getElementById('home-screen').classList.contains('active')) {
            renderHome();
        }
    });

    // 5. المذكرات
    db.ref('materials').on('value', (snapshot) => {
        const data = snapshot.val();
        dbState.materials = [];
        if (data) {
            Object.keys(data).forEach(key => {
                dbState.materials.push({ id: key, ...data[key] });
            });
        }
        updateMaterialsFilterOptions();
        renderAdminMaterialsList();
        if (document.getElementById('materials-screen').classList.contains('active')) {
            renderMaterials();
        }
    });

    // 6. الإشعارات
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

    if (typeof firebase !== 'undefined' && firebase.apps.length) {
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
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
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

// ====== 3. القوائم المنسدلة للطلاب ======
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

// ====== 4. العرض والواجهات للطلاب ======
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
        chips.innerHTML = '<p class="empty-msg">لم تقم باختيار مواد</p>';
    }

    const newsContainer = document.getElementById('news-list');
    newsContainer.innerHTML = '';
    if (dbState.news.length) {
        dbState.news.forEach(n => {
            const div = document.createElement('div');
            div.className = 'news-card';
            div.innerHTML = `<div><h5>${n.title}</h5><p style="font-size:12px;">${n.body}</p></div>`;
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
            tr.innerHTML = `<td>${s.day}</td><td>${s.subject}</td><td>${s.time}</td><td>${s.room}</td>`;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">الجدول فارغ حالياً</td></tr>';
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

// ====== 5. لوحة تحكم الأدمن (إضافة ومسح فوري) ======
function handleAdminLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === "admin123") {
        goToScreen('admin-dashboard-screen');
        renderAdminAcademicDropdowns();
        renderAdminAcademicTreeList();
        renderAdminNewsList();
        renderAdminScheduleList();
        renderAdminMaterialsList();
    } else {
        alert("كلمة المرور غير صحيحة!");
    }
}

function logoutAdmin() {
    document.getElementById('admin-pass-input').value = '';
    goToScreen('login-screen');
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

// 1. إضافة مرحلة
function addStageOnly(e) {
    e.preventDefault();
    const stg = document.getElementById('admin-new-stage-input').value.trim();
    if (!stg) return;

    if (!dbState.structure[stg]) dbState.structure[stg] = {};

    firebase.database().ref('structure').set(dbState.structure)
        .then(() => {
            alert(`تمت إضافة المرحلة "${stg}" بنجاح!`);
            document.getElementById('admin-new-stage-input').value = '';
        });
}

// 2. إضافة صف
function addGradeOnly(e) {
    e.preventDefault();
    const stg = document.getElementById('admin-stage-dropdown-for-grade').value;
    const grd = document.getElementById('admin-new-grade-input').value.trim();
    if (!stg || !grd) return;

    if (!dbState.structure[stg]) dbState.structure[stg] = {};
    if (!dbState.structure[stg][grd]) dbState.structure[stg][grd] = [];

    firebase.database().ref('structure').set(dbState.structure)
        .then(() => {
            alert(`تمت إضافة الصف "${grd}" بنجاح!`);
            document.getElementById('admin-new-grade-input').value = '';
        });
}

// 3. إضافة مادة
function addSubjectOnly(e) {
    e.preventDefault();
    const stg = document.getElementById('admin-stage-dropdown-for-subject').value;
    const grd = document.getElementById('admin-grade-dropdown-for-subject').value;
    const sbj = document.getElementById('admin-new-subject-input').value.trim();
    if (!stg || !grd || !sbj) return;

    if (!dbState.structure[stg]) dbState.structure[stg] = {};
    if (!dbState.structure[stg][grd]) dbState.structure[stg][grd] = [];

    if (!dbState.structure[stg][grd].includes(sbj)) {
        dbState.structure[stg][grd].push(sbj);
    }

    firebase.database().ref('structure').set(dbState.structure)
        .then(() => {
            alert(`تمت إضافة المادة "${sbj}" بنجاح!`);
            document.getElementById('admin-new-subject-input').value = '';
        });
}

// 4. حذف وحفظ الهيكل الأكاديمي
function renderAdminAcademicTreeList() {
    const container = document.getElementById('admin-academic-tree-list');
    if (!container) return;
    container.innerHTML = '';

    if (!Object.keys(dbState.structure).length) {
        container.innerHTML = '<p class="empty-msg">لا توجد مراحل مضافة بعد</p>';
        return;
    }

    Object.keys(dbState.structure).forEach(stg => {
        const stageDiv = document.createElement('div');
        stageDiv.className = 'admin-delete-item';
        stageDiv.style.fontWeight = 'bold';
        stageDiv.innerHTML = `
            <span>🏛️ ${stg}</span>
            <button class="btn-danger-sm" onclick="deleteStage('${stg}')">حذف المرحلة بالكامل</button>
        `;
        container.appendChild(stageDiv);

        Object.keys(dbState.structure[stg] || {}).forEach(grd => {
            const gradeDiv = document.createElement('div');
            gradeDiv.className = 'admin-delete-item';
            gradeDiv.style.marginRight = '15px';
            gradeDiv.innerHTML = `
                <span>📚 ${grd}</span>
                <button class="btn-danger-sm" onclick="deleteGrade('${stg}', '${grd}')">حذف الصف</button>
            `;
            container.appendChild(gradeDiv);

            (dbState.structure[stg][grd] || []).forEach(sbj => {
                const subDiv = document.createElement('div');
                subDiv.className = 'admin-delete-item';
                subDiv.style.marginRight = '30px';
                subDiv.style.background = '#fff';
                subDiv.innerHTML = `
                    <span>📝 ${sbj}</span>
                    <button class="btn-danger-sm" onclick="deleteSubject('${stg}', '${grd}', '${sbj}')">حذف المادة</button>
                `;
                container.appendChild(subDiv);
            });
        });
    });
}

function deleteStage(stg) {
    if (confirm(`هل أنت تأكد من حذف مرحلة "${stg}" بالكامل؟`)) {
        delete dbState.structure[stg];
        firebase.database().ref('structure').set(dbState.structure);
    }
}

function deleteGrade(stg, grd) {
    if (confirm(`هل أنت تأكد من حذف الصف "${grd}"؟`)) {
        delete dbState.structure[stg][grd];
        firebase.database().ref('structure').set(dbState.structure);
    }
}

function deleteSubject(stg, grd, sbj) {
    if (confirm(`هل أنت تأكد من حذف المادة "${sbj}"؟`)) {
        dbState.structure[stg][grd] = dbState.structure[stg][grd].filter(s => s !== sbj);
        firebase.database().ref('structure').set(dbState.structure);
    }
}

// 5. إدارة الأخبار والجدول والمذكرات والإشعارات
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
        .then(() => alert("تم تحديث شاشة الترحيب فوراً!"));
}

function addNewsItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-news-title').value;
    const body = document.getElementById('admin-news-body').value;

    firebase.database().ref('news').push({ title, body, timestamp: Date.now() })
        .then(() => {
            alert("تم نشر الخبر فوراً!");
            document.getElementById('admin-news-title').value = '';
            document.getElementById('admin-news-body').value = '';
        });
}

function renderAdminNewsList() {
    const container = document.getElementById('admin-news-manage-list');
    if (!container) return;
    container.innerHTML = '';

    dbState.news.forEach(n => {
        const div = document.createElement('div');
        div.className = 'admin-delete-item';
        div.innerHTML = `
            <span><b>${n.title}</b></span>
            <button class="btn-danger-sm" onclick="deleteNewsItem('${n.id}')">حذف</button>
        `;
        container.appendChild(div);
    });
}

function deleteNewsItem(id) {
    if (confirm("حذف هذا الخبر؟")) {
        firebase.database().ref('news/' + id).remove();
    }
}

function addScheduleEntry(e) {
    e.preventDefault();
    const day = document.getElementById('admin-sched-day').value;
    const subject = document.getElementById('admin-sched-subject').value;
    const time = document.getElementById('admin-sched-time').value;
    const room = document.getElementById('admin-sched-room').value;

    firebase.database().ref('schedule').push({ day, subject, time, room })
        .then(() => {
            alert("تمت إضافة الحصة للجدول فوراً!");
            document.getElementById('admin-sched-day').value = '';
            document.getElementById('admin-sched-subject').value = '';
            document.getElementById('admin-sched-time').value = '';
            document.getElementById('admin-sched-room').value = '';
        });
}

function renderAdminScheduleList() {
    const container = document.getElementById('admin-schedule-manage-list');
    if (!container) return;
    container.innerHTML = '';

    dbState.schedule.forEach(s => {
        const div = document.createElement('div');
        div.className = 'admin-delete-item';
        div.innerHTML = `
            <span>${s.day} - ${s.subject} (${s.time})</span>
            <button class="btn-danger-sm" onclick="deleteScheduleItem('${s.id}')">حذف</button>
        `;
        container.appendChild(div);
    });
}

function deleteScheduleItem(id) {
    if (confirm("حذف هذه الحصة من الجدول؟")) {
        firebase.database().ref('schedule/' + id).remove();
    }
}

function addMaterialItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-mat-title').value;
    const subject = document.getElementById('admin-mat-subject').value;
    const url = document.getElementById('admin-mat-url').value;

    firebase.database().ref('materials').push({ title, subject, url })
        .then(() => {
            alert("تم إرسال المذكرة للطلاب فوراً!");
            document.getElementById('admin-mat-title').value = '';
            document.getElementById('admin-mat-subject').value = '';
            document.getElementById('admin-mat-url').value = '';
        });
}

function renderAdminMaterialsList() {
    const container = document.getElementById('admin-materials-manage-list');
    if (!container) return;
    container.innerHTML = '';

    dbState.materials.forEach(m => {
        const div = document.createElement('div');
        div.className = 'admin-delete-item';
        div.innerHTML = `
            <span><b>${m.title}</b> (${m.subject})</span>
            <button class="btn-danger-sm" onclick="deleteMaterialItem('${m.id}')">حذف</button>
        `;
        container.appendChild(div);
    });
}

function deleteMaterialItem(id) {
    if (confirm("حذف هذه المذكرة؟")) {
        firebase.database().ref('materials/' + id).remove();
    }
}

function sendNotificationItem(e) {
    e.preventDefault();
    const title = document.getElementById('admin-notif-title').value;
    const body = document.getElementById('admin-notif-body').value;

    firebase.database().ref('notifications').push({ title, body, timestamp: Date.now() })
        .then(() => {
            alert("تم إرسال الإشعار فوراً!");
            document.getElementById('admin-notif-title').value = '';
            document.getElementById('admin-notif-body').value = '';
        });
}
