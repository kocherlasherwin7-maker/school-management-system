/**
 * Authentication Module
 * Handles login, logout, session management, and UI state
 */

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

// ====== LOGIN HELPERS ======
function togglePassword() {
    const pwd = document.getElementById('password');
    const icon = document.querySelector('.pwd-toggle i');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        pwd.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function fillCreds(email, password) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
    document.querySelector('.btn-login').click();
}

// ====== DRAWER ======
function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    
    // Ensure drawer nav is populated when opening
    if (drawer && !drawer.classList.contains('open')) {
        const user = security.currentUser;
        if (user) {
            updateDrawerForRole(user);
            updateBottomTabsForRole(user);
        }
    }
    
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (security.validateSession()) {
        showApp();
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.btn-login');
    const loginError = document.getElementById('loginError');

    if (!security.checkRateLimit('login', 5, 60000)) {
        loginError.textContent = 'Too many attempts. Try again later.';
        loginError.style.display = 'block';
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0;"></div>';
    loginError.style.display = 'none';

    setTimeout(() => {
        const result = security.authenticate(email, password);
        if (result.success) {
            showApp();
            showToast('Welcome back, ' + result.user.name + '!', 'success');
        } else {
            loginError.textContent = result.message;
            loginError.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
        }
    }, 500);
}

function handleLogout() {
    security.logout();
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginForm').reset();
    document.querySelector('.btn-login').disabled = false;
    document.querySelector('.btn-login').innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
    showToast('Logged out successfully', 'info');
}

function showApp() {
    try {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';

        const user = security.currentUser;
        if (user) {
            const drawerNameEl = document.getElementById('drawerName');
            const drawerRoleEl = document.getElementById('drawerRole');
            if (drawerNameEl) drawerNameEl.textContent = user.name;
            if (drawerRoleEl) drawerRoleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }

        if (user) {
            updateDrawerForRole(user);
            updateBottomTabsForRole(user);
        }

        if (user && user.role === 'student') navigateTo('studentDashboard');
        else if (user && user.role === 'parent') navigateTo('parentDashboard');
        else navigateTo('dashboard');
    } catch (err) {
        console.error('Error in showApp:', err);
    }
}

function updateDrawerForRole(user) {
    const nav = document.getElementById('drawerNav');
    if (!nav) return;

    if (user.role === 'student') {
        nav.innerHTML = `
            <div class="drawer-section">Student</div>
            <button class="drawer-item active" data-page="studentDashboard" onclick="navigateTo('studentDashboard')"><i class="fas fa-chart-pie"></i> Dashboard</button>
            <button class="drawer-item" data-page="studentProfile" onclick="navigateTo('studentProfile')"><i class="fas fa-user"></i> My Profile</button>
            <button class="drawer-item" data-page="myAssignments" onclick="navigateTo('myAssignments')"><i class="fas fa-tasks"></i> Assignments</button>
            <button class="drawer-item" data-page="myPerformance" onclick="navigateTo('myPerformance')"><i class="fas fa-chart-line"></i> Performance</button>
            <button class="drawer-item" data-page="myAttendance" onclick="navigateTo('myAttendance')"><i class="fas fa-calendar-check"></i> Attendance</button>
            <button class="drawer-item" data-page="timetable" onclick="navigateTo('timetable')"><i class="fas fa-clock"></i> Timetable</button>
            <button class="drawer-item" data-page="studentLibrary" onclick="navigateTo('studentLibrary')"><i class="fas fa-book"></i> Library</button>
            <button class="drawer-item" data-page="studentMessages" onclick="navigateTo('studentMessages')"><i class="fas fa-envelope"></i> Messages</button>
            <button class="drawer-item" data-page="announcements" onclick="navigateTo('announcements')"><i class="fas fa-bullhorn"></i> Announcements</button>`;
    } else if (user.role === 'parent') {
        nav.innerHTML = `
            <div class="drawer-section">Parent</div>
            <button class="drawer-item active" data-page="parentDashboard" onclick="navigateTo('parentDashboard')"><i class="fas fa-chart-pie"></i> Dashboard</button>
            <button class="drawer-item" data-page="parentProfile" onclick="navigateTo('parentProfile')"><i class="fas fa-user"></i> My Profile</button>
            <button class="drawer-item" data-page="parentFees" onclick="navigateTo('parentFees')"><i class="fas fa-money-bill-wave"></i> Fees & Payments</button>
            <button class="drawer-item" data-page="parentMessaging" onclick="navigateTo('parentMessaging')"><i class="fas fa-envelope"></i> Messages</button>
            <button class="drawer-item" data-page="parentReports" onclick="navigateTo('parentReports')"><i class="fas fa-download"></i> Reports</button>
            <button class="drawer-item" data-page="parentCalendar" onclick="navigateTo('parentCalendar')"><i class="fas fa-calendar"></i> Calendar</button>
            <button class="drawer-item" data-page="parentHealth" onclick="navigateTo('parentHealth')"><i class="fas fa-heartbeat"></i> Health</button>
            <button class="drawer-item" data-page="parentTransport" onclick="navigateTo('parentTransport')"><i class="fas fa-bus"></i> Transport</button>
            <button class="drawer-item" data-page="announcements" onclick="navigateTo('announcements')"><i class="fas fa-bullhorn"></i> Announcements</button>`;
    } else {
        nav.innerHTML = `
            <div class="drawer-section">Main</div>
            <button class="drawer-item active" data-page="dashboard" onclick="navigateTo('dashboard')"><i class="fas fa-chart-pie"></i> Dashboard</button>
            <div class="drawer-section">Management</div>
            <button class="drawer-item" data-page="students" onclick="navigateTo('students')"><i class="fas fa-user-graduate"></i> Students</button>
            <button class="drawer-item" data-page="teachers" onclick="navigateTo('teachers')"><i class="fas fa-chalkboard-teacher"></i> Teachers</button>
            <button class="drawer-item" data-page="classes" onclick="navigateTo('classes')"><i class="fas fa-school"></i> Classes</button>
            <div class="drawer-section">Academic</div>
            <button class="drawer-item" data-page="attendance" onclick="navigateTo('attendance')"><i class="fas fa-calendar-check"></i> Attendance</button>
            <button class="drawer-item" data-page="grades" onclick="navigateTo('grades')"><i class="fas fa-star"></i> Grades</button>
            <button class="drawer-item" data-page="timetable" onclick="navigateTo('timetable')"><i class="fas fa-clock"></i> Timetable</button>
            <button class="drawer-item" data-page="assignments" onclick="navigateTo('assignments')"><i class="fas fa-tasks"></i> Assignments</button>
            <div class="drawer-section">Administration</div>
            <button class="drawer-item" data-page="announcements" onclick="navigateTo('announcements')"><i class="fas fa-bullhorn"></i> Announcements</button>
            <button class="drawer-item" data-page="fees" onclick="navigateTo('fees')"><i class="fas fa-money-bill-wave"></i> Fees</button>
            <button class="drawer-item" data-page="library" onclick="navigateTo('library')"><i class="fas fa-book"></i> Library</button>
            <div class="drawer-section">System</div>
            <button class="drawer-item" data-page="users" onclick="navigateTo('users')"><i class="fas fa-users-cog"></i> Users</button>
            <button class="drawer-item" data-page="settings" onclick="navigateTo('settings')"><i class="fas fa-cog"></i> Settings</button>`;
    }
}

function updateBottomTabsForRole(user) {
    const tabs = document.getElementById('bottomTabs');
    if (!tabs) return;

    if (user.role === 'student') {
        tabs.innerHTML = `
            <button class="tab-item active" data-tab="studentDashboard" onclick="navigateTo('studentDashboard')"><i class="fas fa-home"></i><span>Home</span></button>
            <button class="tab-item" data-tab="myAssignments" onclick="navigateTo('myAssignments')"><i class="fas fa-tasks"></i><span>Tasks</span></button>
            <button class="tab-item" data-tab="myPerformance" onclick="navigateTo('myPerformance')"><i class="fas fa-chart-line"></i><span>Grades</span></button>
            <button class="tab-item" data-tab="studentMessages" onclick="navigateTo('studentMessages')"><i class="fas fa-envelope"></i><span>Messages</span></button>
            <button class="tab-item" data-tab="studentProfile" onclick="navigateTo('studentProfile')"><i class="fas fa-user"></i><span>Profile</span></button>`;
    } else if (user.role === 'parent') {
        tabs.innerHTML = `
            <button class="tab-item active" data-tab="parentDashboard" onclick="navigateTo('parentDashboard')"><i class="fas fa-home"></i><span>Home</span></button>
            <button class="tab-item" data-tab="parentFees" onclick="navigateTo('parentFees')"><i class="fas fa-money-bill-wave"></i><span>Fees</span></button>
            <button class="tab-item" data-tab="parentMessaging" onclick="navigateTo('parentMessaging')"><i class="fas fa-envelope"></i><span>Messages</span></button>
            <button class="tab-item" data-tab="parentCalendar" onclick="navigateTo('parentCalendar')"><i class="fas fa-calendar"></i><span>Events</span></button>
            <button class="tab-item" data-tab="parentProfile" onclick="navigateTo('parentProfile')"><i class="fas fa-user"></i><span>Profile</span></button>`;
    } else {
        tabs.innerHTML = `
            <button class="tab-item active" data-tab="dashboard" onclick="navigateTo('dashboard')"><i class="fas fa-home"></i><span>Home</span></button>
            <button class="tab-item" data-tab="students" onclick="navigateTo('students')"><i class="fas fa-user-graduate"></i><span>Students</span></button>
            <button class="tab-item" data-tab="attendance" onclick="navigateTo('attendance')"><i class="fas fa-calendar-check"></i><span>Attendance</span></button>
            <button class="tab-item" data-tab="grades" onclick="navigateTo('grades')"><i class="fas fa-star"></i><span>Grades</span></button>
            <button class="tab-item" data-tab="settings" onclick="navigateTo('settings')"><i class="fas fa-cog"></i><span>Settings</span></button>`;
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}