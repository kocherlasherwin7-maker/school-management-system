/**
 * Attendance Tracking Module
 */

function renderAttendance() {
    const classes = db.getAll('classes');
    const today = new Date().toISOString().split('T')[0];

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <select class="form-control" id="attendanceClass" onchange="renderAttendanceGrid()" style="width:auto;min-width:200px;">
                    <option value="">Select Class</option>
                    ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                </select>
                <input type="date" class="form-control" id="attendanceDate" value="${today}" onchange="renderAttendanceGrid()" style="width:auto;">
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'attendance') ? `
                <button class="btn btn-success" onclick="markAllPresent()"><i class="fas fa-check"></i> All Present</button>
                <button class="btn btn-primary" onclick="saveAttendance()"><i class="fas fa-save"></i> Save Attendance</button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-calendar-check"></i> Attendance</h2><span id="attendanceSummary" class="text-muted"></span></div>
            <div class="card-body" id="attendanceGridContainer">
                <div class="empty-state"><i class="fas fa-calendar-check"></i><h3>Select a class to view attendance</h3></div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderAttendanceGrid() {
    const classId = document.getElementById('attendanceClass').value;
    const date = document.getElementById('attendanceDate').value;
    const container = document.getElementById('attendanceGridContainer');

    if (!classId || !date) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-check"></i><h3>Select a class to view attendance</h3></div>`;
        return;
    }

    const students = db.query('students', s => s.classId === classId && s.status === 'active');
    const existingAttendance = db.query('attendance', a => a.classId === classId && a.date === date);

    if (students.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-user-graduate"></i><h3>No students in this class</h3></div>`;
        return;
    }

    const presentCount = existingAttendance.filter(a => a.status === 'present').length;
    document.getElementById('attendanceSummary').textContent = `${presentCount}/${students.length} Present`;

    container.innerHTML = `
        <div class="attendance-grid" id="attendanceGrid">
            ${students.map(s => {
                const existing = existingAttendance.find(a => a.studentId === s.id);
                const status = existing ? existing.status : 'present';
                return `
                <div class="attendance-item ${status}" data-student-id="${s.id}" onclick="toggleAttendanceStatus(this)">
                    <div class="student-name">${sanitize(s.firstName + ' ' + s.lastName)}</div>
                    <div class="attendance-status">
                        <span class="present-status ${status === 'present' ? 'badge-success' : 'badge-secondary'}" onclick="event.stopPropagation();setAttendanceStatus(this.closest('.attendance-item'), 'present')">Present</span>
                        <span class="absent-status ${status === 'absent' ? 'badge-danger' : 'badge-secondary'}" onclick="event.stopPropagation();setAttendanceStatus(this.closest('.attendance-item'), 'absent')">Absent</span>
                        <span class="late-status ${status === 'late' ? 'badge-warning' : 'badge-secondary'}" onclick="event.stopPropagation();setAttendanceStatus(this.closest('.attendance-item'), 'late')">Late</span>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
}

function toggleAttendanceStatus(el) {
    const statuses = ['present', 'absent', 'late'];
    const current = el.classList.contains('present') ? 'present' : el.classList.contains('absent') ? 'absent' : 'late';
    const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
    setAttendanceStatus(el, statuses[nextIdx]);
}

function setAttendanceStatus(el, status) {
    el.classList.remove('present', 'absent', 'late');
    el.classList.add(status);
    el.querySelector('.present-status').className = `present-status ${status === 'present' ? 'badge-success' : 'badge-secondary'}`;
    el.querySelector('.absent-status').className = `absent-status ${status === 'absent' ? 'badge-danger' : 'badge-secondary'}`;
    el.querySelector('.late-status').className = `late-status ${status === 'late' ? 'badge-warning' : 'badge-secondary'}`;
    updateAttendanceSummary();
}

function updateAttendanceSummary() {
    const items = document.querySelectorAll('#attendanceGrid .attendance-item');
    const total = items.length;
    const present = document.querySelectorAll('#attendanceGrid .attendance-item.present').length;
    document.getElementById('attendanceSummary').textContent = `${present}/${total} Present`;
}

function markAllPresent() {
    document.querySelectorAll('#attendanceGrid .attendance-item').forEach(el => setAttendanceStatus(el, 'present'));
}

function saveAttendance() {
    const classId = document.getElementById('attendanceClass').value;
    const date = document.getElementById('attendanceDate').value;
    
    if (!classId || !date) {
        showToast('Please select a class and date', 'error');
        return;
    }

    const items = document.querySelectorAll('#attendanceGrid .attendance-item');
    
    // Remove existing attendance for this class/date
    const existing = db.query('attendance', a => a.classId === classId && a.date === date);
    existing.forEach(a => db.delete('attendance', a.id));

    // Save new attendance
    items.forEach(el => {
        const studentId = el.dataset.studentId;
        const status = el.classList.contains('present') ? 'present' : el.classList.contains('absent') ? 'absent' : 'late';
        db.add('attendance', {
            studentId,
            date,
            status,
            classId,
            markedBy: security.currentUser?.id || 'unknown'
        });
    });

    showToast('Attendance saved successfully!', 'success');
}