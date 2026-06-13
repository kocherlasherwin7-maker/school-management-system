/**
 * Library Management Module
 */

function renderLibrary() {
    const books = db.getAll('library');
    const categories = [...new Set(books.map(b => b.category))];

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-field">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchBooks" placeholder="Search by title or author..." onkeyup="filterBooks()">
                </div>
                <select class="form-control" id="bookCategoryFilter" onchange="filterBooks()" style="width:auto;min-width:140px;">
                    <option value="">All Categories</option>
                    ${categories.map(c => `<option value="${c}">${sanitize(c)}</option>`).join('')}
                </select>
                <select class="form-control" id="bookStatusFilter" onchange="filterBooks()" style="width:auto;min-width:120px;">
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="issued">Issued</option>
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'library') ? `
                <button class="btn btn-primary" onclick="showAddBookModal()">
                    <i class="fas fa-plus"></i> Add Book
                </button>
                <button class="btn btn-success" onclick="showIssueBookModal()">
                    <i class="fas fa-book-open"></i> Issue Book
                </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fas fa-book"></i> Library Collection</h2>
                <span class="badge badge-primary">${books.length} Books (${books.filter(b => b.status === 'available').reduce((s, b) => s + b.availableCopies, 0)} Available)</span>
            </div>
            <div class="card-body" id="libraryGrid">
                ${renderBookGrid(books)}
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function renderBookGrid(books) {
    if (books.length === 0) {
        return `<div class="empty-state"><i class="fas fa-book"></i><h3>No books in the library</h3></div>`;
    }

    return `
        <div class="book-grid">
            ${books.map(b => `
                <div class="book-card" onclick="showBookDetail('${b.id}')">
                    <div class="book-icon"><i class="fas fa-book"></i></div>
                    <div class="book-title">${sanitize(b.title)}</div>
                    <div class="book-author">${sanitize(b.author)}</div>
                    <div style="margin-bottom:8px;">
                        <span class="badge badge-secondary">${sanitize(b.category)}</span>
                    </div>
                    <div>
                        <span class="badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'} book-status">
                            ${b.availableCopies > 0 ? b.availableCopies + ' Available' : 'All Issued'}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function filterBooks() {
    const search = document.getElementById('searchBooks').value.toLowerCase();
    const category = document.getElementById('bookCategoryFilter').value;
    const status = document.getElementById('bookStatusFilter').value;
    let books = db.getAll('library');

    if (search) {
        books = books.filter(b => 
            b.title.toLowerCase().includes(search) || 
            b.author.toLowerCase().includes(search)
        );
    }
    if (category) books = books.filter(b => b.category === category);
    if (status === 'available') books = books.filter(b => b.availableCopies > 0);
    if (status === 'issued') books = books.filter(b => b.availableCopies === 0);

    document.getElementById('libraryGrid').innerHTML = renderBookGrid(books);
}

function showAddBookModal() {
    openModal('Add New Book', `
        <form id="bookForm" onsubmit="saveBook(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>Title <span class="required">*</span></label>
                    <input type="text" class="form-control" id="title" required>
                </div>
                <div class="form-group">
                    <label>Author <span class="required">*</span></label>
                    <input type="text" class="form-control" id="author" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>ISBN <span class="required">*</span></label>
                    <input type="text" class="form-control" id="isbn" required>
                </div>
                <div class="form-group">
                    <label>Category <span class="required">*</span></label>
                    <select class="form-control" id="category" required>
                        <option value="">Select Category</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="History">History</option>
                        <option value="Literature">Literature</option>
                        <option value="Reference">Reference</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Publisher</label>
                    <input type="text" class="form-control" id="publisher">
                </div>
                <div class="form-group">
                    <label>Publish Year</label>
                    <input type="number" class="form-control" id="publishYear" min="1800" max="2099">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Total Copies <span class="required">*</span></label>
                    <input type="number" class="form-control" id="totalCopies" value="1" min="1" required>
                </div>
                <div class="form-group">
                    <label>Shelf Location</label>
                    <input type="text" class="form-control" id="shelf" placeholder="e.g., A1-01">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Book</button>
            </div>
        </form>
    `);
}

function saveBook(e) {
    e.preventDefault();
    const totalCopies = parseInt(document.getElementById('totalCopies').value) || 1;
    const data = {
        title: document.getElementById('title').value.trim(),
        author: document.getElementById('author').value.trim(),
        isbn: document.getElementById('isbn').value.trim(),
        category: document.getElementById('category').value,
        publisher: document.getElementById('publisher').value.trim(),
        publishYear: parseInt(document.getElementById('publishYear').value) || null,
        totalCopies,
        availableCopies: totalCopies,
        shelf: document.getElementById('shelf').value.trim(),
        status: 'available'
    };

    const validation = Validator.validateLibraryBook(data);
    if (!validation.valid) { showToast(validation.errors[0], 'error'); return; }

    db.add('library', security.sanitizeObject(data));
    closeModal();
    renderLibrary();
    showToast('Book added to library!', 'success');
}

function showBookDetail(id) {
    const book = db.getById('library', id);
    if (!book) return;
    const issues = db.query('bookIssues', i => i.bookId === id);
    const students = db.getAll('students');

    openModal(`Book Details: ${sanitize(book.title)}`, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><strong>Title:</strong> ${sanitize(book.title)}</div>
            <div><strong>Author:</strong> ${sanitize(book.author)}</div>
            <div><strong>ISBN:</strong> ${sanitize(book.isbn)}</div>
            <div><strong>Category:</strong> ${sanitize(book.category)}</div>
            <div><strong>Publisher:</strong> ${sanitize(book.publisher || 'N/A')}</div>
            <div><strong>Year:</strong> ${book.publishYear || 'N/A'}</div>
            <div><strong>Shelf:</strong> ${sanitize(book.shelf || 'N/A')}</div>
            <div><strong>Total Copies:</strong> ${book.totalCopies}</div>
            <div><strong>Available:</strong> <span class="badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}">${book.availableCopies}</span></div>
        </div>
        <h4 style="margin-top:16px;color:var(--primary);">Issue History</h4>
        <div class="table-container">
            <table>
                <thead><tr><th>Student</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${issues.length > 0 ? issues.map(i => {
                        const student = students.find(s => s.id === i.studentId);
                        return `<tr>
                            <td>${sanitize(student ? student.firstName + ' ' + student.lastName : 'Unknown')}</td>
                            <td>${i.issueDate}</td>
                            <td>${i.dueDate}</td>
                            <td>${i.returnDate || '-'}</td>
                            <td><span class="badge ${i.returnDate ? 'badge-success' : 'badge-warning'}">${i.returnDate ? 'Returned' : 'Issued'}</span></td>
                        </tr>`;
                    }).join('') : '<tr><td colspan="5" class="text-center">No issues recorded</td></tr>'}
                </tbody>
            </table>
        </div>
    `, 'modal-large');
}

function showIssueBookModal() {
    const books = db.getAll('library').filter(b => b.availableCopies > 0);
    const students = db.getAll('students');
    
    if (books.length === 0) {
        showToast('No books available to issue', 'warning');
        return;
    }

    openModal('Issue Book', `
        <form id="issueForm" onsubmit="issueBook(event)">
            <div class="form-group">
                <label>Book <span class="required">*</span></label>
                <select class="form-control" id="issueBookId" required>
                    <option value="">Select Book</option>
                    ${books.map(b => `<option value="${b.id}">${sanitize(b.title)} by ${sanitize(b.author)} (${b.availableCopies} available)</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Student <span class="required">*</span></label>
                <select class="form-control" id="issueStudentId" required>
                    <option value="">Select Student</option>
                    ${students.map(s => `<option value="${s.id}">${sanitize(s.firstName + ' ' + s.lastName)}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Issue Date</label>
                    <input type="date" class="form-control" id="issueDate" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Due Date <span class="required">*</span></label>
                    <input type="date" class="form-control" id="dueDate" required>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-success"><i class="fas fa-book-open"></i> Issue Book</button>
            </div>
        </form>
    `);
}

function issueBook(e) {
    e.preventDefault();
    const bookId = document.getElementById('issueBookId').value;
    const studentId = document.getElementById('issueStudentId').value;
    const issueDate = document.getElementById('issueDate').value;
    const dueDate = document.getElementById('dueDate').value;

    const book = db.getById('library', bookId);
    if (!book || book.availableCopies <= 0) {
        showToast('Book is not available', 'error');
        return;
    }

    // Create issue record
    db.add('bookIssues', {
        bookId,
        studentId,
        issueDate,
        dueDate,
        returnDate: null,
        status: 'issued'
    });

    // Update book availability
    db.update('library', bookId, {
        availableCopies: book.availableCopies - 1,
        status: book.availableCopies - 1 > 0 ? 'available' : 'issued'
    });

    closeModal();
    renderLibrary();
    showToast('Book issued successfully!', 'success');
}