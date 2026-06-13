/**
 * Assignments / Homework Module
 */

function renderAssignments() {
    const assignments = db.getAll('assignments');
    const classes = db.getAll('classes');
    const teachers = db.getAll('teachers');

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <select class="form-control" id="assignClassFilter" onchange="filterAssignments()" style="width:auto;min-width:150px;">
                    <option value="">All Classes</option>
                    ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                </select>
                <select class="form-control" id="assignStatusFilter" onchange="filterAssignments()" style="width:auto;min-width:120px;">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'assignments') ? `
                <button class="btn btn-primary" onclick="showAddAssignmentModal()">
                    <i class="fas fa-plus"></i> Add Assignment
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-tasks"></i> Assignments & Homework</h2><span class="badge badge-primary">${assignments.length} Total</span></div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Class</th>
                                <th>Teacher</th>
                                <th>Due Date</th>
                                <th>Max Score</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="assignmentsTableBody">
                            ${renderAssignmentRows(assignments, classes, teachers)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderAssignmentRows(assignments, classes, teachers) {
    if (assignments.length === 0) {
        return `<tr><td colspan="8" class="text-center"><div class="empty-state"><i class="fas fa-tasks"></i><h3>No assignments yet</h3></div></td></tr>`;
    }

    return assignments.map(a => {
        const cls = classes.find(c => c.id === a.classId);
        const teacher = teachers.find(t => t.id === a.teacherId);
        const isOverdue = new Date(a.dueDate) < new Date();
        return `
        <tr>
            <td><strong>${sanitize(a.title)}</strong></td>
            <td>${sanitize(a.subject)}</td>
            <td>${sanitize(cls ? cls.name : 'N/A')}</td>
            <td>${sanitize(teacher ? teacher.firstName + ' ' + teacher.lastName : 'N/A')}</td>
            <td style="color:${isOverdue && a.status === 'active' ? 'var(--danger)' : 'inherit'};font-weight:${isOverdue ? '600' : 'normal'}">${a.dueDate}${isOverdue && a.status === 'active' ? ' (Overdue)' : ''}</td>
            <td>${a.maxScore}</td>
            <td><span class="badge ${a.status === 'active' ? 'badge-success' : 'badge-secondary'}">${sanitize(a.status)}</span></td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn btn-sm btn-secondary" onclick="viewAssignment('${a.id}')" title="View"><i class="fas fa-eye"></i></button>
                    ${security.hasPermission('write', 'assignments') ? `
                    <button class="btn btn-sm btn-primary" onclick="showEditAssignmentModal('${a.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAssignment('${a.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function filterAssignments() {
    const classFilter = document.getElementById('assignClassFilter').value;
    const statusFilter = document.getElementById('assignStatusFilter').value;
    let assignments = db.getAll('assignments');
    const classes = db.getAll('classes');
    const teachers = db.getAll('teachers');

    if (classFilter) assignments = assignments.filter(a => a.classId === classFilter);
    if (statusFilter) assignments = assignments.filter(a => a.status === statusFilter);

    document.getElementById('assignmentsTableBody').innerHTML = renderAssignmentRows(assignments, classes, teachers);
}

function showAddAssignmentModal() {
    const classes = db.getAll('classes');
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education', 'Art', 'Music'];

    openModal('Add New Assignment', `
        <form id="assignmentForm" onsubmit="saveAssignment(event)">
            <div class="form-group">
                <label>Title <span class="required">*</span></label>
                <input type="text" class="form-control" id="title" required>
            </div>
            <div class="form-group">
                <label>Description <span class="required">*</span></label>
                <textarea class="form-control" id="description" rows="3" required></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Subject <span class="required">*</span></label>
                    <select class="form-control" id="subject" required>
                        <option value="">Select Subject</option>
                        ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Class <span class="required">*</span></label>
                    <select class="form-control" id="classId" required>
                        <option value="">Select Class</option>
                        ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Due Date <span class="required">*</span></label>
                    <input type="date" class="form-control" id="dueDate" required>
                </div>
                <div class="form-group">
                    <label>Max Score</label>
                    <input type="number" class="form-control" id="maxScore" value="100" min="1">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Assignment</button>
            </div>
        </form>
    `);
}

function showEditAssignmentModal(id) {
    const assignment = db.getById('assignments', id);
    if (!assignment) return;
    const classes = db.getAll('classes');
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education', 'Art', 'Music'];

    openModal('Edit Assignment', `
        <form id="assignmentForm" onsubmit="updateAssignment(event, '${id}')">
            <div class="form-group">
                <label>Title <span class="required">*</span></label>
                <input type="text" class="form-control" id="title" value="${sanitize(assignment.title)}" required>
            </div>
            <div class="form-group">
                <label>Description <span class="required">*</span></label>
                <textarea class="form-control" id="description" rows="3" required>${sanitize(assignment.description)}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Subject <span class="required">*</span></label>
                    <select class="form-control" id="subject" required>
                        ${subjects.map(s => `<option value="${s}" ${assignment.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Class <span class="required">*</span></label>
                    <select class="form-control" id="classId" required>
                        ${classes.map(c => `<option value="${c.id}" ${assignment.classId === c.id ? 'selected' : ''}>${sanitize(c.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Due Date <span class="required">*</span></label>
                    <input type="date" class="form-control" id="dueDate" value="${assignment.dueDate}" required>
                </div>
                <div class="form-group">
                    <label>Max Score</label>
                    <input type="number" class="form-control" id="maxScore" value="${assignment.maxScore}" min="1">
                </div>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="status">
                    <option value="active" ${assignment.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="completed" ${assignment.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Assignment</button>
            </div>
        </form>
    `);
}

function saveAssignment(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        subject: document.getElementById('subject').value,
        classId: document.getElementById('classId').value,
        dueDate: document.getElementById('dueDate').value,
        maxScore: parseInt(document.getElementById('maxScore').value) || 100,
        teacherId: security.currentUser?.id || '',
        status: 'active',
        submissions: []
    };

    const validation = Validator.validateAssignment(data);
    if (!validation.valid) { showToast(validation.errors[0], 'error'); return; }

    const sanitized = security.sanitizeObject(data);
    db.add('assignments', sanitized);
    closeModal();
    renderAssignments();
    showToast('Assignment added successfully!', 'success');
}

function updateAssignment(e, id) {
    e.preventDefault();
    const data = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        subject: document.getElementById('subject').value,
        classId: document.getElementById('classId').value,
        dueDate: document.getElementById('dueDate').value,
        maxScore: parseInt(document.getElementById('maxScore').value) || 100,
        status: document.getElementById('status').value
    };

    db.update('assignments', id, security.sanitizeObject(data));
    closeModal();
    renderAssignments();
    showToast('Assignment updated successfully!', 'success');
}

function deleteAssignment(id) {
    if (!confirm('Delete this assignment?')) return;
    db.delete('assignments', id);
    renderAssignments();
    showToast('Assignment deleted', 'success');
}

function viewAssignment(id) {
    const assignment = db.getById('assignments', id);
    if (!assignment) return;
    const cls = db.getById('classes', assignment.classId);
    const teacher = db.getById('teachers', assignment.teacherId);

    openModal(`Assignment: ${sanitize(assignment.title)}`, `
        <div style="margin-bottom:16px;">
            <h4 style="color:var(--primary);margin-bottom:12px;">${sanitize(assignment.title)}</h4>
            <p style="color:var(--gray-600);margin-bottom:16px;line-height:1.6;">${sanitize(assignment.description)}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px;">
                <div><strong>Subject:</strong> ${sanitize(assignment.subject)}</div>
                <div><strong>Class:</strong> ${sanitize(cls ? cls.name : 'N/A')}</div>
                <div><strong>Teacher:</strong> ${sanitize(teacher ? teacher.firstName + ' ' + teacher.lastName : 'N/A')}</div>
                <div><strong>Due Date:</strong> ${assignment.dueDate}</div>
                <div><strong>Max Score:</strong> ${assignment.maxScore}</div>
                <div><strong>Status:</strong> <span class="badge ${assignment.status === 'active' ? 'badge-success' : 'badge-secondary'}">${sanitize(assignment.status)}</span></div>
            </div>
        </div>
    `);
}