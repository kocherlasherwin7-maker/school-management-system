/**
 * Timetable Scheduling Module
 */

function renderTimetable() {
    const classes = db.getAll('classes');
    const currentClassId = classes.length > 0 ? classes[0].id : '';

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <select class="form-control" id="timetableClass" onchange="renderTimetableView()" style="width:auto;min-width:200px;">
                    ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'timetable') ? `
                <button class="btn btn-primary" onclick="showEditTimetableModal()">
                    <i class="fas fa-edit"></i> Edit Timetable
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-clock"></i> Class Timetable</h2></div>
            <div class="card-body" id="timetableView">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
    renderTimetableView();
}

function renderTimetableView() {
    const classId = document.getElementById('timetableClass').value;
    const container = document.getElementById('timetableView');
    
    if (!classId) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><h3>Select a class to view timetable</h3></div>`;
        return;
    }

    const cls = db.getById('classes', classId);
    const timetable = db.query('timetable', t => t.classId === classId);
    const teachers = db.getAll('teachers');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['08:00-08:45', '08:45-09:30', '09:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-13:00'];

    if (timetable.length === 0) {
        // Generate default timetable for this class
        const subjects = cls?.subjects || ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'];
        days.forEach((day, dayIdx) => {
            times.forEach((period, periodIdx) => {
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

    let html = '<div class="timetable-grid">';
    // Header
    html += '<div class="timetable-header">Time</div>';
    days.forEach(day => { html += `<div class="timetable-header">${day}</div>`; });

    // Periods
    times.forEach((time, periodIdx) => {
        html += `<div class="timetable-time">${time}</div>`;
        days.forEach(day => {
            const entry = timetable.find(t => t.day === day && t.periodIndex === periodIdx);
            const teacher = entry ? teachers.find(t => t.id === entry.teacherId) : null;
            html += `
                <div class="timetable-cell">
                    <div class="subject">${sanitize(entry ? entry.subject : 'Free')}</div>
                    <div class="teacher-name">${sanitize(teacher ? teacher.firstName + ' ' + teacher.lastName : '')}</div>
                    <div class="room">${entry ? 'Room ' + entry.room : ''}</div>
                </div>
            `;
        });
    });

    html += '</div>';
    container.innerHTML = html;
}

function showEditTimetableModal() {
    const classId = document.getElementById('timetableClass').value;
    if (!classId) { showToast('Please select a class first', 'error'); return; }

    const timetable = db.query('timetable', t => t.classId === classId);
    const teachers = db.getAll('teachers');
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education', 'Art', 'Music'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['08:00-08:45', '08:45-09:30', '09:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-13:00'];

    let formHtml = '<form id="timetableForm" onsubmit="saveTimetable(event)">';
    
    days.forEach(day => {
        formHtml += `<h4 style="margin:16px 0 8px;color:var(--primary);">${day}</h4>`;
        times.forEach((time, idx) => {
            const entry = timetable.find(t => t.day === day && t.periodIndex === idx);
            formHtml += `
                <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
                    <span style="min-width:120px;font-size:13px;font-weight:600;">${time}</span>
                    <select class="form-control" name="subject_${day}_${idx}" style="width:auto;min-width:150px;">
                        <option value="">Free Period</option>
                        ${subjects.map(s => `<option value="${s}" ${entry && entry.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                    <select class="form-control" name="teacher_${day}_${idx}" style="width:auto;min-width:180px;">
                        <option value="">No Teacher</option>
                        ${teachers.map(t => `<option value="${t.id}" ${entry && entry.teacherId === t.id ? 'selected' : ''}>${sanitize(t.firstName + ' ' + t.lastName)}</option>`).join('')}
                    </select>
                    <input type="text" class="form-control" name="room_${day}_${idx}" placeholder="Room" value="${entry ? entry.room : ''}" style="width:80px;">
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
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['08:00-08:45', '08:45-09:30', '09:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-13:00'];

    // Remove existing timetable for this class
    const existing = db.query('timetable', t => t.classId === classId);
    existing.forEach(t => db.delete('timetable', t.id));

    // Save new timetable
    days.forEach((day, dayIdx) => {
        times.forEach((period, periodIdx) => {
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