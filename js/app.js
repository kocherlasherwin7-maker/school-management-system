/**
 * Main Application Controller
 * Handles navigation, modals, toasts, user management, and settings
 */

// ========== Navigation ==========
const pageRoutes = {
    // Admin/Teacher pages
    'dashboard': { title: 'Dashboard', breadcrumb: 'Home / Dashboard', render: renderDashboard },
    'students': { title: 'Students', breadcrumb: 'Management / Students', render: renderStudents },
    'teachers': { title: 'Teachers', breadcrumb: 'Management / Teachers', render: renderTeachers },
    'classes': { title: 'Classes', breadcrumb: 'Management / Classes', render: renderClasses },
    'attendance': { title: 'Attendance', breadcrumb: 'Academic / Attendance', render: renderAttendance },
    'grades': { title: 'Grades', breadcrumb: 'Academic / Grades', render: renderGrades },
    'timetable': { title: 'Timetable', breadcrumb: 'Academic / Timetable', render: renderTimetable },
    'assignments': { title: 'Assignments', breadcrumb: 'Academic / Assignments', render: renderAssignments },
    'announcements': { title: 'Announcements', breadcrumb: 'Administration / Announcements', render: renderAnnouncements },
    'fees': { title: 'Fee Management', breadcrumb: 'Administration / Fees', render: renderFees },
    'library': { title: 'Library', breadcrumb: 'Administration / Library', render: renderLibrary },
    'users': { title: 'User Management', breadcrumb: 'System / Users', render: renderUsers },
    'settings': { title: 'Settings', breadcrumb: 'System / Settings', render: renderSettings },
    // Student Portal pages
    'studentDashboard': { title: 'Student Dashboard', breadcrumb: 'Student / Dashboard', render: renderStudentDashboard },
    'studentProfile': { title: 'My Profile', breadcrumb: 'Student / Profile', render: renderStudentProfile },
    'myAssignments': { title: 'My Assignments', breadcrumb: 'Student / Assignments', render: renderMyAssignments },
    'myPerformance': { title: 'My Performance', breadcrumb: 'Student / Performance', render: renderMyPerformance },
    'myAttendance': { title: 'My Attendance', breadcrumb: 'Student / Attendance', render: renderMyAttendance },
    'studentMessages': { title: 'Messages', breadcrumb: 'Student / Messages', render: renderStudentMessaging },
    'studentLibrary': { title: 'Library', breadcrumb: 'Student / Library', render: renderStudentLibrary },
    // Parent Portal pages
    'parentDashboard': { title: 'Parent Dashboard', breadcrumb: 'Parent / Dashboard', render: renderParentDashboard },
    'parentProfile': { title: 'My Profile', breadcrumb: 'Parent / Profile', render: renderParentProfile },
    'parentFees': { title: 'Fee Management', breadcrumb: 'Parent / Fees', render: renderParentFees },
    'parentMessaging': { title: 'Messages', breadcrumb: 'Parent / Messages', render: renderParentMessaging },
    'parentCalendar': { title: 'School Calendar', breadcrumb: 'Parent / Calendar', render: renderParentCalendar },
    'parentHealth': { title: 'Health Records', breadcrumb: 'Parent / Health', render: renderParentHealth },
    'parentTransport': { title: 'Transport', breadcrumb: 'Parent / Transport', render: renderParentTransport },
    'parentReports': { title: 'Download Reports', breadcrumb: 'Parent / Reports', render: renderParentReports }
};

function navigateTo(page) {
    if (!security.validateSession()) {
        handleLogout();
        return;
    }

    const route = pageRoutes[page];
    if (!route) {
        navigateTo('dashboard');
        return;
    }

    // Check permission
    if (!security.hasPermission('read', page) && page !== 'dashboard') {
        showToast('You do not have permission to access this page', 'error');
        return;
    }

    // Update UI
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = route.title;
    
    const breadcrumbEl = document.getElementById('pageBreadcrumb');
    if (breadcrumbEl) breadcrumbEl.textContent = route.breadcrumb;

    // Update navigation active state (only if nav-items exist)
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    // Render page
    route.render();
}

// Sidebar navigation
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                if (page) navigateTo(page);
                
                // Close mobile sidebar
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
        });
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Global search
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim().toLowerCase();
                if (!query) return;

                // Search across students and teachers
                const students = db.query('students', s => 
                    s.firstName.toLowerCase().includes(query) || 
                    s.lastName.toLowerCase().includes(query) ||
                    s.email.toLowerCase().includes(query)
                );
                
                if (students.length > 0) {
                    navigateTo('students');
                    setTimeout(() => {
                        const searchField = document.getElementById('searchStudents');
                        if (searchField) {
                            searchField.value = query;
                            if (typeof filterStudents === 'function') filterStudents();
                        }
                    }, 100);
                } else {
                    showToast('No results found for "' + query + '"', 'info');
                }
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalContainer');
            if (modal && modal.style.display === 'flex') closeModal();
        }
    });
});

// ========== Modal System ==========
function openModal(title, content, modalClass = '') {
    const modal = document.getElementById('modalContainer');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.className = 'modal-overlay';
    if (modalClass) modal.classList.add(modalClass);
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalContainer').style.display = 'none';
    document.getElementById('modalBody').innerHTML = '';
}

// Close modal on overlay click
document.getElementById('modalContainer').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ========== Toast Notification System ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${sanitize(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ========== User Management Page ==========
function renderUsers() {
    const users = db.getAll('users');

    const content = `
        <div class="toolbar">
            <div class="toolbar-right">
                ${security.hasPermission('write', 'users') ? `
                <button class="btn btn-primary" onclick="showAddUserModal()">
                    <i class="fas fa-plus"></i> Add User
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-users-cog"></i> System Users</h2><span class="badge badge-primary">${users.length} Users</span></div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                            <tr>
                                <td><strong>${sanitize(u.name)}</strong></td>
                                <td>${sanitize(u.email)}</td>
                                <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'teacher' ? 'badge-primary' : 'badge-success'}">${sanitize(u.role)}</span></td>
                                <td>${sanitize(u.phone || 'N/A')}</td>
                                <td><span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${sanitize(u.status)}</span></td>
                                <td>
                                    <div style="display:flex;gap:4px;">
                                        ${security.hasPermission('write', 'users') ? `
                                        <button class="btn btn-sm btn-primary" onclick="showEditUserModal('${u.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                                        ${u.id !== security.currentUser?.id ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}` : ''}
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function showAddUserModal() {
    openModal('Add New User', `
        <form id="userForm" onsubmit="saveUser(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="userName" required>
                </div>
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" class="form-control" id="userEmail" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Password <span class="required">*</span></label>
                    <input type="password" class="form-control" id="userPassword" required minlength="6">
                </div>
                <div class="form-group">
                    <label>Role <span class="required">*</span></label>
                    <select class="form-control" id="userRole" required>
                        <option value="">Select Role</option>
                        <option value="admin">Administrator</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" class="form-control" id="userPhone">
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea class="form-control" id="userAddress" rows="2"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add User</button>
            </div>
        </form>
    `);
}

function showEditUserModal(id) {
    const user = db.getById('users', id);
    if (!user) return;

    openModal('Edit User', `
        <form id="userForm" onsubmit="updateUser(event, '${id}')">
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="userName" value="${sanitize(user.name)}" required>
                </div>
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" class="form-control" id="userEmail" value="${sanitize(user.email)}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>New Password (leave blank to keep current)</label>
                    <input type="password" class="form-control" id="userPassword" minlength="6">
                </div>
                <div class="form-group">
                    <label>Role <span class="required">*</span></label>
                    <select class="form-control" id="userRole" required>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                        <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Teacher</option>
                        <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                        <option value="parent" ${user.role === 'parent' ? 'selected' : ''}>Parent</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" class="form-control" id="userPhone" value="${sanitize(user.phone || '')}">
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea class="form-control" id="userAddress" rows="2">${sanitize(user.address || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="userStatus">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update User</button>
            </div>
        </form>
    `);
}

function saveUser(e) {
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const phone = document.getElementById('userPhone').value.trim();
    const address = document.getElementById('userAddress').value.trim();

    if (!name || name.length < 2) { showToast('Name must be at least 2 characters', 'error'); return; }
    if (!Validator.isEmail(email)) { showToast('Valid email is required', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

    const existingUsers = db.getAll('users');
    if (existingUsers.find(u => u.email === email)) {
        showToast('Email already exists', 'error');
        return;
    }

    const sanitized = security.sanitizeObject({
        name, email, password: db.hashPassword(password), role, phone, address, status: 'active'
    });

    db.add('users', sanitized);
    closeModal();
    renderUsers();
    showToast('User added successfully!', 'success');
}

function updateUser(e, id) {
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const phone = document.getElementById('userPhone').value.trim();
    const address = document.getElementById('userAddress').value.trim();
    const status = document.getElementById('userStatus').value;

    const updates = { name, email, role, phone, address, status };
    if (password) updates.password = db.hashPassword(password);

    db.update('users', id, security.sanitizeObject(updates));
    closeModal();
    renderUsers();
    showToast('User updated successfully!', 'success');
}

function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    db.delete('users', id);
    renderUsers();
    showToast('User deleted', 'success');
}

// ========== Settings Page ==========
function renderSettings() {
    const content = `
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-cog"></i> System Settings</h2></div>
            <div class="card-body">
                <form id="settingsForm" onsubmit="saveSettings(event)">
                    <div class="settings-section">
                        <h3>School Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>School Name</label>
                                <input type="text" class="form-control" id="schoolName" value="EduManage Pro School">
                            </div>
                            <div class="form-group">
                                <label>School Email</label>
                                <input type="email" class="form-control" id="schoolEmail" value="admin@edumanage.edu">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="text" class="form-control" id="schoolPhone" value="+1-555-0000">
                            </div>
                            <div class="form-group">
                                <label>Address</label>
                                <input type="text" class="form-control" id="schoolAddress" value="123 Education Street, Learning City">
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>Academic Settings</h3>
                        <div class="form-row-3">
                            <div class="form-group">
                                <label>Current Term</label>
                                <select class="form-control" id="currentTerm">
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3">Term 3</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Academic Year</label>
                                <input type="number" class="form-control" id="academicYear" value="${new Date().getFullYear()}">
                            </div>
                            <div class="form-group">
                                <label>Max Students per Class</label>
                                <input type="number" class="form-control" id="maxStudentsPerClass" value="30">
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>Security Settings</h3>
                        <div class="form-row-3">
                            <div class="form-group">
                                <label>Session Timeout (hours)</label>
                                <input type="number" class="form-control" id="sessionTimeout" value="24" min="1" max="72">
                            </div>
                            <div class="form-group">
                                <label>Max Login Attempts</label>
                                <input type="number" class="form-control" id="maxLoginAttempts" value="5" min="1" max="20">
                            </div>
                            <div class="form-group">
                                <label>Password Min Length</label>
                                <input type="number" class="form-control" id="passwordMinLength" value="6" min="4" max="32">
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>Notification Preferences</h3>
                        <div style="display:flex;flex-direction:column;gap:12px;">
                            <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="emailNotifications" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                                Enable Email Notifications
                            </label>
                            <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="autoAttendanceReminder" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                                Auto Attendance Reminders
                            </label>
                            <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="feeDueReminders" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                                Fee Due Reminders
                            </label>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="resetSettings()">Reset to Default</button>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Settings</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="card mt-4">
            <div class="card-header"><h2><i class="fas fa-database"></i> Data Management</h2></div>
            <div class="card-body">
                <p style="color:var(--gray-500);margin-bottom:16px;">Manage system data and backups</p>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="btn btn-secondary" onclick="exportData()"><i class="fas fa-download"></i> Export Data</button>
                    <button class="btn btn-warning" onclick="resetAllData()"><i class="fas fa-trash-alt"></i> Reset All Data</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function saveSettings(e) {
    e.preventDefault();
    const settings = {
        schoolName: document.getElementById('schoolName').value,
        schoolEmail: document.getElementById('schoolEmail').value,
        schoolPhone: document.getElementById('schoolPhone').value,
        schoolAddress: document.getElementById('schoolAddress').value,
        currentTerm: document.getElementById('currentTerm').value,
        academicYear: document.getElementById('academicYear').value,
        maxStudentsPerClass: document.getElementById('maxStudentsPerClass').value,
        sessionTimeout: document.getElementById('sessionTimeout').value,
        maxLoginAttempts: document.getElementById('maxLoginAttempts').value,
        passwordMinLength: document.getElementById('passwordMinLength').value,
        emailNotifications: document.getElementById('emailNotifications').checked,
        autoAttendanceReminder: document.getElementById('autoAttendanceReminder').checked,
        feeDueReminders: document.getElementById('feeDueReminders').checked
    };

    storage.set('settings', security.sanitizeObject(settings));
    showToast('Settings saved successfully!', 'success');
}

function resetSettings() {
    if (!confirm('Reset all settings to default?')) return;
    document.getElementById('settingsForm').reset();
    document.getElementById('emailNotifications').checked = true;
    document.getElementById('autoAttendanceReminder').checked = true;
    document.getElementById('feeDueReminders').checked = true;
    showToast('Settings have been reset', 'info');
}

function exportData() {
    const allData = storage.getAll();
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edumanage_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
}

function resetAllData() {
    if (!confirm('WARNING: This will permanently delete ALL data. Are you absolutely sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;
    
    storage.clear();
    showToast('All data has been reset. Refreshing...', 'info');
    setTimeout(() => location.reload(), 1500);
}