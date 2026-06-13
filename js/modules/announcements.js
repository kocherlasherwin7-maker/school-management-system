/**
 * Announcements / Notices Module
 */

function renderAnnouncements() {
    const announcements = db.getAll('announcements');

    const content = `
        <div class="toolbar">
            <div class="toolbar-left">
                <select class="form-control" id="announceCategory" onchange="filterAnnouncements()" style="width:auto;min-width:140px;">
                    <option value="">All Categories</option>
                    <option value="holiday">Holiday</option>
                    <option value="event">Event</option>
                    <option value="exam">Exam</option>
                    <option value="general">General</option>
                </select>
                <select class="form-control" id="announcePriority" onchange="filterAnnouncements()" style="width:auto;min-width:120px;">
                    <option value="">All Priority</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                </select>
            </div>
            <div class="toolbar-right">
                ${security.hasPermission('write', 'announcements') ? `
                <button class="btn btn-primary" onclick="showAddAnnouncementModal()">
                    <i class="fas fa-plus"></i> New Announcement
                </button>` : ''}
            </div>
        </div>

        <div id="announcementsList">
            ${announcements.length > 0 ? announcements.map(a => `
                <div class="card announcement-card" style="border-left:4px solid ${a.priority === 'high' ? 'var(--danger)' : a.priority === 'normal' ? 'var(--warning)' : 'var(--success)'};">
                    <div class="card-body" style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div style="flex:1;">
                            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                                <h3 style="font-size:16px;">${sanitize(a.title)}</h3>
                                <span class="badge ${a.priority === 'high' ? 'badge-danger' : a.priority === 'normal' ? 'badge-warning' : 'badge-secondary'}">${sanitize(a.priority)}</span>
                                <span class="badge badge-info">${sanitize(a.category)}</span>
                            </div>
                            <p style="color:var(--gray-600);margin-bottom:8px;">${sanitize(a.content)}</p>
                            <div style="font-size:12px;color:var(--gray-400);">
                                <span><i class="fas fa-user"></i> ${sanitize(a.author)}</span>
                                <span style="margin-left:16px;"><i class="fas fa-calendar"></i> ${a.date}</span>
                            </div>
                        </div>
                        ${security.hasPermission('delete', 'announcements') ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('${a.id}')" style="flex-shrink:0;">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
            `).join('') : `
                <div class="empty-state"><i class="fas fa-bullhorn"></i><h3>No announcements</h3><p>Create the first announcement</p></div>
            `}
        </div>
    `;

    document.getElementById('pageContent').innerHTML = content;
}

function filterAnnouncements() {
    const category = document.getElementById('announceCategory').value;
    const priority = document.getElementById('announcePriority').value;
    let announcements = db.getAll('announcements');

    if (category) announcements = announcements.filter(a => a.category === category);
    if (priority) announcements = announcements.filter(a => a.priority === priority);

    const container = document.getElementById('announcementsList');
    if (announcements.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-bullhorn"></i><h3>No announcements found</h3></div>`;
        return;
    }

    container.innerHTML = announcements.map(a => `
        <div class="card" style="border-left:4px solid ${a.priority === 'high' ? 'var(--danger)' : a.priority === 'normal' ? 'var(--warning)' : 'var(--success)'};">
            <div class="card-body" style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div style="flex:1;">
                    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                        <h3 style="font-size:16px;">${sanitize(a.title)}</h3>
                        <span class="badge ${a.priority === 'high' ? 'badge-danger' : a.priority === 'normal' ? 'badge-warning' : 'badge-secondary'}">${sanitize(a.priority)}</span>
                        <span class="badge badge-info">${sanitize(a.category)}</span>
                    </div>
                    <p style="color:var(--gray-600);margin-bottom:8px;">${sanitize(a.content)}</p>
                    <div style="font-size:12px;color:var(--gray-400);">
                        <span><i class="fas fa-user"></i> ${sanitize(a.author)}</span>
                        <span style="margin-left:16px;"><i class="fas fa-calendar"></i> ${a.date}</span>
                    </div>
                </div>
                ${security.hasPermission('delete', 'announcements') ? `
                <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('${a.id}')" style="flex-shrink:0;">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

function showAddAnnouncementModal() {
    openModal('New Announcement', `
        <form id="announcementForm" onsubmit="saveAnnouncement(event)">
            <div class="form-group">
                <label>Title <span class="required">*</span></label>
                <input type="text" class="form-control" id="title" required>
            </div>
            <div class="form-group">
                <label>Content <span class="required">*</span></label>
                <textarea class="form-control" id="content" rows="4" required></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <select class="form-control" id="category">
                        <option value="general">General</option>
                        <option value="holiday">Holiday</option>
                        <option value="event">Event</option>
                        <option value="exam">Exam</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <select class="form-control" id="priority">
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Target Audience</label>
                <select class="form-control" id="targetRole">
                    <option value="all">All</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Teachers Only</option>
                    <option value="parent">Parents Only</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Post Announcement</button>
            </div>
        </form>
    `);
}

function saveAnnouncement(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('title').value.trim(),
        content: document.getElementById('content').value.trim(),
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        targetRole: document.getElementById('targetRole').value,
        author: security.currentUser?.name || 'Admin',
        date: new Date().toISOString().split('T')[0]
    };

    if (!data.title || data.title.length < 3) { showToast('Title must be at least 3 characters', 'error'); return; }
    if (!data.content) { showToast('Content is required', 'error'); return; }

    db.add('announcements', security.sanitizeObject(data));
    closeModal();
    renderAnnouncements();
    showToast('Announcement posted successfully!', 'success');
}

function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    db.delete('announcements', id);
    renderAnnouncements();
    showToast('Announcement deleted', 'success');
}