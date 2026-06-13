/**
 * Fee Management Module
 */

function renderFees() {
    const fees = db.getAll('fees');
    const students = db.getAll('students');

    const totalFees = fees.reduce((s, f) => s + f.amount, 0);
    const collectedFees = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.paidAmount, 0);
    const pendingFees = fees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0);

    const content = `
        <div class="fee-summary">
            <div class="fee-card total"><div class="fee-amount">$${totalFees.toLocaleString()}</div><div class="fee-label">Total Fees</div></div>
            <div class="fee-card paid"><div class="fee-amount">$${collectedFees.toLocaleString()}</div><div class="fee-label">Collected</div></div>
            <div class="fee-card pending"><div class="fee-amount">$${pendingFees.toLocaleString()}</div><div class="fee-label">Pending</div></div>
            <div class="fee-card overdue"><div class="fee-amount">${fees.filter(f => f.status === 'overdue').length}</div><div class="fee-label">Overdue Accounts</div></div>
        </div>

        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-field">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchFees" placeholder="Search by student..." onkeyup="filterFees()">
                </div>
                <select class="form-control" id="feeStatusFilter" onchange="filterFees()" style="width:auto;min-width:120px;">
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'fees') ? `
                <button class="btn btn-primary" onclick="showAddFeeModal()">
                    <i class="fas fa-plus"></i> Add Fee
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h2><i class="fas fa-money-bill-wave"></i> Fee Records</h2></div>
            <div class="card-body">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Fee Type</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Paid Date</th>
                                <th>Paid Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="feesTableBody">
                            ${renderFeeRows(fees, students)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderFeeRows(fees, students) {
    if (fees.length === 0) {
        return `<tr><td colspan="8" class="text-center"><div class="empty-state"><i class="fas fa-money-bill-wave"></i><h3>No fee records</h3></div></td></tr>`;
    }

    return fees.map(f => {
        const student = students.find(s => s.id === f.studentId);
        return `
        <tr>
            <td><strong>${sanitize(student ? student.firstName + ' ' + student.lastName : 'Unknown')}</strong></td>
            <td>${sanitize(f.type)}</td>
            <td>$${f.amount.toLocaleString()}</td>
            <td>${f.dueDate}</td>
            <td><span class="badge ${f.status === 'paid' ? 'badge-success' : f.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${sanitize(f.status)}</span></td>
            <td>${f.paidDate || '-'}</td>
            <td>${f.paidAmount ? '$' + f.paidAmount.toLocaleString() : '-'}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    ${security.hasPermission('write', 'fees') ? `
                    <button class="btn btn-sm btn-primary" onclick="showEditFeeModal('${f.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-success" onclick="recordPayment('${f.id}')" title="Record Payment"><i class="fas fa-check"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFee('${f.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function filterFees() {
    const search = document.getElementById('searchFees').value.toLowerCase();
    const statusFilter = document.getElementById('feeStatusFilter').value;
    let fees = db.getAll('fees');
    const students = db.getAll('students');

    if (search) {
        fees = fees.filter(f => {
            const s = students.find(st => st.id === f.studentId);
            return s && (s.firstName.toLowerCase().includes(search) || s.lastName.toLowerCase().includes(search));
        });
    }
    if (statusFilter) fees = fees.filter(f => f.status === statusFilter);

    document.getElementById('feesTableBody').innerHTML = renderFeeRows(fees, students);
}

function showAddFeeModal() {
    const students = db.getAll('students');
    openModal('Add Fee Record', `
        <form id="feeForm" onsubmit="saveFee(event)">
            <div class="form-group">
                <label>Student <span class="required">*</span></label>
                <select class="form-control" id="studentId" required>
                    <option value="">Select Student</option>
                    ${students.map(s => `<option value="${s.id}">${sanitize(s.firstName + ' ' + s.lastName)}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Fee Type <span class="required">*</span></label>
                    <select class="form-control" id="type" required>
                        <option value="">Select Type</option>
                        <option value="Tuition Fee">Tuition Fee</option>
                        <option value="Library Fee">Library Fee</option>
                        <option value="Laboratory Fee">Laboratory Fee</option>
                        <option value="Sports Fee">Sports Fee</option>
                        <option value="Transportation Fee">Transportation Fee</option>
                        <option value="Activity Fee">Activity Fee</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount ($) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="amount" min="1" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Due Date <span class="required">*</span></label>
                    <input type="date" class="form-control" id="dueDate" required>
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
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Fee</button>
            </div>
        </form>
    `);
}

function showEditFeeModal(id) {
    const fee = db.getById('fees', id);
    if (!fee) return;
    const students = db.getAll('students');

    openModal('Edit Fee Record', `
        <form id="feeForm" onsubmit="updateFee(event, '${id}')">
            <div class="form-group">
                <label>Student <span class="required">*</span></label>
                <select class="form-control" id="studentId" required>
                    ${students.map(s => `<option value="${s.id}" ${fee.studentId === s.id ? 'selected' : ''}>${sanitize(s.firstName + ' ' + s.lastName)}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Fee Type <span class="required">*</span></label>
                    <select class="form-control" id="type" required>
                        <option value="Tuition Fee" ${fee.type === 'Tuition Fee' ? 'selected' : ''}>Tuition Fee</option>
                        <option value="Library Fee" ${fee.type === 'Library Fee' ? 'selected' : ''}>Library Fee</option>
                        <option value="Laboratory Fee" ${fee.type === 'Laboratory Fee' ? 'selected' : ''}>Laboratory Fee</option>
                        <option value="Sports Fee" ${fee.type === 'Sports Fee' ? 'selected' : ''}>Sports Fee</option>
                        <option value="Transportation Fee" ${fee.type === 'Transportation Fee' ? 'selected' : ''}>Transportation Fee</option>
                        <option value="Activity Fee" ${fee.type === 'Activity Fee' ? 'selected' : ''}>Activity Fee</option>
                        <option value="Other" ${fee.type === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount ($) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="amount" value="${fee.amount}" min="1" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Due Date <span class="required">*</span></label>
                    <input type="date" class="form-control" id="dueDate" value="${fee.dueDate}" required>
                </div>
                <div class="form-group">
                    <label>Term</label>
                    <select class="form-control" id="term">
                        <option value="Term 1" ${fee.term === 'Term 1' ? 'selected' : ''}>Term 1</option>
                        <option value="Term 2" ${fee.term === 'Term 2' ? 'selected' : ''}>Term 2</option>
                        <option value="Term 3" ${fee.term === 'Term 3' ? 'selected' : ''}>Term 3</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="status">
                    <option value="pending" ${fee.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="paid" ${fee.status === 'paid' ? 'selected' : ''}>Paid</option>
                    <option value="overdue" ${fee.status === 'overdue' ? 'selected' : ''}>Overdue</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Fee</button>
            </div>
        </form>
    `);
}

function saveFee(e) {
    e.preventDefault();
    const data = {
        studentId: document.getElementById('studentId').value,
        type: document.getElementById('type').value,
        amount: parseFloat(document.getElementById('amount').value),
        dueDate: document.getElementById('dueDate').value,
        term: document.getElementById('term').value,
        year: new Date().getFullYear(),
        status: 'pending',
        paidDate: null,
        paidAmount: 0,
        paymentMethod: ''
    };

    const validation = Validator.validateFee(data);
    if (!validation.valid) { showToast(validation.errors[0], 'error'); return; }

    db.add('fees', security.sanitizeObject(data));
    closeModal();
    renderFees();
    showToast('Fee added successfully!', 'success');
}

function updateFee(e, id) {
    e.preventDefault();
    const data = {
        studentId: document.getElementById('studentId').value,
        type: document.getElementById('type').value,
        amount: parseFloat(document.getElementById('amount').value),
        dueDate: document.getElementById('dueDate').value,
        term: document.getElementById('term').value,
        status: document.getElementById('status').value
    };

    db.update('fees', id, security.sanitizeObject(data));
    closeModal();
    renderFees();
    showToast('Fee updated successfully!', 'success');
}

function recordPayment(id) {
    const fee = db.getById('fees', id);
    if (!fee) return;

    openModal('Record Payment', `
        <div style="margin-bottom:16px;">
            <p><strong>Amount Due:</strong> $${fee.amount.toLocaleString()}</p>
            <p><strong>Fee Type:</strong> ${sanitize(fee.type)}</p>
        </div>
        <form id="paymentForm" onsubmit="savePayment(event, '${id}')">
            <div class="form-group">
                <label>Paid Amount ($) <span class="required">*</span></label>
                <input type="number" class="form-control" id="paidAmount" value="${fee.amount}" min="1" max="${fee.amount}" required>
            </div>
            <div class="form-group">
                <label>Payment Method</label>
                <select class="form-control" id="paymentMethod">
                    <option value="Cash">Cash</option>
                    <option value="Online Transfer">Online Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-success"><i class="fas fa-check"></i> Confirm Payment</button>
            </div>
        </form>
    `);
}

function savePayment(e, id) {
    e.preventDefault();
    const paidAmount = parseFloat(document.getElementById('paidAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;

    db.update('fees', id, {
        status: 'paid',
        paidDate: new Date().toISOString().split('T')[0],
        paidAmount: paidAmount,
        paymentMethod: paymentMethod
    });

    closeModal();
    renderFees();
    showToast('Payment recorded successfully!', 'success');
}

function deleteFee(id) {
    if (!confirm('Delete this fee record?')) return;
    db.delete('fees', id);
    renderFees();
    showToast('Fee record deleted', 'success');
}