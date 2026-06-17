/**
 * Dashboard Module
 * Displays analytics, statistics, charts, and recent activity
 */

function renderDashboard() {
    const students = db.getAll('students');
    const teachers = db.getAll('teachers');
    const classes = db.getAll('classes');
    const attendance = db.getAll('attendance');
    const fees = db.getAll('fees');
    const assignments = db.getAll('assignments');
    const announcements = db.getAll('announcements').sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const totalClasses = classes.length;
    const presentToday = attendance.filter(a => a.status === 'present').length;
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const collectedFees = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.paidAmount, 0);
    const activeAssignments = assignments.filter(a => a.status === 'active').length;
    const activeAnnouncements = announcements.length;

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    const attendanceRate = todayAttendance.length > 0 
        ? Math.round((todayAttendance.filter(a => a.status === 'present').length / todayAttendance.length) * 100) 
        : 0;

    const content = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-user-graduate"></i></div>
                <div class="stat-info">
                    <h3>${totalStudents}</h3>
                    <p>Total Students</p>
                    <span class="stat-change up"><i class="fas fa-arrow-up"></i> ${Math.max(0, totalStudents - 4)} new this year</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-chalkboard-teacher"></i></div>
                <div class="stat-info">
                    <h3>${totalTeachers}</h3>
                    <p>Total Teachers</p>
                    <span class="stat-change up"><i class="fas fa-arrow-up"></i> ${totalTeachers > 2 ? '+' + (totalTeachers - 2) : '0'} this year</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-school"></i></div>
                <div class="stat-info">
                    <h3>${totalClasses}</h3>
                    <p>Total Classes</p>
                    <span class="stat-change up"><i class="fas fa-arrow-up"></i> Active this term</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-info">
                    <h3>${attendanceRate}%</h3>
                    <p>Today's Attendance</p>
                    <span class="stat-change ${attendanceRate >= 75 ? 'up' : 'down'}">
                        <i class="fas fa-${attendanceRate >= 75 ? 'arrow-up' : 'arrow-down'}"></i> 
                        ${presentToday} students present
                    </span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-info">
                    <h3>$${collectedFees.toLocaleString()}</h3>
                    <p>Fees Collected</p>
                    <span class="stat-change up"><i class="fas fa-arrow-up"></i> $${(collectedFees - 5000).toLocaleString()} target</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon cyan"><i class="fas fa-tasks"></i></div>
                <div class="stat-info">
                    <h3>${activeAssignments}</h3>
                    <p>Active Assignments</p>
                    <span class="stat-change up"><i class="fas fa-arrow-up"></i> Due this week</span>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fas fa-bullhorn"></i> Recent Announcements</h2>
                <button class="btn btn-sm btn-primary" onclick="navigateTo('announcements')">
                    <i class="fas fa-plus"></i> View All
                </button>
            </div>
            <div class="card-body">
                ${announcements.length > 0 ? `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Priority</th>
                                <th>Date</th>
                                <th>Author</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${announcements.slice(0, 5).map(a => `
                            <tr>
                                <td><strong>${sanitize(a.title)}</strong></td>
                                <td><span class="badge badge-info">${sanitize(a.category)}</span></td>
                                <td><span class="badge ${a.priority === 'high' ? 'badge-danger' : a.priority === 'normal' ? 'badge-warning' : 'badge-secondary'}">${sanitize(a.priority)}</span></td>
                                <td>${a.date}</td>
                                <td>${sanitize(a.author)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `<div class="empty-state"><i class="fas fa-bullhorn"></i><h3>No announcements yet</h3><p>Create your first announcement</p></div>`}
            </div>
        </div>

        <div class="two-col-grid">
            <div class="card">
                <div class="card-header">
                    <h2><i class="fas fa-star"></i> Recent Grades</h2>
                    <button class="btn btn-sm btn-primary" onclick="navigateTo('grades')">
                        <i class="fas fa-plus"></i> Manage
                    </button>
                </div>
                <div class="card-body">
                    ${renderRecentGrades()}
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h2><i class="fas fa-clock"></i> Today's Timetable</h2>
                    <button class="btn btn-sm btn-primary" onclick="navigateTo('timetable')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
                <div class="card-body">
                    ${renderTodayTimetable()}
                </div>
            </div>
        </div>

        <div class="card mt-4">
            <div class="card-header">
                <h2><i class="fas fa-money-bill-wave"></i> Fee Collection Summary</h2>
                <button class="btn btn-sm btn-primary" onclick="navigateTo('fees')">
                    <i class="fas fa-plus"></i> Manage Fees
                </button>
            </div>
            <div class="card-body">
                <div class="fee-summary">
                    <div class="fee-card total">
                        <div class="fee-amount">$${totalFees.toLocaleString()}</div>
                        <div class="fee-label">Total Fees</div>
                    </div>
                    <div class="fee-card paid">
                        <div class="fee-amount">$${collectedFees.toLocaleString()}</div>
                        <div class="fee-label">Collected</div>
                    </div>
                    <div class="fee-card pending">
                        <div class="fee-amount">$${(totalFees - collectedFees).toLocaleString()}</div>
                        <div class="fee-label">Pending</div>
                    </div>
                    <div class="fee-card overdue">
                        <div class="fee-amount">${fees.filter(f => f.status === 'overdue').length}</div>
                        <div class="fee-label">Overdue Accounts</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderRecentGrades() {
    const grades = db.getAll('grades');
    const students = db.getAll('students');
    
    if (grades.length === 0) {
        return `<div class="empty-state"><i class="fas fa-star"></i><h3>No grades recorded yet</h3></div>`;
    }

    const recentGrades = grades.slice(0, 6);
    return `
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Grade</th>
                </tr>
            </thead>
            <tbody>
                ${recentGrades.map(g => {
                    const student = students.find(s => s.id === g.studentId);
                    return `
                    <tr>
                        <td>${sanitize(student ? student.firstName + ' ' + student.lastName : 'Unknown')}</td>
                        <td>${sanitize(g.subject)}</td>
                        <td>${g.score}/${g.totalMarks}</td>
                        <td><span class="badge ${g.grade.startsWith('A') ? 'badge-success' : g.grade.startsWith('B') ? 'badge-primary' : g.grade.startsWith('C') ? 'badge-warning' : 'badge-danger'}">${sanitize(g.grade)}</span></td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}

function renderTodayTimetable() {
    const user = security.currentUser;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    // Get class ID based on user role
    let classId = '';
    if (user && user.role === 'student') {
        const student = db.getAll('students').find(s => s.email === user.email);
        if (student) classId = student.classId;
    } else if (user && user.role === 'parent') {
        const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
        if (children.length > 0) classId = children[0].classId;
    } else {
        const classes = db.getAll('classes');
        if (classes.length > 0) classId = classes[0].id;
    }

    if (!classId) {
        return `<div class="empty-state"><i class="fas fa-clock"></i><h3>No class assigned</h3></div>`;
    }

    const timetable = db.query('timetable', t => t.classId === classId);
    const teachers = db.getAll('teachers');

    if (timetable.length === 0) {
        return `<div class="empty-state"><i class="fas fa-clock"></i><h3>No classes scheduled</h3></div>`;
    }

    // Use the mini transposed timetable
    return `<div style="overflow-x:auto;">${renderMiniTimetable(timetable, teachers, todayName)}</div>`;
}
