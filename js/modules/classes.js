/**
 * Classes Management Module
 */

function renderClasses() {
    const classes = db.getAll('classes');
    const teachers = db.getAll('teachers');

    const content = `
        <div class="toolbar">
            <div class="toolbar-right">
                ${security.hasPermission('write', 'classes') ? `
                <button class="btn btn-primary" onclick="showAddClassModal()">
                    <i class="fas fa-plus"></i> Add Class
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-school"></i> Classes & Sections</h2><span class="badge badge-primary">${classes.length} Total</span></div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Class Name</th>
                                <th>Grade</th>
                                <th>Section</th>
                                <th>Room</th>
                                <th>Class Teacher</th>
                                <th>Capacity</th>
                                <th>Students</th>
                                <th>Subjects</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${classes.length > 0 ? classes.map(c => {
                                const teacher = teachers.find(t => t.id === c.teacherId);
                                return `
                                <tr>
                                    <td><strong>${sanitize(c.name)}</strong></td>
                                    <td>${sanitize(c.grade)}</td>
                                    <td>${sanitize(c.section)}</td>
                                    <td>${sanitize(c.room)}</td>
                                    <td>${sanitize(teacher ? teacher.firstName + ' ' + teacher.lastName : 'Not Assigned')}</td>
                                    <td>${c.capacity}</td>
                                    <td>${c.studentCount || 0}</td>
                                    <td>${c.subjects ? c.subjects.map(s => `<span class="badge badge-secondary">${sanitize(s)}</span>`).join(' ') : ''}</td>
                                    <td>
                                        <div style="display:flex;gap:4px;">
                                            ${security.hasPermission('write', 'classes') ? `
                                            <button class="btn btn-sm btn-primary" onclick="showEditClassModal('${c.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteClass('${c.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                                `;
                            }).join('') : `<tr><td colspan="9" class="text-center"><div class="empty-state"><i class="fas fa-school"></i><h3>No classes created yet</h3></div></td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function showAddClassModal() {
    const teachers = db.getAll('teachers');
    openModal('Add New Class', `
        <form id="classForm" onsubmit="saveClass(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>Class Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="name" placeholder="e.g., Grade 5 - Section A" required>
                </div>
                <div class="form-group">
                    <label>Grade <span class="required">*</span></label>
                    <input type="text" class="form-control" id="grade" placeholder="e.g., Grade 5" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Section <span class="required">*</span></label>
                    <input type="text" class="form-control" id="section" placeholder="e.g., A" required>
                </div>
                <div class="form-group">
                    <label>Room</label>
                    <input type="text" class="form-control" id="room" placeholder="e.g., 101">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Capacity</label>
                    <input type="number" class="form-control" id="capacity" value="30" min="1" max="60">
                </div>
                <div class="form-group">
                    <label>Class Teacher</label>
                    <select class="form-control" id="teacherId">
                        <option value="">Select Teacher</option>
                        ${teachers.map(t => `<option value="${t.id}">${sanitize(t.firstName + ' ' + t.lastName)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Subjects (comma separated)</label>
                <input type="text" class="form-control" id="subjects" placeholder="e.g., Mathematics, English, Science">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Class</button>
            </div>
        </form>
    `);
}

function showEditClassModal(id) {
    const cls = db.getById('classes', id);
    if (!cls) return;
    const teachers = db.getAll('teachers');
    
    openModal('Edit Class', `
        <form id="classForm" onsubmit="updateClass(event, '${id}')">
            <div class="form-row">
                <div class="form-group">
                    <label>Class Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="name" value="${sanitize(cls.name)}" required>
                </div>
                <div class="form-group">
                    <label>Grade <span class="required">*</span></label>
                    <input type="text" class="form-control" id="grade" value="${sanitize(cls.grade)}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Section <span class="required">*</span></label>
                    <input type="text" class="form-control" id="section" value="${sanitize(cls.section)}" required>
                </div>
                <div class="form-group">
                    <label>Room</label>
                    <input type="text" class="form-control" id="room" value="${sanitize(cls.room)}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Capacity</label>
                    <input type="number" class="form-control" id="capacity" value="${cls.capacity}" min="1" max="60">
                </div>
                <div class="form-group">
                    <label>Class Teacher</label>
                    <select class="form-control" id="teacherId">
                        <option value="">Select Teacher</option>
                        ${teachers.map(t => `<option value="${t.id}" ${cls.teacherId === t.id ? 'selected' : ''}>${sanitize(t.firstName + ' ' + t.lastName)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Subjects (comma separated)</label>
                <input type="text" class="form-control" id="subjects" value="${cls.subjects ? cls.subjects.join(', ') : ''}">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Class</button>
            </div>
        </form>
    `);
}

function saveClass(e) {
    e.preventDefault();
    const subjectsStr = document.getElementById('subjects').value;
    const data = {
        name: document.getElementById('name').value.trim(),
        grade: document.getElementById('grade').value.trim(),
        section: document.getElementById('section').value.trim(),
        room: document.getElementById('room').value.trim(),
        capacity: parseInt(document.getElementById('capacity').value) || 30,
        teacherId: document.getElementById('teacherId').value,
        subjects: subjectsStr ? subjectsStr.split(',').map(s => s.trim()).filter(s => s) : [],
        studentCount: 0
    };

    const validation = Validator.validateClass(data);
    if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
    }

    const sanitized = security.sanitizeObject(data);
    db.add('classes', sanitized);
    closeModal();
    renderClasses();
    showToast('Class added successfully!', 'success');
}

function updateClass(e, id) {
    e.preventDefault();
    const subjectsStr = document.getElementById('subjects').value;
    const data = {
        name: document.getElementById('name').value.trim(),
        grade: document.getElementById('grade').value.trim(),
        section: document.getElementById('section').value.trim(),
        room: document.getElementById('room').value.trim(),
        capacity: parseInt(document.getElementById('capacity').value) || 30,
        teacherId: document.getElementById('teacherId').value,
        subjects: subjectsStr ? subjectsStr.split(',').map(s => s.trim()).filter(s => s) : []
    };

    const sanitized = security.sanitizeObject(data);
    db.update('classes', id, sanitized);
    closeModal();
    renderClasses();
    showToast('Class updated successfully!', 'success');
}

function deleteClass(id) {
    if (!confirm('Are you sure you want to delete this class?')) return;
    db.delete('classes', id);
    renderClasses();
    showToast('Class deleted successfully', 'success');
}