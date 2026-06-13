/**
 * Grades / Report Card Module
 */

function renderGrades() {
    const grades = db.getAll('grades');
    const students = db.getAll('students');
    const classes = db.getAll('classes');

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-field">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchGrades" placeholder="Search by student..." onkeyup="filterGrades()">
                </div>
                <select class="form-control" id="gradeClassFilter" onchange="filterGrades()" style="width:auto;min-width:150px;">
                    <option value="">All Classes</option>
                    ${classes.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('')}
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'grades') ? `
                <button class="btn btn-primary" onclick="showAddGradeModal()">
                    <i class="fas fa-plus"></i> Add Grade
                </button>
                <button class="btn btn-success" onclick="showReportCardModal()">
                    <i class="fas fa-file-alt"></i> Report Card
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-star"></i> Grades & Scores</h2><span class="badge badge-primary">${grades.length} Total</span></div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Subject</th>
                                <th>Exam Type</th>
                                <th>Score</th>
                                <th>Grade</th>
                                <th>Term</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="gradesTableBody">
                            ${renderGradeRows(grades, students, classes)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderGradeRows(grades, students, classes) {
    if (grades.length === 0) {
        return `<tr><td colspan="8" class="text-center"><div class="empty-state"><i class="fas fa-star"></i><h3>No grades recorded</h3></div></td></tr>`;
    }

    return grades.map(g => {
        const student = students.find(s => s.id === g.studentId);
        const cls = classes.find(c => c.id === g.classId);
        return `
        <tr>
            <td><strong>${sanitize(student ? student.firstName + ' ' + student.lastName : 'Unknown')}</strong></td>
            <td>${sanitize(cls ? cls.name : 'N/A')}</td>
            <td>${sanitize(g.subject)}</td>
            <td>${sanitize(g.examType)}</td>
            <td>${g.score}/${g.totalMarks}</td>
            <td><span class="badge ${g.grade.startsWith('A') ? 'badge-success' : g.grade.startsWith('B') ? 'badge-primary' : g.grade.startsWith('C') ? 'badge-warning' : 'badge-danger'}">${sanitize(g.grade)}</span></td>
            <td>${sanitize(g.term + ' ' + g.year)}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    ${security.hasPermission('write', 'grades') ? `
                    <button class="btn btn-sm btn-primary" onclick="showEditGradeModal('${g.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGrade('${g.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function filterGrades() {
    const search = document.getElementById('searchGrades').value.toLowerCase();
    const classFilter = document.getElementById('gradeClassFilter').value;
    
    let grades = db.getAll('grades');
    const students = db.getAll('students');
    const classes = db.getAll('classes');

    if (search) {
        grades = grades.filter(g => {
            const student = students.find(s => s.id === g.studentId);
            return student && (student.firstName.toLowerCase().includes(search) || student.lastName.toLowerCase().includes(search));
        });
    }
    if (classFilter) {
        grades = grades.filter(g => g.classId === classFilter);
    }

    document.getElementById('gradesTableBody').innerHTML = renderGradeRows(grades, students, classes);
}

function showAddGradeModal() {
    const students = db.getAll('students');
    const classes = db.getAll('classes');
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education', 'Art', 'Music'];

    openModal('Add New Grade', `
        <form id="gradeForm" onsubmit="saveGrade(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>Student <span class="required">*</span></label>
                    <select class="form-control" id="studentId" required>
                        <option value="">Select Student</option>
                        ${students.map(s => `<option value="${s.id}">${sanitize(s.firstName + ' ' + s.lastName)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Subject <span class="required">*</span></label>
                    <select class="form-control" id="subject" required>
                        <option value="">Select Subject</option>
                        ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Score <span class="required">*</span></label>
                    <input type="number" class="form-control" id="score" min="0" max="100" required>
                </div>
                <div class="form-group">
                    <label>Total Marks</label>
                    <input type="number" class="form-control" id="totalMarks" value="100" min="1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Exam Type <span class="required">*</span></label>
                    <select class="form-control" id="examType" required>
                        <option value="">Select Type</option>
                        <option value="Quiz">Quiz</option>
                        <option value="Midterm">Midterm</option>
                        <option value="Final">Final</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Project">Project</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Term</label>
                    <select class="form-control" id="term">
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Grade</button>
            </div>
        </form>
    `);
}

function showEditGradeModal(id) {
    const grade = db.getById('grades', id);
    if (!grade) return;
    const students = db.getAll('students');
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education', 'Art', 'Music'];

    openModal('Edit Grade', `
        <form id="gradeForm" onsubmit="updateGrade(event, '${id}')">
            <div class="form-row">
                <div class="form-group">
                    <label>Student <span class="required">*</span></label>
                    <select class="form-control" id="studentId" required>
                        ${students.map(s => `<option value="${s.id}" ${grade.studentId === s.id ? 'selected' : ''}>${sanitize(s.firstName + ' ' + s.lastName)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Subject <span class="required">*</span></label>
                    <select class="form-control" id="subject" required>
                        ${subjects.map(s => `<option value="${s}" ${grade.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Score <span class="required">*</span></label>
                    <input type="number" class="form-control" id="score" value="${grade.score}" min="0" max="100" required>
                </div>
                <div class="form-group">
                    <label>Total Marks</label>
                    <input type="number" class="form-control" id="totalMarks" value="${grade.totalMarks}" min="1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Exam Type <span class="required">*</span></label>
                    <select class="form-control" id="examType" required>
                        <option value="Quiz" ${grade.examType === 'Quiz' ? 'selected' : ''}>Quiz</option>
                        <option value="Midterm" ${grade.examType === 'Midterm' ? 'selected' : ''}>Midterm</option>
                        <option value="Final" ${grade.examType === 'Final' ? 'selected' : ''}>Final</option>
                        <option value="Assignment" ${grade.examType === 'Assignment' ? 'selected' : ''}>Assignment</option>
                        <option value="Project" ${grade.examType === 'Project' ? 'selected' : ''}>Project</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Term</label>
                    <select class="form-control" id="term">
                        <option value="Term 1" ${grade.term === 'Term 1' ? 'selected' : ''}>Term 1</option>
                        <option value="Term 2" ${grade.term === 'Term 2' ? 'selected' : ''}>Term 2</option>
                        <option value="Term 3" ${grade.term === 'Term 3' ? 'selected' : ''}>Term 3</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Grade</button>
            </div>
        </form>
    `);
}

function saveGrade(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const subject = document.getElementById('subject').value;
    const score = parseInt(document.getElementById('score').value);
    const totalMarks = parseInt(document.getElementById('totalMarks').value) || 100;
    const examType = document.getElementById('examType').value;
    const term = document.getElementById('term').value;

    const student = db.getById('students', studentId);
    if (!student) { showToast('Please select a valid student', 'error'); return; }

    const data = {
        studentId,
        subject,
        score,
        totalMarks,
        examType,
        term,
        classId: student.classId,
        year: new Date().getFullYear()
    };

    const validation = Validator.validateGrade(data);
    if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
    }

    data.grade = Validator.getGradeFromScore(score, totalMarks);
    const sanitized = security.sanitizeObject(data);
    db.add('grades', sanitized);
    closeModal();
    renderGrades();
    showToast('Grade added successfully!', 'success');
}

function updateGrade(e, id) {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const subject = document.getElementById('subject').value;
    const score = parseInt(document.getElementById('score').value);
    const totalMarks = parseInt(document.getElementById('totalMarks').value) || 100;
    const examType = document.getElementById('examType').value;
    const term = document.getElementById('term').value;
    const student = db.getById('students', studentId);

    const grade = Validator.getGradeFromScore(score, totalMarks);
    const sanitized = security.sanitizeObject({
        studentId, subject, score, totalMarks, examType, term,
        classId: student ? student.classId : '',
        year: new Date().getFullYear(), grade
    });

    db.update('grades', id, sanitized);
    closeModal();
    renderGrades();
    showToast('Grade updated successfully!', 'success');
}

function deleteGrade(id) {
    if (!confirm('Are you sure you want to delete this grade?')) return;
    db.delete('grades', id);
    renderGrades();
    showToast('Grade deleted', 'success');
}

function showReportCardModal() {
    const students = db.getAll('students');
    const classes = db.getAll('classes');
    
    openModal('Generate Report Card', `
        <form id="reportCardForm" onsubmit="generateReportCard(event)">
            <div class="form-group">
                <label>Student <span class="required">*</span></label>
                <select class="form-control" id="rcStudentId" required>
                    <option value="">Select Student</option>
                    ${students.map(s => `<option value="${s.id}">${sanitize(s.firstName + ' ' + s.lastName)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Term</label>
                <select class="form-control" id="rcTerm">
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-success"><i class="fas fa-file-alt"></i> Generate</button>
            </div>
        </form>
    `);
}

function generateReportCard(e) {
    e.preventDefault();
    const studentId = document.getElementById('rcStudentId').value;
    const term = document.getElementById('rcTerm').value;
    const student = db.getById('students', studentId);
    
    if (!student) { showToast('Please select a student', 'error'); return; }

    const grades = db.query('grades', g => g.studentId === studentId && g.term === term);
    const attendance = db.query('attendance', a => a.studentId === studentId);
    const cls = db.getById('classes', student.classId);
    
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
    const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
    const totalMax = grades.reduce((sum, g) => sum + g.totalMarks, 0);
    const avgPercentage = grades.length > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const overallGrade = Validator.getGradeFromScore(avgPercentage, 100);
    const gpa = grades.length > 0 ? (grades.reduce((sum, g) => sum + Validator.getGPAFromGrade(g.grade), 0) / grades.length).toFixed(2) : 0;

    closeModal();
    openModal(`Report Card: ${sanitize(student.firstName + ' ' + student.lastName)}`, `
        <div style="border:2px solid var(--primary);border-radius:12px;padding:24px;">
            <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px dashed var(--gray-200);">
                <h2 style="color:var(--primary);">EduManage Pro School</h2>
                <p style="color:var(--gray-500);">Academic Report Card - ${term} ${new Date().getFullYear()}</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
                <div><strong>Student:</strong> ${sanitize(student.firstName + ' ' + student.lastName)}</div>
                <div><strong>Class:</strong> ${sanitize(cls ? cls.name : 'N/A')}</div>
                <div><strong>Roll No:</strong> ${student.id.toUpperCase()}</div>
                <div><strong>Attendance:</strong> ${attendanceRate}%</div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead>
                    <tr style="background:var(--gray-100);">
                        <th style="padding:8px 12px;text-align:left;">Subject</th>
                        <th style="padding:8px 12px;text-align:center;">Score</th>
                        <th style="padding:8px 12px;text-align:center;">Grade</th>
                        <th style="padding:8px 12px;text-align:center;">GPA</th>
                    </tr>
                </thead>
                <tbody>
                    ${grades.length > 0 ? grades.map(g => `
                        <tr style="border-bottom:1px solid var(--gray-100);">
                            <td style="padding:8px 12px;">${sanitize(g.subject)}</td>
                            <td style="padding:8px 12px;text-align:center;">${g.score}/${g.totalMarks}</td>
                            <td style="padding:8px 12px;text-align:center;"><span class="badge badge-primary">${sanitize(g.grade)}</span></td>
                            <td style="padding:8px 12px;text-align:center;">${Validator.getGPAFromGrade(g.grade).toFixed(1)}</td>
                        </tr>
                    `).join('') : `<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--gray-500);">No grades recorded for this term</td></tr>`}
                </tbody>
            </table>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;padding-top:16px;border-top:2px dashed var(--gray-200);">
                <div><strong style="font-size:24px;color:var(--primary);">${avgPercentage}%</strong><br><span style="font-size:12px;color:var(--gray-500);">Average</span></div>
                <div><strong style="font-size:24px;color:var(--primary);">${overallGrade}</strong><br><span style="font-size:12px;color:var(--gray-500);">Grade</span></div>
                <div><strong style="font-size:24px;color:var(--primary);">${gpa}</strong><br><span style="font-size:12px;color:var(--gray-500);">GPA</span></div>
            </div>
        </div>
    `, 'modal-large');
}