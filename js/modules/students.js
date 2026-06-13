/**
 * Students Management Module
 */

function renderStudents() {
    const students = db.getAll('students');
    const classes = db.getAll('classes');

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-field">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchStudents" placeholder="Search by name, email..." onkeyup="filterStudents()">
                </div>
                <select class="form-control" id="classFilter" onchange="filterStudents()" style="width:auto;min-width:150px;">
                    <option value="">All Classes</option>
                    ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                </select>
                <select class="form-control" id="statusFilter" onchange="filterStudents()" style="width:auto;min-width:120px;">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'students') ? `
                <button class="btn btn-primary" onclick="showAddStudentModal()">
                    <i class="fas fa-plus"></i> Add Student
                </button>
                <button class="btn btn-success" onclick="showBulkUploadModal()">
                    <i class="fas fa-file-excel"></i> Bulk Upload
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-user-graduate"></i> Students List</h2><span class="badge badge-primary">${students.length} Total</span></div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Class</th>
                                <th>Parent</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentsTableBody">
                            ${renderStudentRows(students, classes)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderStudentRows(students, classes) {
    if (students.length === 0) {
        return `<tr><td colspan="6" class="text-center"><div class="empty-state"><i class="fas fa-user-graduate"></i><h3>No students found</h3></div></td></tr>`;
    }

    return students.map(s => {
        const cls = classes.find(c => c.id === s.classId);
        return `
        <tr>
            <td><strong>${sanitize(s.firstName + ' ' + s.lastName)}</strong></td>
            <td>${sanitize(s.email)}</td>
            <td>${sanitize(cls ? cls.name : 'Not Assigned')}</td>
            <td>${sanitize(s.parentName)} (${sanitize(s.parentPhone)})</td>
            <td><span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}">${sanitize(s.status)}</span></td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn btn-sm btn-secondary" onclick="showStudentDetail('${s.id}')" title="View"><i class="fas fa-eye"></i></button>
                    ${security.hasPermission('write', 'students') ? `
                    <button class="btn btn-sm btn-primary" onclick="showEditStudentModal('${s.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function filterStudents() {
    const search = document.getElementById('searchStudents').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let students = db.getAll('students');
    const classes = db.getAll('classes');

    if (search) {
        students = students.filter(s => 
            s.firstName.toLowerCase().includes(search) || 
            s.lastName.toLowerCase().includes(search) || 
            s.email.toLowerCase().includes(search)
        );
    }
    if (classFilter) {
        students = students.filter(s => s.classId === classFilter);
    }
    if (statusFilter) {
        students = students.filter(s => s.status === statusFilter);
    }

    document.getElementById('studentsTableBody').innerHTML = renderStudentRows(students, classes);
}

function showAddStudentModal() {
    const classes = db.getAll('classes');
    openModal('Add New Student', `
        <form id="studentForm" onsubmit="saveStudent(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="firstName" required minlength="2">
                </div>
                <div class="form-group">
                    <label>Last Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="lastName" required minlength="2">
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
                    <label>Date of Birth <span class="required">*</span></label>
                    <input type="date" class="form-control" id="dateOfBirth" required>
                </div>
                <div class="form-group">
                    <label>Gender <span class="required">*</span></label>
                    <select class="form-control" id="gender" required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea class="form-control" id="address" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label>Blood Group</label>
                <select class="form-control" id="bloodGroup">
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class <span class="required">*</span></label>
                <select class="form-control" id="classId" required>
                    <option value="">Select Class</option>
                    ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Parent Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="parentName" required>
                </div>
                <div class="form-group">
                    <label>Parent Phone <span class="required">*</span></label>
                    <input type="text" class="form-control" id="parentPhone" required>
                </div>
            </div>
            <div class="form-group">
                <label>Parent Email</label>
                <input type="email" class="form-control" id="parentEmail">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Student</button>
            </div>
        </form>
    `, 'modal-large');
}

// ========== Bulk Excel Upload ==========

const EXCEL_TEMPLATE_COLUMNS = [
    'firstName*', 'lastName*', 'email*', 'phone', 'dateOfBirth*', 
    'gender*', 'address', 'bloodGroup', 'classId*', 
    'parentName*', 'parentPhone*', 'parentEmail'
];

function showBulkUploadModal() {
    const classes = db.getAll('classes');
    openModal('Bulk Upload Students from Excel', `
        <div style="margin-bottom:20px;">
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> Upload an Excel (.xlsx or .xls) file with student data.
                Columns marked with <span class="required">*</span> are required.
            </div>
            
            <div style="margin-bottom:16px;">
                <h4 style="margin-bottom:8px;color:var(--primary);">Required Columns:</h4>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${EXCEL_TEMPLATE_COLUMNS.map(col => {
                        const isRequired = col.endsWith('*');
                        const name = isRequired ? col.slice(0, -1) : col;
                        return `<span class="badge ${isRequired ? 'badge-danger' : 'badge-secondary'}">${sanitize(col)}</span>`;
                    }).join('')}
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <h4 style="margin-bottom:8px;color:var(--primary);">Class Reference:</h4>
                <p style="font-size:13px;color:var(--gray-500);margin-bottom:8px;">Use one of these class IDs in the <strong>classId</strong> column:</p>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${classes.map(c => `<span class="badge badge-info">${sanitize(c.id)}</span>`).join(' ')}
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <h4 style="margin-bottom:8px;color:var(--primary);">Gender Values:</h4>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    <span class="badge badge-primary">male</span>
                    <span class="badge badge-primary">female</span>
                </div>
            </div>

            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;">
                <div class="file-input-wrapper">
                    <button class="btn btn-success" onclick="document.getElementById('excelFileInput').click()">
                        <i class="fas fa-file-excel"></i> Choose Excel File
                    </button>
                    <input type="file" id="excelFileInput" accept=".xlsx,.xls" onchange="handleExcelUpload(event)">
                </div>
                <button class="btn btn-secondary" onclick="downloadExcelTemplate()">
                    <i class="fas fa-download"></i> Download Template
                </button>
            </div>
        </div>

        <div id="uploadProgressContainer" style="display:none;"></div>
    `, 'modal-large');
}

function downloadExcelTemplate() {
    // Create a sample data array
    const classes = db.getAll('classes');
    const sampleRows = [
        {
            'firstName*': 'John',
            'lastName*': 'Doe',
            'email*': 'john.doe@example.com',
            phone: '+1-555-1234',
            'dateOfBirth*': '2012-01-15',
            'gender*': 'male',
            address: '123 Main Street',
            bloodGroup: 'A+',
            'classId*': classes.length > 0 ? classes[0].id : 'c1',
            'parentName*': 'Jane Doe',
            'parentPhone*': '+1-555-5678',
            parentEmail: 'jane.doe@example.com'
        },
        {
            'firstName*': 'Alice',
            'lastName*': 'Smith',
            'email*': 'alice.smith@example.com',
            phone: '+1-555-9876',
            'dateOfBirth*': '2013-06-20',
            'gender*': 'female',
            address: '456 Oak Avenue',
            bloodGroup: 'B+',
            'classId*': classes.length > 0 ? classes[0].id : 'c1',
            'parentName*': 'Bob Smith',
            'parentPhone*': '+1-555-5432',
            parentEmail: 'bob.smith@example.com'
        }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 10 },
        { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Generate and download
    XLSX.writeFile(wb, 'student_bulk_upload_template.xlsx');
    showToast('Template downloaded successfully!', 'success');
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

            if (jsonData.length === 0) {
                showToast('Excel file is empty', 'error');
                return;
            }

            processExcelData(jsonData);
        } catch (error) {
            showToast('Error reading Excel file: ' + error.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);

    // Reset the file input
    event.target.value = '';
}

function processExcelData(rows) {
    const classes = db.getAll('classes');
    const classMap = {};
    classes.forEach(c => { classMap[c.id] = c; classMap[c.name] = c; });

    const results = {
        total: rows.length,
        success: 0,
        errors: [],
        duplicates: 0
    };

    const existingStudents = db.getAll('students');
    const existingEmails = new Set(existingStudents.map(s => s.email.toLowerCase()));

    // Show progress
    const progressContainer = document.getElementById('uploadProgressContainer');
    progressContainer.style.display = 'block';
    progressContainer.innerHTML = `
        <div class="upload-progress">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong><i class="fas fa-spinner fa-spin"></i> Processing...</strong>
                <span id="uploadProgressText">0 / ${rows.length}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" id="uploadProgressFill"></div>
            </div>
        </div>
    `;

    // Process each row
    setTimeout(() => {
        rows.forEach((row, index) => {
            const rowNum = index + 2; // +2 because row 1 is header
            const errors = [];

            // Map columns (strip * from names)
            const mapped = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.replace(/\*$/, '').trim();
                mapped[cleanKey] = row[key];
            });

            // Validate required fields
            const requiredFields = ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender', 'classId', 'parentName', 'parentPhone'];
            requiredFields.forEach(field => {
                if (!mapped[field] || mapped[field].toString().trim() === '') {
                    errors.push(`${field} is required`);
                }
            });

            if (errors.length > 0) {
                results.errors.push({ row: rowNum, errors: errors.join('; ') });
                updateProgress(results, rows.length);
                return;
            }

            // Validate email format
            if (!Validator.isEmail(mapped.email)) {
                results.errors.push({ row: rowNum, errors: 'Invalid email format' });
                updateProgress(results, rows.length);
                return;
            }

            // Check duplicate email
            const emailLower = mapped.email.toLowerCase().trim();
            if (existingEmails.has(emailLower)) {
                results.duplicates++;
                results.errors.push({ row: rowNum, errors: 'Email already exists: ' + mapped.email });
                updateProgress(results, rows.length);
                return;
            }

            // Validate gender
            const gender = mapped.gender.toLowerCase().trim();
            if (gender !== 'male' && gender !== 'female') {
                results.errors.push({ row: rowNum, errors: 'Gender must be "male" or "female"' });
                updateProgress(results, rows.length);
                return;
            }

            // Resolve classId: can be ID or class name
            let classId = mapped.classId.trim();
            if (classMap[classId]) {
                classId = classMap[classId].id;
            }

            // Validate date format
            if (isNaN(Date.parse(mapped.dateOfBirth))) {
                results.errors.push({ row: rowNum, errors: 'Invalid date format for dateOfBirth' });
                updateProgress(results, rows.length);
                return;
            }

            // Create student data
            const studentData = {
                firstName: mapped.firstName.trim(),
                lastName: mapped.lastName.trim(),
                email: emailLower,
                phone: mapped.phone ? mapped.phone.toString().trim() : '',
                dateOfBirth: mapped.dateOfBirth.toString().trim(),
                gender: gender,
                address: mapped.address ? mapped.address.toString().trim() : '',
                bloodGroup: mapped.bloodGroup ? mapped.bloodGroup.toString().trim().toUpperCase() : '',
                classId: classId,
                parentName: mapped.parentName.trim(),
                parentPhone: mapped.parentPhone.toString().trim(),
                parentEmail: mapped.parentEmail ? mapped.parentEmail.toString().trim().toLowerCase() : '',
                status: 'active',
                enrollmentDate: new Date().toISOString().split('T')[0]
            };

            // Validate with existing validator
            const validation = Validator.validateStudent(studentData);
            if (!validation.valid) {
                results.errors.push({ row: rowNum, errors: validation.errors.join('; ') });
                updateProgress(results, rows.length);
                return;
            }

            // Check if class exists
            if (!classMap[classId]) {
                results.errors.push({ row: rowNum, errors: 'Invalid class ID: ' + classId });
                updateProgress(results, rows.length);
                return;
            }

            // Add student
            const sanitized = security.sanitizeObject(studentData);
            db.add('students', sanitized);
            existingEmails.add(emailLower);

            // Update class student count
            const cls = classMap[classId];
            if (cls) {
                db.update('classes', cls.id, { studentCount: (cls.studentCount || 0) + 1 });
            }

            results.success++;
            updateProgress(results, rows.length);
        });

        // Show final results
        setTimeout(() => showUploadResults(results), 500);
    }, 100);
}

function updateProgress(results, total) {
    const processed = results.success + results.errors.length;
    const percent = Math.round((processed / total) * 100);

    const progressFill = document.getElementById('uploadProgressFill');
    const progressText = document.getElementById('uploadProgressText');
    
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressText) progressText.textContent = `${processed} / ${total}`;
}

function showUploadResults(results) {
    const progressContainer = document.getElementById('uploadProgressContainer');
    
    let errorHtml = '';
    if (results.errors.length > 0) {
        errorHtml = `
            <div class="upload-errors">
                <h4 style="color:var(--danger);margin-bottom:8px;">
                    <i class="fas fa-exclamation-circle"></i> Errors (${results.errors.length})
                </h4>
                ${results.errors.map(e => `
                    <div class="upload-error-item">
                        <span class="row-number">Row ${e.row}:</span> ${sanitize(e.errors)}
                    </div>
                `).join('')}
            </div>
        `;
    }

    progressContainer.innerHTML = `
        <div class="upload-progress">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <strong><i class="fas fa-check-circle" style="color:var(--success);"></i> Upload Complete</strong>
            </div>
            <div class="upload-stats">
                <div class="upload-stat">
                    <div class="stat-number" style="color:var(--primary);">${results.total}</div>
                    <div class="stat-label">Total Rows</div>
                </div>
                <div class="upload-stat">
                    <div class="stat-number" style="color:var(--success);">${results.success}</div>
                    <div class="stat-label">Imported</div>
                </div>
                <div class="upload-stat">
                    <div class="stat-number" style="color:${results.errors.length > 0 ? 'var(--danger)' : 'var(--gray-500)'};">${results.errors.length}</div>
                    <div class="stat-label">Errors</div>
                </div>
            </div>
            ${errorHtml}
            <div class="form-actions" style="margin-top:20px;">
                <button type="button" class="btn btn-primary" onclick="closeModal(); renderStudents();">
                    <i class="fas fa-check"></i> Done
                </button>
            </div>
        </div>
    `;

    if (results.success > 0) {
        showToast(`${results.success} student(s) imported successfully!`, 'success');
    }
    if (results.errors.length > 0) {
        showToast(`${results.errors.length} row(s) had errors. Check the upload details.`, 'warning');
    }
}

function showEditStudentModal(id) {
    const student = db.getById('students', id);
    if (!student) return;
    const classes = db.getAll('classes');
    
    openModal('Edit Student', `
        <form id="studentForm" onsubmit="updateStudent(event, '${id}')">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="firstName" value="${sanitize(student.firstName)}" required minlength="2">
                </div>
                <div class="form-group">
                    <label>Last Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="lastName" value="${sanitize(student.lastName)}" required minlength="2">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" class="form-control" id="email" value="${sanitize(student.email)}" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" class="form-control" id="phone" value="${sanitize(student.phone || '')}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth <span class="required">*</span></label>
                    <input type="date" class="form-control" id="dateOfBirth" value="${student.dateOfBirth}" required>
                </div>
                <div class="form-group">
                    <label>Gender <span class="required">*</span></label>
                    <select class="form-control" id="gender" required>
                        <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Female</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea class="form-control" id="address" rows="2">${sanitize(student.address || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Blood Group</label>
                <select class="form-control" id="bloodGroup">
                    <option value="">Select Blood Group</option>
                    ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => 
                        `<option value="${bg}" ${student.bloodGroup === bg ? 'selected' : ''}>${bg}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Class <span class="required">*</span></label>
                <select class="form-control" id="classId" required>
                    ${classes.map(c => `<option value="${c.id}" ${student.classId === c.id ? 'selected' : ''}>${sanitize(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Parent Name <span class="required">*</span></label>
                    <input type="text" class="form-control" id="parentName" value="${sanitize(student.parentName || '')}" required>
                </div>
                <div class="form-group">
                    <label>Parent Phone <span class="required">*</span></label>
                    <input type="text" class="form-control" id="parentPhone" value="${sanitize(student.parentPhone || '')}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Parent Email</label>
                <input type="email" class="form-control" id="parentEmail" value="${sanitize(student.parentEmail || '')}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="status">
                    <option value="active" ${student.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${student.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Student</button>
            </div>
        </form>
    `, 'modal-large');
}

function saveStudent(e) {
    e.preventDefault();
    const data = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value.trim(),
        bloodGroup: document.getElementById('bloodGroup').value,
        classId: document.getElementById('classId').value,
        parentName: document.getElementById('parentName').value.trim(),
        parentPhone: document.getElementById('parentPhone').value.trim(),
        parentEmail: document.getElementById('parentEmail').value.trim(),
        status: 'active',
        enrollmentDate: new Date().toISOString().split('T')[0]
    };

    const validation = Validator.validateStudent(data);
    if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
    }

    const sanitized = security.sanitizeObject(data);
    db.add('students', sanitized);
    
    // Update class student count
    const cls = db.getById('classes', data.classId);
    if (cls) {
        db.update('classes', cls.id, { studentCount: (cls.studentCount || 0) + 1 });
    }

    closeModal();
    renderStudents();
    showToast('Student added successfully!', 'success');
}

function updateStudent(e, id) {
    e.preventDefault();
    const data = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value.trim(),
        bloodGroup: document.getElementById('bloodGroup').value,
        classId: document.getElementById('classId').value,
        parentName: document.getElementById('parentName').value.trim(),
        parentPhone: document.getElementById('parentPhone').value.trim(),
        parentEmail: document.getElementById('parentEmail').value.trim(),
        status: document.getElementById('status').value
    };

    const sanitized = security.sanitizeObject(data);
    db.update('students', id, sanitized);
    closeModal();
    renderStudents();
    showToast('Student updated successfully!', 'success');
}

function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    
    const student = db.getById('students', id);
    db.delete('students', id);
    
    // Update class count
    if (student) {
        const cls = db.getById('classes', student.classId);
        if (cls) {
            db.update('classes', cls.id, { studentCount: Math.max(0, (cls.studentCount || 1) - 1) });
        }
    }
    
    renderStudents();
    showToast('Student deleted successfully', 'success');
}

function showStudentDetail(id) {
    const student = db.getById('students', id);
    if (!student) return;
    const cls = db.getById('classes', student.classId);
    const grades = db.query('grades', g => g.studentId === id);
    const attendance = db.query('attendance', a => a.studentId === id);
    const fees = db.query('fees', f => f.studentId === id);
    
    const avgGrade = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.totalMarks * 100), 0) / grades.length) : 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

    openModal(`Student Details: ${sanitize(student.firstName + ' ' + student.lastName)}`, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
                <h4 style="margin-bottom:12px;color:var(--primary);">Personal Information</h4>
                <table class="details-table">
                    <tr><td><strong>Name:</strong></td><td>${sanitize(student.firstName + ' ' + student.lastName)}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${sanitize(student.email)}</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${sanitize(student.phone || 'N/A')}</td></tr>
                    <tr><td><strong>DOB:</strong></td><td>${student.dateOfBirth}</td></tr>
                    <tr><td><strong>Gender:</strong></td><td>${sanitize(student.gender)}</td></tr>
                    <tr><td><strong>Blood Group:</strong></td><td>${student.bloodGroup || 'N/A'}</td></tr>
                    <tr><td><strong>Address:</strong></td><td>${sanitize(student.address || 'N/A')}</td></tr>
                </table>
            </div>
            <div>
                <h4 style="margin-bottom:12px;color:var(--primary);">Academic & Parent Info</h4>
                <table class="details-table">
                    <tr><td><strong>Class:</strong></td><td>${sanitize(cls ? cls.name : 'Not Assigned')}</td></tr>
                    <tr><td><strong>Enrollment:</strong></td><td>${student.enrollmentDate}</td></tr>
                    <tr><td><strong>Avg. Grade:</strong></td><td><span class="badge ${avgGrade >= 80 ? 'badge-success' : avgGrade >= 60 ? 'badge-primary' : avgGrade >= 40 ? 'badge-warning' : 'badge-danger'}">${avgGrade}%</span></td></tr>
                    <tr><td><strong>Attendance:</strong></td><td><span class="badge ${attendanceRate >= 75 ? 'badge-success' : attendanceRate >= 50 ? 'badge-warning' : 'badge-danger'}">${attendanceRate}%</span></td></tr>
                    <tr><td><strong>Parent:</strong></td><td>${sanitize(student.parentName || 'N/A')}</td></tr>
                    <tr><td><strong>Parent Phone:</strong></td><td>${sanitize(student.parentPhone || 'N/A')}</td></tr>
                    <tr><td><strong>Parent Email:</strong></td><td>${sanitize(student.parentEmail || 'N/A')}</td></tr>
                </table>
            </div>
        </div>
        <h4 style="margin-top:20px;margin-bottom:12px;color:var(--primary);">Recent Grades</h4>
        <div class="table-container">
            <table>
                <thead><tr><th>Subject</th><th>Exam</th><th>Score</th><th>Grade</th></tr></thead>
                <tbody>
                    ${grades.length > 0 ? grades.slice(0, 5).map(g => `
                        <tr><td>${sanitize(g.subject)}</td><td>${sanitize(g.examType)}</td><td>${g.score}/${g.totalMarks}</td><td><span class="badge badge-primary">${sanitize(g.grade)}</span></td></tr>
                    `).join('') : '<tr><td colspan="4" class="text-center">No grades recorded</td></tr>'}
                </tbody>
            </table>
        </div>
        <h4 style="margin-top:20px;margin-bottom:12px;color:var(--primary);">Fee Status</h4>
        <div class="table-container">
            <table>
                <thead><tr><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${fees.length > 0 ? fees.map(f => `
                        <tr><td>${sanitize(f.type)}</td><td>$${f.amount}</td><td>${f.dueDate}</td><td><span class="badge ${f.status === 'paid' ? 'badge-success' : f.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${sanitize(f.status)}</span></td></tr>
                    `).join('') : '<tr><td colspan="4" class="text-center">No fees recorded</td></tr>'}
                </tbody>
            </table>
        </div>
    `, 'modal-large');
}