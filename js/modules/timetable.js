/**
 * Timetable Scheduling Module
 * Displays timetable in horizontal format (Time as columns, Days as rows)
 * Includes calendar date picker to view specific day's timetable
 */

const TIMETABLE_TIMES = ['08:00-08:45', '08:45-09:30', '09:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-13:00'];
const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function renderTimetable() {
    const classes = db.getAll('classes');
    const user = security.currentUser;
    const isStudentOrParent = user && (user.role === 'student' || user.role === 'parent');
    let autoClassId = '';

    // Auto-detect class for students and parents
    if (isStudentOrParent) {
        const student = db.getAll('students').find(s => s.email === user.email);
        if (student) autoClassId = student.classId;
        // For parent, find first child's class
        if (!autoClassId && user.role === 'parent') {
            const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
            if (children.length > 0) autoClassId = children[0].classId;
        }
    } else {
        autoClassId = classes.length > 0 ? classes[0].id : '';
    }

    const today = new Date().toISOString().split('T')[0];

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                ${!isStudentOrParent ? `
                <select class="form-control" id="timetableClass" onchange="renderTimetableView()" style="width:auto;">
                    ${classes.map(c => `<option value="${c.id}" ${c.id === autoClassId ? 'selected' : ''}>${sanitize(c.name)}</option>`).join('')}
                </select>` : `<span style="font-size:14px;color:var(--gray-600);font-weight:600;"><i class="fas fa-clock"></i> Weekly Timetable</span>`}
            </div>
            <div class="toolbar-right" style="display:flex;gap:8px;align-items:center;">
                <input type="date" class="form-control" id="timetableDate" value="${today}" onchange="onTimetableDateChange()" style="width:auto;">
                ${!isStudentOrParent && security.hasPermission('write', 'timetable') ? `
                <button class="btn btn-primary" onclick="showEditTimetableModal()">
                    <i class="fas fa-edit"></i> Edit
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fas fa-clock"></i> <span id="timetableTitle">Weekly Timetable</span></h2>
            </div>
            <div class="card-body" id="timetableView">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;

    // Store class ID for student/parent auto-load
    if (isStudentOrParent) {
        document.getElementById('timetableView').dataset.classId = autoClassId;
    }

    renderTimetableView();
}

function onTimetableDateChange() {
    renderTimetableView();
}

function renderTimetableView() {
    const classSelect = document.getElementById('timetableClass');
    const dateInput = document.getElementById('timetableDate');
    const container = document.getElementById('timetableView');
    const titleEl = document.getElementById('timetableTitle');

    // Get class ID — from dropdown or auto-detected
    let classId = classSelect ? classSelect.value : container.dataset.classId;

    if (!classId) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><h3>No class assigned</h3></div>`;
        return;
    }

    const selectedDate = dateInput ? new Date(dateInput.value) : new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDayName = dayNames[selectedDate.getDay()];

    // Update title with selected date info
    if (titleEl) {
        const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        titleEl.textContent = dateStr;
    }

    const timetable = db.query('timetable', t => t.classId === classId);
    const teachers = db.getAll('teachers');

    if (timetable.length === 0) {
        // Generate default timetable
        const cls = db.getById('classes', classId);
        const subjects = cls?.subjects || ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'];
        TIMETABLE_DAYS.forEach((day, dayIdx) => {
            TIMETABLE_TIMES.forEach((period, periodIdx) => {
                db.add('timetable', {
                    classId,
                    day,
                    period,
                    periodIndex: periodIdx,
                    subject: subjects[(dayIdx + periodIdx) % subjects.length],
                    teacherId: cls?.teacherId || '',
                    room: cls?.room || '101'
                });
            });
        });
        renderTimetableView();
        return;
    }

    // Build transposed grid: Days as rows, Time periods as columns
    let html = '<div class="timetable-grid timetable-transposed">';

    // Header row: empty corner + time period columns
    html += '<div class="timetable-header timetable-corner"></div>';
    TIMETABLE_TIMES.forEach(time => {
        html += `<div class="timetable-header">${time}</div>`;
    });

    // Data rows: one per day
    TIMETABLE_DAYS.forEach(day => {
        const isToday = day === selectedDayName;
        const rowClass = isToday ? 'timetable-row today-row' : 'timetable-row';

        // Day name cell (sticky on mobile)
        html += `<div class="timetable-day-label ${isToday ? 'today-highlight' : ''}">${day.substring(0, 3)}</div>`;

        // Time slot cells for this day
        TIMETABLE_TIMES.forEach((time, periodIdx) => {
            const entry = timetable.find(t => t.day === day && t.periodIndex === periodIdx);
            const teacher = entry ? teachers.find(te => te.id === entry.teacherId) : null;
            const cellClass = isToday ? 'timetable-cell today-cell' : 'timetable-cell';

            html += `
                <div class="${cellClass}">
                    <div class="subject">${sanitize(entry ? entry.subject : '—')}</div>
                    ${entry ? `<div class="teacher-name">${sanitize(teacher ? teacher.firstName.charAt(0) + '. ' + teacher.lastName : '')}</div>` : ''}
                    ${entry ? `<div class="room">Rm ${sanitize(entry.room)}</div>` : ''}
                </div>
            `;
        });
    });

    html += '</div>';
    container.innerHTML = html;

    // Scroll to today's row if it exists
    const todayRow = container.querySelector('.today-row');
    if (todayRow) {
        todayRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function showEditTimetableModal() {
    const classSelect = document.getElementById('timetableClass');
    const classId = classSelect ? classSelect.value : '';
    if (!classId) { showToast('Please select a class first', 'error'); return; }

    const timetable = db.query('timetable', t => t.classId === classId);
    const teachers = db.getAll('teachers');
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education', 'Art', 'Music'];

    let formHtml = '<form id="timetableForm" onsubmit="saveTimetable(event)">';

    TIMETABLE_DAYS.forEach(day => {
        formHtml += `<h4 style="margin:16px 0 8px;color:var(--primary);">${day}</h4>`;
        TIMETABLE_TIMES.forEach((time, idx) => {
            const entry = timetable.find(t => t.day === day && t.periodIndex === idx);
            formHtml += `
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;align-items:center;">
                    <span style="min-width:90px;font-size:12px;font-weight:600;flex-shrink:0;">${time}</span>
                    <select class="form-control" name="subject_${day}_${idx}" style="flex:1;min-width:120px;">
                        <option value="">Free Period</option>
                        ${subjects.map(s => `<option value="${s}" ${entry && entry.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                    <select class="form-control" name="teacher_${day}_${idx}" style="flex:1;min-width:120px;">
                        <option value="">No Teacher</option>
                        ${teachers.map(t => `<option value="${t.id}" ${entry && entry.teacherId === t.id ? 'selected' : ''}>${sanitize(t.firstName + ' ' + t.lastName)}</option>`).join('')}
                    </select>
                    <input type="text" class="form-control" name="room_${day}_${idx}" placeholder="Room" value="${entry ? entry.room : ''}" style="width:70px;">
                </div>
            `;
        });
    });

    formHtml += `
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Timetable</button>
        </div>
    </form>`;

    openModal('Edit Timetable', formHtml, 'modal-large');
}

function saveTimetable(e) {
    e.preventDefault();
    const classId = document.getElementById('timetableClass').value;

    // Remove existing timetable for this class
    const existing = db.query('timetable', t => t.classId === classId);
    existing.forEach(t => db.delete('timetable', t.id));

    // Save new timetable
    TIMETABLE_DAYS.forEach((day, dayIdx) => {
        TIMETABLE_TIMES.forEach((period, periodIdx) => {
            const subject = document.querySelector(`[name="subject_${day}_${periodIdx}"]`).value;
            if (!subject) return;

            db.add('timetable', {
                classId,
                day,
                period,
                periodIndex: periodIdx,
                subject,
                teacherId: document.querySelector(`[name="teacher_${day}_${periodIdx}"]`).value,
                room: document.querySelector(`[name="room_${day}_${periodIdx}"]`).value
            });
        });
    });

    closeModal();
    renderTimetableView();
    showToast('Timetable saved successfully!', 'success');
}

/**
 * Renders a mini timetable for dashboard cards (student/parent)
 * Transposed format: Time as columns, Days as rows
 */
function renderMiniTimetable(timetable, teachers, selectedDay) {
    if (!timetable || timetable.length === 0) {
        return `<div class="empty-state" style="padding:20px;"><i class="fas fa-clock"></i><h3>No classes scheduled</h3></div>`;
    }

    let html = '<div class="timetable-grid timetable-transposed timetable-mini">';

    // Header: corner + time columns
    html += '<div class="timetable-header timetable-corner"></div>';
    TIMETABLE_TIMES.forEach(time => {
        html += `<div class="timetable-header" style="font-size:10px;padding:6px 4px;">${time.split('-')[0]}</div>`;
    });

    // Day rows
    TIMETABLE_DAYS.forEach(day => {
        const isToday = day === selectedDay;
        html += `<div class="timetable-day-label ${isToday ? 'today-highlight' : ''}" style="font-size:11px;padding:6px;">${day.substring(0, 3)}</div>`;

        TIMETABLE_TIMES.forEach((time, periodIdx) => {
            const entry = timetable.find(t => t.day === day && t.periodIndex === periodIdx);
            const teacher = entry ? teachers.find(te => te.id === entry.teacherId) : null;
            const cellClass = isToday ? 'timetable-cell today-cell' : 'timetable-cell';
            html += `<div class="${cellClass}" style="padding:4px;min-height:40px;">
                <div class="subject" style="font-size:11px;">${sanitize(entry ? entry.subject.substring(0, 10) : '—')}</div>
                ${teacher ? `<div class="teacher-name" style="font-size:9px;">${sanitize(teacher.firstName.charAt(0) + '.')}</div>` : ''}
            </div>`;
        });
    });

    html += '</div>';
    return html;
}