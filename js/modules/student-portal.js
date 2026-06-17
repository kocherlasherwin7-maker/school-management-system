/**
 * Student Portal Module
 * Student dashboard, profile, assignments, performance, timetable, library, attendance, messaging
 */

function renderStudentDashboard() {
    const user = security.currentUser;
    if (!user) return;
    
    const student = db.getAll('students').find(s => s.email === user.email);
    const classes = db.getAll('classes');
    const cls = student ? classes.find(c => c.id === student.classId) : null;
    const grades = student ? db.query('grades', g => g.studentId === student.id) : [];
    const attendance = student ? db.query('attendance', a => a.studentId === student.id) : [];
    const assignments = student ? db.query('assignments', a => a.classId === (cls ? cls.id : '')) : [];
    const announcements = db.getAll('announcements').sort((a, b) => new Date(b.date) - new Date(a.date));
    const timetable = student && cls ? db.query('timetable', t => t.classId === cls.id) : [];
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayName = days[new Date().getDay()];
    const avgGrade = grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / grades.length) : 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
    const activeAssignments = assignments.filter(a => a.status === 'active');
    const dueSoon = activeAssignments.filter(a => {
        const due = new Date(a.dueDate);
        const diffDays = Math.ceil((due - new Date()) / (1000*60*60*24));
        return diffDays >= 0 && diffDays <= 7;
    });

    const content = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="font-size:24px;">Welcome, ${sanitize(student ? student.firstName : user.name)}!</h2>
                <p style="color:var(--gray-500);">${sanitize(cls ? cls.name : 'Not Assigned')} · Student Dashboard</p>
            </div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-primary" onclick="navigateTo('studentProfile')"><i class="fas fa-user"></i> My Profile</button>
                <button class="btn btn-secondary" onclick="navigateTo('myPerformance')"><i class="fas fa-chart-line"></i> Performance</button>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-star"></i></div>
                <div class="stat-info">
                    <h3>${avgGrade}%</h3><p>Average Grade</p>
                    <span class="stat-change ${avgGrade >= 60 ? 'up' : 'down'}"><i class="fas fa-${avgGrade >= 60 ? 'arrow-up' : 'arrow-down'}"></i> ${avgGrade >= 80 ? 'Excellent' : avgGrade >= 60 ? 'Good' : 'Needs Improvement'}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-info">
                    <h3>${attendanceRate}%</h3><p>Attendance Rate</p>
                    <span class="stat-change ${attendanceRate >= 75 ? 'up' : 'down'}"><i class="fas fa-${attendanceRate >= 75 ? 'arrow-up' : 'arrow-down'}"></i> ${presentCount} days present</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-tasks"></i></div>
                <div class="stat-info">
                    <h3>${activeAssignments.length}</h3><p>Active Assignments</p>
                    <span class="stat-change up"><i class="fas fa-clock"></i> ${dueSoon.length} due this week</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-bullhorn"></i></div>
                <div class="stat-info">
                    <h3>${announcements.length}</h3><p>Announcements</p>
                    <span class="stat-change up"><i class="fas fa-arrow-up"></i> Latest: ${announcements.length > 0 ? sanitize(announcements[0].title.substring(0,25)) : 'None'}</span>
                </div>
            </div>
        </div>
        <div class="two-col-grid">
            <div class="card">
                <div class="card-header"><h2><i class="fas fa-clock"></i> Weekly Timetable</h2><button class="btn btn-sm btn-primary" onclick="navigateTo('timetable')">View Full</button></div>
                <div class="card-body" style="overflow-x:auto;">
                    ${timetable.length > 0 ? renderMiniTimetable(timetable, db.getAll('teachers'), todayName) : `<div class="empty-state"><i class="fas fa-clock"></i><h3>No classes scheduled</h3></div>`}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h2><i class="fas fa-tasks"></i> Upcoming Assignments</h2><button class="btn btn-sm btn-primary" onclick="navigateTo('myAssignments')">View All</button></div>
                <div class="card-body">
                    ${dueSoon.length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px;">${dueSoon.slice(0,5).map(a => {const due = new Date(a.dueDate); const diffDays = Math.ceil((due - new Date()) / (1000*60*60*24)); const daysText = diffDays === 0 ? 'Due Today!' : diffDays === 1 ? 'Due Tomorrow' : diffDays + ' days left'; return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--gray-50);border-radius:var(--radius-sm);border-left:4px solid ${diffDays <= 1 ? 'var(--danger)' : diffDays <= 3 ? 'var(--warning)' : 'var(--success)'};"><div><strong style="font-size:14px;">${sanitize(a.title)}</strong><p style="font-size:12px;color:var(--gray-500);">${sanitize(a.subject)}</p></div><span class="badge ${diffDays <= 1 ? 'badge-danger' : diffDays <= 3 ? 'badge-warning' : 'badge-success'}">${daysText}</span></div>`;}).join('')}</div>` : `<div class="empty-state"><i class="fas fa-tasks"></i><h3>No pending assignments</h3></div>`}
                </div>
            </div>
        </div>
        <div class="two-col-grid" style="margin-top:20px;">
            <div class="card">
                <div class="card-header"><h2><i class="fas fa-star"></i> Recent Grades</h2><button class="btn btn-sm btn-primary" onclick="navigateTo('myPerformance')">View All</button></div>
                <div class="card-body">
                    ${grades.length > 0 ? `<div class="table-container"><table><thead><tr><th>Subject</th><th>Exam</th><th>Score</th><th>Grade</th></tr></thead><tbody>${grades.slice(0,5).map(g => `<tr><td>${sanitize(g.subject)}</td><td>${sanitize(g.examType)}</td><td>${g.score}/${g.totalMarks}</td><td><span class="badge ${g.grade.startsWith('A') ? 'badge-success' : g.grade.startsWith('B') ? 'badge-primary' : g.grade.startsWith('C') ? 'badge-warning' : 'badge-danger'}">${sanitize(g.grade)}</span></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><i class="fas fa-star"></i><h3>No grades yet</h3></div>`}
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h2><i class="fas fa-bullhorn"></i> Latest Announcements</h2><button class="btn btn-sm btn-primary" onclick="navigateTo('announcements')">View All</button></div>
                <div class="card-body">${announcements.length > 0 ? announcements.slice(0,4).map(a => `<div style="padding:10px 0;border-bottom:1px solid var(--gray-100);"><div style="display:flex;justify-content:space-between;align-items:start;"><strong style="font-size:14px;">${sanitize(a.title)}</strong><span class="badge ${a.priority === 'high' ? 'badge-danger' : 'badge-warning'}" style="font-size:10px;">${sanitize(a.priority)}</span></div><p style="font-size:12px;color:var(--gray-500);margin-top:4px;">${sanitize(a.date)} · ${sanitize(a.category)}</p></div>`).join('') : `<div class="empty-state"><i class="fas fa-bullhorn"></i><h3>No announcements</h3></div>`}</div>
            </div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function renderStudentProfile() {
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    const cls = student ? db.getById('classes', student.classId) : null;
    if (!student) { document.getElementById('pageContent').innerHTML = `<div class="empty-state"><i class="fas fa-user"></i><h3>Student profile not found</h3></div>`; return; }

    const content = `
        <div style="margin-bottom:20px;">
            <button class="btn btn-secondary" onclick="navigateTo('studentDashboard')"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
            <button class="btn btn-primary" style="margin-left:8px;" onclick="showEditMyProfileModal()"><i class="fas fa-edit"></i> Edit Profile</button>
        </div>
        <div class="two-col-grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);">
            <div class="card">
                <div class="card-body" style="text-align:center;">
                    <div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:40px;color:white;margin:0 auto 16px;font-weight:700;">${student.firstName.charAt(0)}${student.lastName.charAt(0)}</div>
                    <h3>${sanitize(student.firstName + ' ' + student.lastName)}</h3>
                    <p style="color:var(--gray-500);font-size:13px;">${sanitize(student.email)}</p>
                    <span class="badge badge-success" style="margin-top:8px;">${sanitize(student.status)}</span>
                    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--gray-200);">
                        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:var(--gray-500);">Class</span><span><strong>${sanitize(cls ? cls.name : 'N/A')}</strong></span></div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:var(--gray-500);">Enrolled</span><span><strong>${student.enrollmentDate}</strong></span></div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:var(--gray-500);">Gender</span><span><strong>${sanitize(student.gender)}</strong></span></div>
                    </div>
                </div>
            </div>
            <div>
                <div class="card">
                    <div class="card-header"><h2><i class="fas fa-info-circle"></i> Personal Information</h2></div>
                    <div class="card-body"><div class="table-container"><table>
                        <tr><td style="font-weight:600;width:150px;">Full Name</td><td>${sanitize(student.firstName + ' ' + student.lastName)}</td></tr>
                        <tr><td style="font-weight:600;">Email</td><td>${sanitize(student.email)}</td></tr>
                        <tr><td style="font-weight:600;">Phone</td><td>${sanitize(student.phone || 'Not provided')}</td></tr>
                        <tr><td style="font-weight:600;">Date of Birth</td><td>${student.dateOfBirth}</td></tr>
                        <tr><td style="font-weight:600;">Gender</td><td>${sanitize(student.gender)}</td></tr>
                        <tr><td style="font-weight:600;">Blood Group</td><td>${student.bloodGroup || 'N/A'}</td></tr>
                        <tr><td style="font-weight:600;">Address</td><td>${sanitize(student.address || 'Not provided')}</td></tr>
                        <tr><td style="font-weight:600;">Enrollment Date</td><td>${student.enrollmentDate}</td></tr>
                    </table></div></div>
                </div>
                <div class="card" style="margin-top:20px;">
                    <div class="card-header"><h2><i class="fas fa-users"></i> Parent / Guardian Information</h2></div>
                    <div class="card-body"><div class="table-container"><table>
                        <tr><td style="font-weight:600;width:150px;">Parent Name</td><td>${sanitize(student.parentName || 'N/A')}</td></tr>
                        <tr><td style="font-weight:600;">Parent Phone</td><td>${sanitize(student.parentPhone || 'N/A')}</td></tr>
                        <tr><td style="font-weight:600;">Parent Email</td><td>${sanitize(student.parentEmail || 'N/A')}</td></tr>
                    </table></div></div>
                </div>
            </div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function showEditMyProfileModal() {
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    if (!student) return;
    openModal('Edit My Profile', `
        <form id="studentProfileForm" onsubmit="updateMyProfile(event)">
            <div class="form-row">
                <div class="form-group"><label>First Name</label><input type="text" class="form-control" id="myFirstName" value="${sanitize(student.firstName)}" required></div>
                <div class="form-group"><label>Last Name</label><input type="text" class="form-control" id="myLastName" value="${sanitize(student.lastName)}" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Phone</label><input type="text" class="form-control" id="myPhone" value="${sanitize(student.phone || '')}"></div>
                <div class="form-group"><label>Date of Birth</label><input type="date" class="form-control" value="${student.dateOfBirth}" disabled style="background:var(--gray-100);"></div>
            </div>
            <div class="form-group"><label>Address</label><textarea class="form-control" id="myAddress" rows="2">${sanitize(student.address || '')}</textarea></div>
            <h4 style="margin:16px 0 12px;color:var(--primary);">Change Password</h4>
            <div class="form-row">
                <div class="form-group"><label>Current Password</label><input type="password" class="form-control" id="myCurrentPwd"></div>
                <div class="form-group"><label>New Password</label><input type="password" class="form-control" id="myNewPwd" minlength="6"></div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update</button>
            </div>
        </form>`, 'modal-large');
}

function updateMyProfile(e) {
    e.preventDefault();
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    if (!student) return;
    const updates = {
        firstName: document.getElementById('myFirstName').value.trim(),
        lastName: document.getElementById('myLastName').value.trim(),
        phone: document.getElementById('myPhone').value.trim(),
        address: document.getElementById('myAddress').value.trim()
    };
    const currentPwd = document.getElementById('myCurrentPwd').value;
    const newPwd = document.getElementById('myNewPwd').value;
    if (currentPwd && newPwd) {
        const users = db.getAll('users');
        const userRecord = users.find(u => u.email === user.email);
        if (userRecord && userRecord.password === db.hashPassword(currentPwd)) {
            db.update('users', userRecord.id, { password: db.hashPassword(newPwd) });
            showToast('Password changed successfully!', 'success');
        } else if (currentPwd) { showToast('Current password is incorrect', 'error'); return; }
    }
    db.update('students', student.id, security.sanitizeObject(updates));
    closeModal();
    renderStudentProfile();
    showToast('Profile updated successfully!', 'success');
}

function renderMyAssignments() {
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    const cls = student ? db.getById('classes', student.classId) : null;
    const assignments = student && cls ? db.query('assignments', a => a.classId === cls.id) : [];
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('studentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-tasks"></i> My Assignments</h2><span class="badge badge-primary">${assignments.length} Total</span></div>
            <div class="card-body">
                ${assignments.length > 0 ? `<div style="display:flex;flex-direction:column;gap:12px;">${assignments.map(a => {
                    const due = new Date(a.dueDate);
                    const diffDays = Math.ceil((due - new Date()) / (1000*60*60*24));
                    const daysText = diffDays < 0 ? 'Overdue!' : diffDays === 0 ? 'Due Today!' : diffDays === 1 ? 'Tomorrow' : diffDays + ' days left';
                    const submitted = a.submissions && a.submissions.some(s => s.studentId === student.id);
                    return `<div style="border:1px solid var(--gray-200);border-radius:var(--radius-sm);padding:16px;"><div style="display:flex;justify-content:space-between;align-items:start;"><div><h4 style="font-size:16px;margin-bottom:4px;">${sanitize(a.title)}</h4><p style="font-size:13px;color:var(--gray-500);margin-bottom:8px;">${sanitize(a.subject)}</p><p style="font-size:13px;">${sanitize(a.description)}</p><div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:var(--gray-500);"><span><i class="fas fa-calendar"></i> Due: ${a.dueDate}</span><span><i class="fas fa-star"></i> Max: ${a.maxScore || 100}</span></div></div><div style="text-align:right;"><span class="badge ${diffDays < 0 ? 'badge-danger' : diffDays <= 1 ? 'badge-warning' : 'badge-success'}">${daysText}</span>${submitted ? `<span class="badge badge-info" style="display:block;margin-top:4px;">Submitted</span>` : `<button class="btn btn-sm btn-primary" style="margin-top:8px;" onclick="showSubmitAssignmentModal('${a.id}')"><i class="fas fa-upload"></i> Submit</button>`}</div></div></div>`;
                }).join('')}</div>` : `<div class="empty-state"><i class="fas fa-tasks"></i><h3>No assignments yet</h3></div>`}
            </div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function showSubmitAssignmentModal(assignmentId) {
    const assignment = db.getById('assignments', assignmentId);
    if (!assignment) return;
    openModal('Submit Assignment: ' + sanitize(assignment.title), `
        <form id="submitAssignmentForm" onsubmit="submitAssignment(event, '${assignmentId}')">
            <div class="form-group"><label>Cover Note</label><textarea class="form-control" id="submitNote" rows="3" placeholder="Add a note to your teacher..."></textarea></div>
            <div class="form-group"><label>Submission File URL <span class="required">*</span></label><input type="url" class="form-control" id="submitFileUrl" placeholder="https://example.com/my-assignment.pdf" required><p style="font-size:12px;color:var(--gray-500);margin-top:4px;">Upload your file to Google Drive/Dropbox and paste the share link here</p></div>
            <div class="form-group"><label>File Name</label><input type="text" class="form-control" id="submitFileName" placeholder="e.g. algebra_homework.pdf"></div>
            <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-upload"></i> Submit</button></div>
        </form>`);
}

function submitAssignment(e, assignmentId) {
    e.preventDefault();
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    if (!student) return;
    const submission = { studentId: student.id, studentName: student.firstName + ' ' + student.lastName, note: document.getElementById('submitNote').value.trim(), fileUrl: document.getElementById('submitFileUrl').value.trim(), fileName: document.getElementById('submitFileName').value.trim() || 'assignment_file', submittedAt: new Date().toISOString(), status: 'submitted' };
    const assignment = db.getById('assignments', assignmentId);
    if (assignment) { const submissions = assignment.submissions || []; submissions.push(submission); db.update('assignments', assignmentId, { submissions }); }
    closeModal(); renderMyAssignments(); showToast('Assignment submitted successfully!', 'success');
}

function renderMyPerformance() {
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    if (!student) return;
    const grades = db.query('grades', g => g.studentId === student.id);
    const subjects = [...new Set(grades.map(g => g.subject))];
    const subjectPerformance = subjects.map(subject => {
        const subGrades = grades.filter(g => g.subject === subject);
        const avg = subGrades.length > 0 ? Math.round(subGrades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / subGrades.length) : 0;
        const best = subGrades.length > 0 ? Math.round(Math.max(...subGrades.map(g => g.score/g.totalMarks*100))) : 0;
        return { subject, avg, best, count: subGrades.length };
    }).sort((a,b) => b.avg - a.avg);
    const overallAvg = grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / grades.length) : 0;
    const classStudentIds = db.getAll('students').filter(s => s.classId === student.classId).map(s => s.id);
    const classGrades = db.query('grades', g => classStudentIds.includes(g.studentId));
    const classAvg = classGrades.length > 0 ? Math.round(classGrades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / classGrades.length) : 0;
    const termGroups = {};
    grades.forEach(g => { const key = g.term || 'General'; if (!termGroups[key]) termGroups[key] = []; termGroups[key].push(g); });
    const content = `
        <div style="margin-bottom:20px;">
            <button class="btn btn-secondary" onclick="navigateTo('studentDashboard')"><i class="fas fa-arrow-left"></i> Back</button>
            <button class="btn btn-primary" style="margin-left:8px;" onclick="downloadPerformanceReport()"><i class="fas fa-download"></i> Download Report</button>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-chart-line"></i></div><div class="stat-info"><h3>${overallAvg}%</h3><p>Overall Average</p></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><h3>${classAvg}%</h3><p>Class Average</p></div></div>
            <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-trophy"></i></div><div class="stat-info"><h3>${subjectPerformance.length > 0 ? Math.round((subjectPerformance.filter(s => s.avg >= overallAvg).length / subjectPerformance.length) * 100) : 0}%</h3><p>Subjects Above Avg</p></div></div>
            <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-book"></i></div><div class="stat-info"><h3>${grades.length}</h3><p>Total Assessments</p></div></div>
        </div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-chart-bar"></i> Subject-wise Performance</h2></div>
            <div class="card-body">${subjectPerformance.length > 0 ? `<div style="display:flex;flex-direction:column;gap:16px;">${subjectPerformance.map(sp => {const pct = sp.avg; const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--primary)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)'; return `<div><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong style="font-size:14px;">${sanitize(sp.subject)}</strong><span style="font-size:14px;font-weight:700;color:${color};">${pct}%</span></div><div style="height:10px;background:var(--gray-200);border-radius:5px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${color};border-radius:5px;transition:width 0.5s;"></div></div><div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--gray-500);"><span>Best: ${sp.best}%</span><span>${sp.count} assessments</span></div></div>`;}).join('')}</div>` : `<div class="empty-state"><i class="fas fa-chart-bar"></i><h3>No grades data available</h3></div>`}</div>
        </div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-history"></i> Grade History by Term</h2></div>
            <div class="card-body">${Object.keys(termGroups).length > 0 ? `<div class="table-container"><table><thead><tr><th>Term</th><th>Subject</th><th>Exam</th><th>Score</th><th>Grade</th></tr></thead><tbody>${Object.entries(termGroups).map(([term, termGrades]) => termGrades.map(g => `<tr><td><span class="badge badge-info">${sanitize(term)}</span></td><td>${sanitize(g.subject)}</td><td>${sanitize(g.examType)}</td><td>${g.score}/${g.totalMarks}</td><td><span class="badge ${g.grade.startsWith('A') ? 'badge-success' : g.grade.startsWith('B') ? 'badge-primary' : g.grade.startsWith('C') ? 'badge-warning' : 'badge-danger'}">${sanitize(g.grade)}</span></td></tr>`).join('')).join('')}</tbody></table></div>` : `<div class="empty-state"><i class="fas fa-history"></i><h3>No grade history</h3></div>`}</div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function downloadPerformanceReport() {
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    if (!student) return;
    const grades = db.query('grades', g => g.studentId === student.id);
    const cls = db.getById('classes', student.classId);
    const overallAvg = grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / grades.length) : 0;
    const reportHtml = `<html><head><title>Performance Report - ${student.firstName} ${student.lastName}</title><style>body{font-family:Arial;padding:40px;color:#333;}.header{text-align:center;border-bottom:3px solid #4f46e5;padding-bottom:20px;margin-bottom:30px;}.header h1{color:#4f46e5;margin:0;}.header p{color:#666;margin:5px 0 0;}table{width:100%;border-collapse:collapse;margin-top:15px;}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eee;font-size:14px;}th{background:#f5f5f5;font-weight:600;}.summary{display:flex;gap:20px;margin:20px 0;}.summary-item{flex:1;text-align:center;padding:20px;background:#f8fafc;border-radius:8px;}.summary-item .number{font-size:32px;font-weight:700;color:#4f46e5;}.summary-item .label{font-size:13px;color:#666;margin-top:4px;}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#999;}.grade-A{color:#10b981;}.grade-B{color:#3b82f6;}.grade-C{color:#f59e0b;}.grade-D{color:#ef4444;}</style></head><body><div class="header"><h1>St.Gaspar Vidyalaya</h1><p>Student Performance Report</p></div><table><tr><td><strong>Student Name:</strong></td><td>${sanitize(student.firstName + ' ' + student.lastName)}</td><td><strong>Class:</strong></td><td>${sanitize(cls ? cls.name : 'N/A')}</td></tr><tr><td><strong>Email:</strong></td><td>${sanitize(student.email)}</td><td><strong>Enrollment:</strong></td><td>${student.enrollmentDate}</td></tr></table><div class="summary"><div class="summary-item"><div class="number">${overallAvg}%</div><div class="label">Overall Average</div></div><div class="summary-item"><div class="number">${grades.length}</div><div class="label">Total Assessments</div></div><div class="summary-item"><div class="number">${cls ? cls.name : 'N/A'}</div><div class="label">Class</div></div></div>${grades.length > 0 ? `<table><thead><tr><th>Subject</th><th>Exam Type</th><th>Score</th><th>Grade</th></tr></thead><tbody>${grades.map(g => `<tr><td>${sanitize(g.subject)}</td><td>${sanitize(g.examType)}</td><td>${g.score}/${g.totalMarks}</td><td class="grade-${g.grade.charAt(0)}">${sanitize(g.grade)}</td></tr>`).join('')}</tbody></table>` : '<p>No grades recorded.</p>'}<div class="footer"><p>Generated on ${new Date().toLocaleDateString()} · St.Gaspar Vidyalaya School Management System</p></div></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(reportHtml);
    win.document.close();
    showToast('Report opened in new tab. Use Ctrl+P to save as PDF.', 'success');
}

function renderMyAttendance() {
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    if (!student) return;
    const attendance = db.query('attendance', a => a.studentId === student.id);
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const total = attendance.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    const monthAttendance = {};
    attendance.forEach(a => { const d = new Date(a.date); if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) { monthAttendance[d.getDate()] = a.status; } });
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('studentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-info"><h3>${present}</h3><p>Present</p></div></div>
            <div class="stat-card"><div class="stat-icon red"><i class="fas fa-times-circle"></i></div><div class="stat-info"><h3>${absent}</h3><p>Absent</p></div></div>
            <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-clock"></i></div><div class="stat-info"><h3>${late}</h3><p>Late</p></div></div>
            <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-percentage"></i></div><div class="stat-info"><h3>${rate}%</h3><p>Attendance Rate</p></div></div>
        </div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-calendar"></i> ${monthName}</h2></div>
            <div class="card-body">
                <div class="calendar-grid">
                    <div class="calendar-day-header">Sun</div><div class="calendar-day-header">Mon</div><div class="calendar-day-header">Tue</div><div class="calendar-day-header">Wed</div><div class="calendar-day-header">Thu</div><div class="calendar-day-header">Fri</div><div class="calendar-day-header">Sat</div>
                    ${Array(firstDay).fill(null).map(() => '<div class="calendar-day other-month"></div>').join('')}
                    ${Array.from({length: daysInMonth}, (_, i) => {
                        const day = i + 1; const status = monthAttendance[day]; const isToday = day === today.getDate();
                        let bgColor = ''; let statusText = '';
                        if (status === 'present') { bgColor = 'background:#dcfce7;border-color:var(--success);'; statusText = '✓'; }
                        else if (status === 'absent') { bgColor = 'background:#fee2e2;border-color:var(--danger);'; statusText = '✗'; }
                        else if (status === 'late') { bgColor = 'background:#fef3c7;border-color:var(--warning);'; statusText = '⏰'; }
                        return `<div class="calendar-day ${isToday ? 'today' : ''}" style="${bgColor}border:2px solid transparent;${isToday ? 'border-color:var(--primary)!important;' : ''}"><div class="day-number">${day}</div>${statusText ? '<div style="text-align:center;font-size:16px;">' + statusText + '</div>' : ''}</div>`;
                    }).join('')}
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-list"></i> Attendance History</h2></div>
            <div class="card-body">${attendance.length > 0 ? `<div class="table-container"><table><thead><tr><th>Date</th><th>Status</th><th>Marked By</th></tr></thead><tbody>${attendance.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,20).map(a => {const teacher = db.getById('teachers', a.markedBy); return `<tr><td>${a.date}</td><td><span class="badge ${a.status === 'present' ? 'badge-success' : a.status === 'late' ? 'badge-warning' : 'badge-danger'}">${sanitize(a.status)}</span></td><td>${sanitize(teacher ? teacher.firstName + ' ' + teacher.lastName : 'N/A')}</td></tr>`;}).join('')}</tbody></table></div>` : `<div class="empty-state"><i class="fas fa-calendar"></i><h3>No attendance records</h3></div>`}</div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function renderStudentMessaging() {
    const user = security.currentUser;
    const student = db.getAll('students').find(s => s.email === user.email);
    const cls = student ? db.getById('classes', student.classId) : null;
    const messages = (db.getAll('messages') || []).filter(m => m.sender === user.email || m.receiver === user.email);
    const content = `
        <div style="margin-bottom:20px;">
            <button class="btn btn-secondary" onclick="navigateTo('studentDashboard')"><i class="fas fa-arrow-left"></i> Back</button>
            <button class="btn btn-primary" style="margin-left:8px;" onclick="showComposeMessageModal('${student ? student.email : user.email}')"><i class="fas fa-plus"></i> New Message</button>
        </div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-envelope"></i> Messages</h2></div>
            <div class="card-body">${messages.length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px;">${messages.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(m => {const isSent = m.sender === user.email; return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--gray-50);border-radius:var(--radius-sm);border-left:4px solid ${isSent ? 'var(--primary)' : 'var(--success)'};"><div><strong style="font-size:14px;">${sanitize(m.subject)}</strong><p style="font-size:12px;color:var(--gray-500);margin-top:2px;">${isSent ? 'To: ' + sanitize(m.receiver) : 'From: ' + sanitize(m.sender)} · ${sanitize(m.message.substring(0,60))}${m.message.length > 60 ? '...' : ''}</p><span style="font-size:11px;color:var(--gray-400);">${new Date(m.timestamp).toLocaleString()}</span></div><button class="btn btn-sm btn-secondary" onclick="showMessageDetail('${m.id}')"><i class="fas fa-eye"></i></button></div>`;}).join('')}</div>` : `<div class="empty-state"><i class="fas fa-envelope"></i><h3>No messages</h3><p>Send a message to your teacher</p></div>`}</div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function showComposeMessageModal(studentEmail) {
    const student = db.getAll('students').find(s => s.email === studentEmail);
    const cls = student ? db.getById('classes', student.classId) : null;
    const teachers = cls ? db.query('teachers', t => t.classId === cls.id) : db.getAll('teachers');
    const admins = db.query('users', u => u.role === 'admin');
    const recipients = [...teachers.map(t => ({ value: t.email, label: t.firstName + ' ' + t.lastName + ' (Teacher)' })), ...admins.map(a => ({ value: a.email, label: a.name + ' (Admin)' }))];
    openModal('Compose Message', `
        <form id="composeMessageForm" onsubmit="sendMessage(event, '${studentEmail}')">
            <div class="form-group"><label>To <span class="required">*</span></label><select class="form-control" id="messageRecipient" required><option value="">Select Recipient</option>${recipients.map(r => `<option value="${r.value}">${sanitize(r.label)}</option>`).join('')}</select></div>
            <div class="form-group"><label>Subject <span class="required">*</span></label><input type="text" class="form-control" id="messageSubject" required placeholder="Enter subject"></div>
            <div class="form-group"><label>Message <span class="required">*</span></label><textarea class="form-control" id="messageBody" rows="5" required placeholder="Type your message here..."></textarea></div>
            <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Send</button></div>
        </form>`);
}

function sendMessage(e, senderEmail) {
    e.preventDefault();
    const receiver = document.getElementById('messageRecipient').value;
    const subject = document.getElementById('messageSubject').value.trim();
    const body = document.getElementById('messageBody').value.trim();
    const message = { id: 'msg_' + Date.now(), sender: senderEmail, receiver: receiver, subject: subject, message: body, timestamp: new Date().toISOString(), read: false };
    const messages = db.getAll('messages') || [];
    messages.push(message);
    db.storage.set('messages', messages);
    closeModal(); renderStudentMessaging(); showToast('Message sent successfully!', 'success');
}

function showMessageDetail(messageId) {
    const messages = db.getAll('messages') || [];
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    if (!msg.read) { msg.read = true; db.storage.set('messages', messages); }
    openModal('Message', `<div style="margin-bottom:20px;"><h3 style="font-size:18px;margin-bottom:8px;">${sanitize(msg.subject)}</h3><div style="display:flex;gap:16px;font-size:13px;color:var(--gray-500);"><span><strong>From:</strong> ${sanitize(msg.sender)}</span><span><strong>To:</strong> ${sanitize(msg.receiver)}</span><span><strong>Date:</strong> ${new Date(msg.timestamp).toLocaleString()}</span></div></div><div style="padding:16px;background:var(--gray-50);border-radius:var(--radius-sm);"><p style="line-height:1.6;white-space:pre-wrap;">${sanitize(msg.message)}</p></div><div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button></div>`);
}

function renderStudentLibrary() {
    const books = db.getAll('library');
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('studentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-book"></i> Library</h2><span class="badge badge-primary">${books.length} Books</span></div>
            <div class="card-body">
                <div class="search-field" style="margin-bottom:16px;"><i class="fas fa-search"></i><input type="text" id="librarySearch" placeholder="Search by title, author, or ISBN..." onkeyup="filterLibrary()" style="border:none;outline:none;flex:1;font-size:13px;"></div>
                <div class="book-grid" id="libraryBookGrid">${books.map(b => `<div class="book-card"><div class="book-icon"><i class="fas fa-book"></i></div><div class="book-title">${sanitize(b.title)}</div><div class="book-author">${sanitize(b.author)}</div><p style="font-size:12px;color:var(--gray-500);margin-bottom:8px;">ISBN: ${sanitize(b.isbn)}</p><p style="font-size:12px;color:var(--gray-500);">Available: <strong>${b.availableCopies}</strong> / ${b.totalCopies}</p><span class="badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'}" style="display:inline-block;margin-top:8px;">${b.availableCopies > 0 ? 'Available' : 'Out of Stock'}</span></div>`).join('')}</div>
            </div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function filterLibrary() {
    const q = document.getElementById('librarySearch').value.toLowerCase();
    const books = db.getAll('library').filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q));
    document.getElementById('libraryBookGrid').innerHTML = books.map(b => `<div class="book-card"><div class="book-icon"><i class="fas fa-book"></i></div><div class="book-title">${sanitize(b.title)}</div><div class="book-author">${sanitize(b.author)}</div><p style="font-size:12px;color:var(--gray-500);margin-bottom:8px;">ISBN: ${sanitize(b.isbn)}</p><p style="font-size:12px;color:var(--gray-500);">Available: <strong>${b.availableCopies}</strong> / ${b.totalCopies}</p><span class="badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'}" style="display:inline-block;margin-top:8px;">${b.availableCopies > 0 ? 'Available' : 'Out of Stock'}</span></div>`).join('');
}