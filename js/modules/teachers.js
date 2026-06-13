/**
 * Teachers Management Module
 */

function renderTeachers() {
    const teachers = db.getAll('teachers');
    const classes = db.getAll('classes');

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-field">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchTeachers" placeholder="Search teachers..." onkeyup="filterTeachers()">
                </div>
                <select class="form-control" id="subjectFilter" onchange="filterTeachers()" style="width:auto;min-width:150px;">
                    <option value="">All Specializations</option>
                    ${[...new Set(teachers.map(t => t.specialization))].map(s => `<option value="${s}">${sanitize(s)}</option>`).join('')}
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'teachers') ? `
                <button class="btn btn-primary" onclick="showAddTeacherModal()">
                    <i class="fas fa-plus"></i> Add Teacher
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-chalkboard-teacher"></i> Teachers List</h2><span class="badge badge-primary">${teachers.length} Total</span></div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Specialization</th>
                                <th>Qualification</th>
                                <th>Experience</th>
                                <th>Class</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="teachersTableBody">
                            ${renderTeacherRows(teachers, classes)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderTeacherRows(teachers, classes) {
    if (teachers.length === 0) {
        return `<tr><td colspan="8" class="text-center"><div class="empty-state"><i class="fas fa-chalkboard-teacher"></i><h3>No teachers found</h3></div></td></tr>`;
    }

    return teachers.map(t => {
        const cls = classes.find(c => c.id === t.classId);
        return `
        <tr>
            <td><strong>${sanitize(t.firstName + ' ' + t.lastName)}</strong></td>
            <td>${sanitize(t.email)}</td>
            <td>${sanitize(t.specialization)}</td>
            <td>${sanitize(t.qualification)}</td>
            <td>${t.experience} yrs</td>
            <td>${sanitize(cls ? cls.name : 'Not Assigned')}</td>
            <td><span class="badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}">${sanitize(t.status)}</span></td>
            <td>
                <div style="display:flex;gap:4px;">
                    ${security.hasPermission('write', 'teachers') ? `
                    <button class="btn btn-sm btn-primary" onclick="showEditTeacherModal('${t.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${t.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function filterTeachers() {
    const search = document.getElementById('searchTeachers').value.toLowerCase();
    const subjectFilter = document.getElementById('subjectFilter').value;
    
    let teachers = db.getAll('teachers');
    const classes = db.getAll('classes');

    if (search) {
        teachers = teachers.filter(t => 
            t.firstName.toLowerCase().includes(search) || 
            t.lastName.toLowerCase().includes(search) || 
            t.email.toLowerCase().includes(search)
        );
    }
    if (subjectFilter) {
        teachers = teachers.filter(t => t.specialization === subjectFilter);
    }

    document.getElementById('teachersTableBody').innerHTML = renderTeacherRows(teachers, classes);
}

function showAddTeacherModal() {
    const classes = db.getAll('classes');
    openModal('Add New Teacher', `
        <form id="teacherForm" onsubmit="saveTeacher(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="firstName" required>
                </div>
                <div class="form-group">
                    <label>Last Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="lastName" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" class="form-control" id="email" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" class="form-control" id="phone">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" class="form-control" id="dateOfBirth">
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <select class="form-control" id="gender">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea class="form-control" id="address" rows="2"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Qualification <span class="required">*</span></label>
                    <input type="text" class="form-control" id="qualification" required>
                </div>
                <div class="form-group">
                    <label>Specialization <span class="required">*</span></label>
                    <input type="text" class="form-control" id="specialization" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Experience (Years)</label>
                    <input type="number" class="form-control" id="experience" min="0">
                </div>
                <div class="form-group">
                    <label>Assign Class</label>
                    <select class="form-control" id="classId">
                        <option value="">Not Assigned</option>
                        ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Teacher</button>
            </div>
        </form>
    `, 'modal-large');
}

function showEditTeacherModal(id) {
    const teacher = db.getById('teachers', id);
    if (!teacher) return;
    const classes = db.getAll('classes');
    
    openModal('Edit Teacher', `
        <form id="teacherForm" onsubmit="updateTeacher(event, '${id}')">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="firstName" value="${sanitize(teacher.firstName)}" required>
                </div>
                <div class="form-group">
                    <label>Last Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="lastName" value="${sanitize(teacher.lastName)}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" class="form-control" id="email" value="${sanitize(teacher.email)}" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" class="form-control" id="phone" value="${sanitize(teacher.phone || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" class="form-control" id="dateOfBirth" value="${teacher.dateOfBirth || ''}">
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <select class="form-control" id="gender">
                        <option value="">Select</option>
                        <option value="male" ${teacher.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${teacher.gender === 'female' ? 'selected' : ''}>Female</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea class="form-control" id="address" rows="2">${sanitize(teacher.address || '')}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Qualification <span class="required">*</span></label>
                    <input type="text" class="form-control" id="qualification" value="${sanitize(teacher.qualification)}" required>
                </div>
                <div class="form-group">
                    <label>Specialization <span class="required">*</span></label>
                    <input type="text" class="form-control" id="specialization" value="${sanitize(teacher.specialization)}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Experience (Years)</label>
                    <input type="number" class="form-control" id="experience" value="${teacher.experience || 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Assign Class</label>
                    <select class="form-control" id="classId">
                        <option value="">Not Assigned</option>
                        ${classes.map(c => `<option value="${c.id}" ${teacher.classId === c.id ? 'selected' : ''}>${sanitize(c.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="status">
                    <option value="active" ${teacher.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${teacher.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Teacher</button>
            </div>
        </form>
    `, 'modal-large');
}

function saveTeacher(e) {
    e.preventDefault();
    const data = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value.trim(),
        qualification: document.getElementById('qualification').value.trim(),
        specialization: document.getElementById('specialization').value.trim(),
        experience: parseInt(document.getElementById('experience').value) || 0,
        classId: document.getElementById('classId').value,
        status: 'active'
    };

    const validation = Validator.validateTeacher(data);
    if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
    }

    const sanitized = security.sanitizeObject(data);
    db.add('teachers', sanitized);
    closeModal();
    renderTeachers();
    showToast('Teacher added successfully!', 'success');
}

function updateTeacher(e, id) {
    e.preventDefault();
    const data = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value.trim(),
        qualification: document.getElementById('qualification').value.trim(),
        specialization: document.getElementById('specialization').value.trim(),
        experience: parseInt(document.getElementById('experience').value) || 0,
        classId: document.getElementById('classId').value,
        status: document.getElementById('status').value
    };

    const sanitized = security.sanitizeObject(data);
    db.update('teachers', id, sanitized);
    closeModal();
    renderTeachers();
    showToast('Teacher updated successfully!', 'success');
}

function deleteTeacher(id) {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    db.delete('teachers', id);
    renderTeachers();
    showToast('Teacher deleted successfully', 'success');
}