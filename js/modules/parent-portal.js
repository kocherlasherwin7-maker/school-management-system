/**
 * Parent Portal Module
 * Parent dashboard, child monitor, fee payment, PTM requests, messaging, reports, health, transport, events
 */

function renderParentDashboard() {
    const user = security.currentUser;
    if (!user) return;
    const allStudents = db.getAll('students');
    const children = allStudents.filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    const classes = db.getAll('classes');
    const announcements = db.getAll('announcements');
    const upcomingEvents = db.getAll('events') || [];

    const content = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="font-size:24px;">Welcome, ${sanitize(user.name)}!</h2>
                <p style="color:var(--gray-500);">Parent Dashboard · ${children.length} child(ren) enrolled</p>
            </div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-primary" onclick="navigateTo('parentProfile')"><i class="fas fa-user"></i> My Profile</button>
                <button class="btn btn-secondary" onclick="navigateTo('parentFees')"><i class="fas fa-money-bill"></i> Fees</button>
            </div>
        </div>
        ${children.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-bottom:20px;">${children.map(child => {
            const cls = classes.find(c => c.id === child.classId);
            const grades = db.query('grades', g => g.studentId === child.id);
            const attendance = db.query('attendance', a => a.studentId === child.id);
            const avgGrade = grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / grades.length) : 0;
            const presentCount = attendance.filter(a => a.status === 'present').length;
            const attRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
            return `<div class="card"><div class="card-body"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:20px;color:white;font-weight:700;">${child.firstName.charAt(0)}${child.lastName.charAt(0)}</div><div><h4 style="font-size:16px;">${sanitize(child.firstName + ' ' + child.lastName)}</h4><p style="font-size:12px;color:var(--gray-500);">${sanitize(cls ? cls.name : 'N/A')}</p></div></div><div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;"><div class="stat-card" style="padding:12px;"><div class="stat-info"><h3 style="font-size:20px;">${avgGrade}%</h3><p style="font-size:11px;">Avg Grade</p></div></div><div class="stat-card" style="padding:12px;"><div class="stat-info"><h3 style="font-size:20px;">${attRate}%</h3><p style="font-size:11px;">Attendance</p></div></div></div><div style="display:flex;gap:8px;"><button class="btn btn-sm btn-primary" onclick="navigateTo('childDetail')" style="flex:1;" onclick="showChildDetail('${child.id}')"><i class="fas fa-eye"></i> View</button><button class="btn btn-sm btn-secondary" onclick="navigateTo('parentMessaging')" style="flex:1;"><i class="fas fa-envelope"></i> Message</button></div></div></div>`;
        }).join('')}</div>` : `<div class="card"><div class="card-body"><div class="empty-state"><i class="fas fa-child"></i><h3>No children linked to your account</h3><p>Contact the school admin to link your children</p></div></div></div>`}
        <div class="two-col-grid">
            <div class="card">
                <div class="card-header"><h2><i class="fas fa-bullhorn"></i> Announcements</h2><button class="btn btn-sm btn-primary" onclick="navigateTo('announcements')">View All</button></div>
                <div class="card-body">${announcements.length > 0 ? announcements.slice(0,4).map(a => `<div style="padding:10px 0;border-bottom:1px solid var(--gray-100);"><div style="display:flex;justify-content:space-between;"><strong style="font-size:14px;">${sanitize(a.title)}</strong><span class="badge ${a.priority === 'high' ? 'badge-danger' : 'badge-warning'}" style="font-size:10px;">${sanitize(a.priority)}</span></div><p style="font-size:12px;color:var(--gray-500);margin-top:4px;">${sanitize(a.date)}</p></div>`).join('') : `<div class="empty-state"><i class="fas fa-bullhorn"></i><h3>No announcements</h3></div>`}</div>
            </div>
            <div class="card">
                <div class="card-header"><h2><i class="fas fa-calendar"></i> Upcoming Events</h2><button class="btn btn-sm btn-primary" onclick="navigateTo('parentCalendar')">View All</button></div>
                <div class="card-body">${upcomingEvents.length > 0 ? upcomingEvents.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0,4).map(e => `<div style="padding:10px 0;border-bottom:1px solid var(--gray-100);"><div style="display:flex;justify-content:space-between;"><strong style="font-size:14px;">${sanitize(e.title)}</strong><span style="font-size:12px;color:var(--gray-500);">${e.date}</span></div><p style="font-size:12px;color:var(--gray-500);">${sanitize(e.description || '')}</p></div>`).join('') : `<div class="empty-state"><i class="fas fa-calendar"></i><h3>No upcoming events</h3></div>`}</div>
            </div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function showChildDetail(childId) {
    const child = db.getById('students', childId);
    if (!child) return;
    const cls = db.getById('classes', child.classId);
    const grades = db.query('grades', g => g.studentId === child.id);
    const attendance = db.query('attendance', a => a.studentId === child.id);
    const fees = db.query('fees', f => f.studentId === child.id);
    const avgGrade = grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / grades.length) : 0;
    const present = attendance.filter(a => a.status === 'present').length;
    const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
    const totalFee = fees.reduce((s,f) => s + f.amount, 0);
    const paidFee = fees.filter(f => f.status === 'paid').reduce((s,f) => s + f.paidAmount, 0);

    openModal(`${sanitize(child.firstName + ' ' + child.lastName)} - Details`, `
        <div class="two-col-grid">
            <div>
                <h4 style="color:var(--primary);margin-bottom:12px;">Personal Info</h4>
                <table class="details-table">
                    <tr><td><strong>Name:</strong></td><td>${sanitize(child.firstName + ' ' + child.lastName)}</td></tr>
                    <tr><td><strong>Class:</strong></td><td>${sanitize(cls ? cls.name : 'N/A')}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${sanitize(child.email)}</td></tr>
                    <tr><td><strong>DOB:</strong></td><td>${child.dateOfBirth}</td></tr>
                    <tr><td><strong>Gender:</strong></td><td>${sanitize(child.gender)}</td></tr>
                    <tr><td><strong>Blood Group:</strong></td><td>${child.bloodGroup || 'N/A'}</td></tr>
                </table>
            </div>
            <div>
                <h4 style="color:var(--primary);margin-bottom:12px;">Academic Summary</h4>
                <table class="details-table">
                    <tr><td><strong>Avg. Grade:</strong></td><td><span class="badge ${avgGrade >= 80 ? 'badge-success' : avgGrade >= 60 ? 'badge-primary' : avgGrade >= 40 ? 'badge-warning' : 'badge-danger'}">${avgGrade}%</span></td></tr>
                    <tr><td><strong>Attendance:</strong></td><td><span class="badge ${attRate >= 75 ? 'badge-success' : attRate >= 50 ? 'badge-warning' : 'badge-danger'}">${attRate}%</span></td></tr>
                    <tr><td><strong>Present Days:</strong></td><td>${present} / ${attendance.length}</td></tr>
                    <tr><td><strong>Fees Paid:</strong></td><td>$${paidFee} / $${totalFee}</td></tr>
                    <tr><td><strong>Enrolled:</strong></td><td>${child.enrollmentDate}</td></tr>
                </table>
            </div>
        </div>
        <h4 style="color:var(--primary);margin-top:20px;margin-bottom:12px;">Recent Grades</h4>
        <div class="table-container"><table><thead><tr><th>Subject</th><th>Score</th><th>Grade</th></tr></thead><tbody>${grades.length > 0 ? grades.slice(0,5).map(g => `<tr><td>${sanitize(g.subject)}</td><td>${g.score}/${g.totalMarks}</td><td><span class="badge ${g.grade.startsWith('A') ? 'badge-success' : g.grade.startsWith('B') ? 'badge-primary' : 'badge-warning'}">${sanitize(g.grade)}</span></td></tr>`).join('') : '<tr><td colspan="3" class="text-center">No grades</td></tr>'}</tbody></table></div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();navigateTo('parentMessaging')"><i class="fas fa-envelope"></i> Contact Teacher</button></div>
    `, 'modal-large');
}

function renderParentProfile() {
    const user = security.currentUser;
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('parentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="card"><div class="card-header"><h2><i class="fas fa-user"></i> My Profile</h2></div><div class="card-body">
            <form id="parentProfileForm" onsubmit="updateParentProfile(event)">
                <div class="form-row">
                    <div class="form-group"><label>Full Name</label><input type="text" class="form-control" id="parentName" value="${sanitize(user.name)}" required></div>
                    <div class="form-group"><label>Email</label><input type="email" class="form-control" value="${sanitize(user.email)}" disabled style="background:var(--gray-100);"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Phone</label><input type="text" class="form-control" id="parentPhone" value="${sanitize(user.phone || '')}"></div>
                    <div class="form-group"><label>Address</label><input type="text" class="form-control" id="parentAddress" value="${sanitize(user.address || '')}"></div>
                </div>
                <h4 style="margin:16px 0 12px;color:var(--primary);">Change Password</h4>
                <div class="form-row">
                    <div class="form-group"><label>Current Password</label><input type="password" class="form-control" id="parentCurrentPwd"></div>
                    <div class="form-group"><label>New Password</label><input type="password" class="form-control" id="parentNewPwd" minlength="6"></div>
                </div>
                <div class="form-actions"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update</button></div>
            </form>
        </div></div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function updateParentProfile(e) {
    e.preventDefault();
    const user = security.currentUser;
    const name = document.getElementById('parentName').value.trim();
    const phone = document.getElementById('parentPhone').value.trim();
    const address = document.getElementById('parentAddress').value.trim();
    const updates = { name, phone, address };
    const currentPwd = document.getElementById('parentCurrentPwd').value;
    const newPwd = document.getElementById('parentNewPwd').value;
    if (currentPwd && newPwd) {
        const users = db.getAll('users');
        const userRecord = users.find(u => u.email === user.email);
        if (userRecord && userRecord.password === db.hashPassword(currentPwd)) { db.update('users', userRecord.id, { password: db.hashPassword(newPwd) }); showToast('Password changed!', 'success'); }
        else { showToast('Current password is incorrect', 'error'); return; }
    }
    db.update('users', user.id, security.sanitizeObject(updates));
    showToast('Profile updated!', 'success');
    renderParentProfile();
}

function renderParentFees() {
    const user = security.currentUser;
    const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    const allFees = [];
    children.forEach(c => { const f = db.query('fees', fee => fee.studentId === c.id); f.forEach(fee => allFees.push({ ...fee, studentName: c.firstName + ' ' + c.lastName })); });
    const totalFee = allFees.reduce((s,f) => s + f.amount, 0);
    const paidFee = allFees.filter(f => f.status === 'paid').reduce((s,f) => s + f.paidAmount, 0);
    const pendingFee = totalFee - paidFee;

    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('parentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="fee-summary">
            <div class="fee-card total"><div class="fee-amount">$${totalFee.toLocaleString()}</div><div class="fee-label">Total Fees</div></div>
            <div class="fee-card paid"><div class="fee-amount">$${paidFee.toLocaleString()}</div><div class="fee-label">Paid</div></div>
            <div class="fee-card pending"><div class="fee-amount">$${pendingFee.toLocaleString()}</div><div class="fee-label">Pending</div></div>
            <div class="fee-card overdue"><div class="fee-amount">${allFees.filter(f => f.status === 'overdue').length}</div><div class="fee-label">Overdue</div></div>
        </div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-receipt"></i> Fee Details</h2></div>
            <div class="card-body">${allFees.length > 0 ? `<div class="table-container"><table><thead><tr><th>Student</th><th>Type</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${allFees.map(f => `<tr><td>${sanitize(f.studentName)}</td><td>${sanitize(f.type)}</td><td>$${f.amount}</td><td>${f.dueDate}</td><td><span class="badge ${f.status === 'paid' ? 'badge-success' : f.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${sanitize(f.status)}</span></td><td>${f.status !== 'paid' ? `<button class="btn btn-sm btn-success" onclick="showPayFeeModal('${f.id}')"><i class="fas fa-credit-card"></i> Pay</button>` : '<span class="badge badge-success">Paid</span>'}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><i class="fas fa-money-bill"></i><h3>No fees recorded</h3></div>`}</div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function showPayFeeModal(feeId) {
    const fee = db.getById('fees', feeId);
    if (!fee) return;
    openModal('Pay Fee', `
        <form id="payFeeForm" onsubmit="payFee(event, '${feeId}')">
            <div class="form-group"><label>Amount Due</label><input type="text" class="form-control" value="$${fee.amount}" disabled></div>
            <div class="form-group"><label>Card Number <span class="required">*</span></label><input type="text" class="form-control" id="cardNumber" placeholder="1234 5678 9012 3456" required maxlength="19" oninput="formatCardNumber(this)"></div>
            <div class="form-row">
                <div class="form-group"><label>Expiry <span class="required">*</span></label><input type="text" class="form-control" id="cardExpiry" placeholder="MM/YY" required maxlength="5" oninput="formatCardExpiry(this)"></div>
                <div class="form-group"><label>CVV <span class="required">*</span></label><input type="text" class="form-control" id="cardCvv" placeholder="123" required maxlength="4"></div>
            </div>
            <div class="form-group"><label>Cardholder Name <span class="required">*</span></label><input type="text" class="form-control" id="cardName" required placeholder="Name on card"></div>
            <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-success"><i class="fas fa-lock"></i> Pay $${fee.amount}</button></div>
        </form>`);
}

function formatCardNumber(input) { input.value = input.value.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ').substring(0,19); }
function formatCardExpiry(input) { input.value = input.value.replace(/\D/g,'').replace(/(\d{2})(?=\d)/,'$1/').substring(0,5); }

function payFee(e, feeId) {
    e.preventDefault();
    const fee = db.getById('fees', feeId);
    if (!fee) return;
    db.update('fees', feeId, { status: 'paid', paidDate: new Date().toISOString().split('T')[0], paidAmount: fee.amount, paymentMethod: 'Online Card' });
    closeModal();
    renderParentFees();
    showToast('Payment successful! Receipt sent to your email.', 'success');
}

function renderParentMessaging() {
    const user = security.currentUser;
    const messages = (db.getAll('messages') || []).filter(m => m.sender === user.email || m.receiver === user.email);
    const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    const content = `
        <div style="margin-bottom:20px;">
            <button class="btn btn-secondary" onclick="navigateTo('parentDashboard')"><i class="fas fa-arrow-left"></i> Back</button>
            <button class="btn btn-primary" style="margin-left:8px;" onclick="showParentComposeModal()"><i class="fas fa-plus"></i> New Message</button>
            ${children.length > 0 ? `<button class="btn btn-success" style="margin-left:8px;" onclick="showRequestPTMModal()"><i class="fas fa-calendar"></i> Request PTM</button>` : ''}
        </div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-envelope"></i> Messages</h2></div>
            <div class="card-body">${messages.length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px;">${messages.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(m => {const isSent = m.sender === user.email; return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--gray-50);border-radius:var(--radius-sm);border-left:4px solid ${isSent ? 'var(--primary)' : 'var(--success)'};"><div><strong style="font-size:14px;">${sanitize(m.subject)}</strong><p style="font-size:12px;color:var(--gray-500);margin-top:2px;">${isSent ? 'To: ' + sanitize(m.receiver) : 'From: ' + sanitize(m.sender)} · ${sanitize(m.message.substring(0,60))}${m.message.length > 60 ? '...' : ''}</p><span style="font-size:11px;color:var(--gray-400);">${new Date(m.timestamp).toLocaleString()}</span></div><button class="btn btn-sm btn-secondary" onclick="showMessageDetail('${m.id}')"><i class="fas fa-eye"></i></button></div>`;}).join('')}</div>` : `<div class="empty-state"><i class="fas fa-envelope"></i><h3>No messages</h3></div>`}</div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function showParentComposeModal() {
    const user = security.currentUser;
    const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    const teachers = [];
    children.forEach(c => {
        const cls = db.getById('classes', c.classId);
        if (cls) { const t = db.getById('teachers', cls.teacherId); if (t) teachers.push(t); }
    });
    const admins = db.query('users', u => u.role === 'admin');
    const recipients = [...new Map([...teachers.map(t => [t.email, { value: t.email, label: t.firstName + ' ' + t.lastName + ' (Teacher)' }]), ...admins.map(a => [a.email, { value: a.email, label: a.name + ' (Admin)' }])]).values()];
    openModal('Compose Message', `<form id="parentComposeForm" onsubmit="sendParentMessage(event)"><div class="form-group"><label>To <span class="required">*</span></label><select class="form-control" id="parentMsgRecipient" required><option value="">Select Recipient</option>${recipients.map(r => `<option value="${r.value}">${sanitize(r.label)}</option>`).join('')}</select></div><div class="form-group"><label>Subject <span class="required">*</span></label><input type="text" class="form-control" id="parentMsgSubject" required placeholder="Enter subject"></div><div class="form-group"><label>Message <span class="required">*</span></label><textarea class="form-control" id="parentMsgBody" rows="5" required placeholder="Type your message here..."></textarea></div><div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Send</button></div></form>`);
}

function sendParentMessage(e) {
    e.preventDefault();
    const user = security.currentUser;
    const receiver = document.getElementById('parentMsgRecipient').value;
    const subject = document.getElementById('parentMsgSubject').value.trim();
    const body = document.getElementById('parentMsgBody').value.trim();
    const message = { id: 'msg_' + Date.now(), sender: user.email, receiver, subject, message: body, timestamp: new Date().toISOString(), read: false };
    const messages = db.getAll('messages') || [];
    messages.push(message);
    db.storage.set('messages', messages);
    closeModal(); renderParentMessaging(); showToast('Message sent!', 'success');
}

function showRequestPTMModal() {
    const user = security.currentUser;
    const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    openModal('Request Parent-Teacher Meeting', `<form id="ptmForm" onsubmit="submitPTMRequest(event)"><div class="form-group"><label>Child <span class="required">*</span></label><select class="form-control" id="ptmChild" required><option value="">Select Child</option>${children.map(c => `<option value="${c.id}">${sanitize(c.firstName + ' ' + c.lastName)}</option>`).join('')}</select></div><div class="form-group"><label>Preferred Date <span class="required">*</span></label><input type="date" class="form-control" id="ptmDate" required min="${new Date().toISOString().split('T')[0]}"></div><div class="form-group"><label>Preferred Time</label><input type="time" class="form-control" id="ptmTime" value="10:00"></div><div class="form-group"><label>Reason / Topics to Discuss</label><textarea class="form-control" id="ptmReason" rows="3" placeholder="What would you like to discuss?"></textarea></div><div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-calendar-check"></i> Submit Request</button></div></form>`);
}

function submitPTMRequest(e) {
    e.preventDefault();
    const user = security.currentUser;
    const childId = document.getElementById('ptmChild').value;
    const date = document.getElementById('ptmDate').value;
    const time = document.getElementById('ptmTime').value;
    const reason = document.getElementById('ptmReason').value.trim();
    const child = db.getById('students', childId);
    const ptmRequests = db.getAll('ptmRequests') || [];
    ptmRequests.push({ id: 'ptm_' + Date.now(), parentEmail: user.email, childId, childName: child ? child.firstName + ' ' + child.lastName : '', preferredDate: date, preferredTime: time, reason, status: 'pending', createdAt: new Date().toISOString() });
    db.storage.set('ptmRequests', ptmRequests);
    closeModal();
    showToast('PTM request submitted! The school will contact you.', 'success');
}

function renderParentCalendar() {
    const events = db.getAll('events') || [];
    const holidays = db.getAll('holidays') || [];
    const ptmRequests = db.getAll('ptmRequests') || [];
    const user = security.currentUser;
    const userPtms = ptmRequests.filter(p => p.parentEmail === user.email);
    const allEvents = [...events, ...holidays.map(h => ({ ...h, title: '🏖 ' + h.title, date: h.date })), ...userPtms.filter(p => p.status === 'approved').map(p => ({ title: '📅 PTM: ' + p.childName, date: p.preferredDate, description: 'Parent-Teacher Meeting' }))];
    allEvents.sort((a,b) => new Date(a.date) - new Date(b.date));
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('parentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-calendar"></i> School Calendar</h2></div>
            <div class="card-body">${allEvents.length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px;">${allEvents.slice(0,20).map(e => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--gray-50);border-radius:var(--radius-sm);border-left:4px solid var(--primary);"><div><strong style="font-size:14px;">${sanitize(e.title)}</strong>${e.description ? `<p style="font-size:12px;color:var(--gray-500);margin-top:2px;">${sanitize(e.description)}</p>` : ''}</div><span style="font-size:13px;color:var(--gray-500);font-weight:600;">${e.date}</span></div>`).join('')}</div>` : `<div class="empty-state"><i class="fas fa-calendar"></i><h3>No events</h3></div>`}</div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}

function renderParentHealth() {
    const user = security.currentUser;
    const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    const healthRecords = db.getAll('healthRecords') || [];
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('parentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        ${children.length > 0 ? children.map(child => {
            const records = healthRecords.filter(r => r.studentId === child.id);
            return `<div class="card" style="margin-bottom:20px;"><div class="card-header"><h2><i class="fas fa-heartbeat"></i> ${sanitize(child.firstName + ' ' + child.lastName)} - Health Records</h2></div><div class="card-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;"><div style="padding:16px;background:var(--gray-50);border-radius:var(--radius-sm);"><p style="font-size:13px;color:var(--gray-500);">Blood Group</p><p style="font-size:18px;font-weight:700;">${child.bloodGroup || 'N/A'}</p></div><div style="padding:16px;background:var(--gray-50);border-radius:var(--radius-sm);"><p style="font-size:13px;color:var(--gray-500);">Allergies / Notes</p><p style="font-size:18px;font-weight:700;">${child.healthNotes || 'None recorded'}</p></div></div>${records.length > 0 ? `<div class="table-container"><table><thead><tr><th>Date</th><th>Checkup Type</th><th>Notes</th></tr></thead><tbody>${records.map(r => `<tr><td>${r.date}</td><td>${sanitize(r.type)}</td><td>${sanitize(r.notes || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p style="color:var(--gray-500);">No health checkup records.</p>'}</div></div>`;
        }).join('') : `<div class="empty-state"><i class="fas fa-heartbeat"></i><h3>No health records</h3></div>`}`;
    document.getElementById('pageContent').innerHTML = content;
}

function renderParentTransport() {
    const user = security.currentUser;
    const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    const routes = db.getAll('transportRoutes') || [];
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('parentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        ${routes.length > 0 ? `<div class="card"><div class="card-header"><h2><i class="fas fa-bus"></i> Transport Routes</h2></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">${routes.map(r => `<div style="padding:16px;border:1px solid var(--gray-200);border-radius:var(--radius-sm);"><h4 style="font-size:16px;margin-bottom:8px;"><i class="fas fa-bus" style="color:var(--primary);"></i> ${sanitize(r.routeName)}</h4><p style="font-size:13px;color:var(--gray-500);">Driver: ${sanitize(r.driverName || 'N/A')}</p><p style="font-size:13px;color:var(--gray-500);">Contact: ${sanitize(r.driverPhone || 'N/A')}</p><p style="font-size:13px;color:var(--gray-500);">Stops: ${sanitize(r.stops || 'N/A')}</p><p style="font-size:13px;color:var(--gray-500);">Timing: ${r.pickupTime || 'N/A'} - ${r.dropTime || 'N/A'}</p></div>`).join('')}</div></div></div>` : `<div class="card"><div class="card-body"><div class="empty-state"><i class="fas fa-bus"></i><h3>No transport information available</h3></div></div></div>`}`;
    document.getElementById('pageContent').innerHTML = content;
}

function downloadChildReport(childId) {
    const child = db.getById('students', childId);
    if (!child) return;
    const cls = db.getById('classes', child.classId);
    const grades = db.query('grades', g => g.studentId === child.id);
    const attendance = db.query('attendance', a => a.studentId === child.id);
    const present = attendance.filter(a => a.status === 'present').length;
    const attRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
    const avg = grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.score/g.totalMarks*100), 0) / grades.length) : 0;
    
    // Create PDF-friendly format
    const reportHtml = `<html><head><title>Progress Report - ${child.firstName} ${child.lastName}</title>
    <style>body{font-family:Arial;padding:40px;color:#333;}.header{text-align:center;border-bottom:3px solid #4f46e5;padding-bottom:20px;margin-bottom:30px;}.header h1{color:#4f46e5;}.summary{display:flex;gap:20px;margin:20px 0;}.summary-item{flex:1;text-align:center;padding:20px;background:#f8fafc;border-radius:8px;}.summary-item .number{font-size:32px;font-weight:700;color:#4f46e5;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eee;}th{background:#f5f5f5;font-weight:600;}.grade-A{color:#10b981;}.grade-B{color:#3b82f6;}.grade-C{color:#f59e0b;}.grade-D,.grade-F{color:#ef4444;}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#999;}</style></head>
    <body><div class="header"><h1>St.Gaspar Vidyalaya</h1><p>Student Progress Report</p></div>
    <table><tr><td><strong>Student:</strong></td><td>${sanitize(child.firstName + ' ' + child.lastName)}</td><td><strong>Class:</strong></td><td>${sanitize(cls ? cls.name : 'N/A')}</td></tr>
    <tr><td><strong>Email:</strong></td><td>${sanitize(child.email)}</td><td><strong>Enrollment:</strong></td><td>${child.enrollmentDate}</td></tr></table>
    <div class="summary"><div class="summary-item"><div class="number">${avg}%</div><div class="label">Avg Grade</div></div><div class="summary-item"><div class="number">${attRate}%</div><div class="label">Attendance</div></div><div class="summary-item"><div class="number">${grades.length}</div><div class="label">Assessments</div></div></div>
    ${grades.length > 0 ? `<table><thead><tr><th>Subject</th><th>Exam</th><th>Score</th><th>Grade</th></tr></thead><tbody>${grades.map(g => `<tr><td>${sanitize(g.subject)}</td><td>${sanitize(g.examType)}</td><td>${g.score}/${g.totalMarks}</td><td class="grade-${g.grade.charAt(0)}">${sanitize(g.grade)}</td></tr>`).join('')}</tbody></table>` : ''}
    <div class="footer"><p>Generated on ${new Date().toLocaleDateString()} · St.Gaspar Vidyalaya</p></div></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(reportHtml);
    win.document.close();
    showToast('Report opened. Use Ctrl+P to save as PDF.', 'success');
}

function renderParentReports() {
    const user = security.currentUser;
    const children = db.getAll('students').filter(s => s.parentEmail === user.email || s.parentPhone === user.email);
    const content = `
        <div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigateTo('parentDashboard')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="card">
            <div class="card-header"><h2><i class="fas fa-download"></i> Download Reports</h2></div>
            <div class="card-body"><div class="empty-state"><i class="fas fa-file-pdf"></i><h3>Download Progress Reports</h3></div>
            ${children.length > 0 ? `<div style="display:flex;flex-direction:column;gap:12px;">${children.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border:1px solid var(--gray-200);border-radius:var(--radius-sm);"><div><h4 style="font-size:16px;">${sanitize(c.firstName + ' ' + c.lastName)}</h4><p style="font-size:13px;color:var(--gray-500);">${sanitize(c.email)}</p></div><button class="btn btn-primary" onclick="downloadChildReport('${c.id}')"><i class="fas fa-download"></i> Download Report</button></div>`).join('')}</div>` : '<p>No children linked.</p>'}</div>
        </div>`;
    document.getElementById('pageContent').innerHTML = content;
}