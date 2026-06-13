/**
 * Security Module
 * Implements input sanitization, XSS prevention, authentication, RBAC, and CSRF protection
 */

class SecurityManager {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this.csrfToken = this.generateCSRFToken();
        this.rateLimits = {};
        this.init();
    }

    init() {
        this.restoreSession();
    }

    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    getCSRFToken() {
        return this.csrfToken;
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '\\': '&#92;',
            '`': '&#96;'
        };
        return input.replace(/[&<>"'\/\\`]/g, char => map[char]);
    }

    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(item => 
                    typeof item === 'string' ? this.sanitizeInput(item) : this.sanitizeObject(item)
                );
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    authenticate(email, password) {
        const users = db.getAll('users');
        const hashedPassword = db.hashPassword(password);
        const user = users.find(u => u.email === email && u.password === hashedPassword);
        
        if (user) {
            this.currentUser = { ...user };
            delete this.currentUser.password;
            this.sessionToken = this.generateSessionToken();
            this.saveSession();
            return { success: true, user: this.currentUser, token: this.sessionToken };
        }
        return { success: false, message: 'Invalid email or password' };
    }

    generateSessionToken() {
        const array = new Uint8Array(48);
        crypto.getRandomValues(array);
        return 'sess_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    saveSession() {
        const sessionData = {
            user: this.currentUser,
            token: this.sessionToken,
            csrfToken: this.csrfToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        storage.set('session', sessionData);
    }

    restoreSession() {
        const sessionData = storage.get('session');
        if (sessionData) {
            const expiresAt = new Date(sessionData.expiresAt);
            if (expiresAt > new Date()) {
                this.currentUser = sessionData.user;
                this.sessionToken = sessionData.token;
                this.csrfToken = sessionData.csrfToken || this.csrfToken;
                return true;
            } else {
                this.logout();
            }
        }
        return false;
    }

    isAuthenticated() {
        return this.currentUser !== null && this.sessionToken !== null;
    }

    hasRole(...roles) {
        if (!this.currentUser) return false;
        return roles.includes(this.currentUser.role);
    }

    hasPermission(action, resource) {
        if (!this.currentUser) return false;
        const permissions = this.getPermissions();
        return permissions[action] && permissions[action].includes(resource);
    }

    getPermissions() {
        if (!this.currentUser) return {};
        
        const rolePermissions = {
            admin: {
                read: ['dashboard', 'students', 'teachers', 'classes', 'attendance', 'grades', 'timetable', 'assignments', 'announcements', 'fees', 'library', 'users', 'settings'],
                write: ['students', 'teachers', 'classes', 'attendance', 'grades', 'timetable', 'assignments', 'announcements', 'fees', 'library', 'users', 'settings'],
                delete: ['students', 'teachers', 'classes', 'attendance', 'grades', 'assignments', 'announcements', 'fees', 'library', 'users']
            },
            teacher: {
                read: ['dashboard', 'students', 'teachers', 'classes', 'attendance', 'grades', 'timetable', 'assignments', 'announcements'],
                write: ['attendance', 'grades', 'assignments'],
                delete: []
            },
            student: {
                read: ['dashboard', 'grades', 'timetable', 'assignments', 'announcements', 'library', 'studentDashboard', 'studentProfile', 'myAssignments', 'myPerformance', 'myAttendance', 'studentMessages', 'studentLibrary'],
                write: ['studentProfile', 'myAssignments'],
                delete: []
            },
            parent: {
                read: ['dashboard', 'grades', 'attendance', 'announcements', 'fees', 'parentDashboard', 'parentProfile', 'parentFees', 'parentMessaging', 'parentCalendar', 'parentHealth', 'parentTransport', 'parentReports'],
                write: ['parentProfile', 'parentFees', 'parentMessaging'],
                delete: []
            }
        };

        return rolePermissions[this.currentUser.role] || {};
    }

    logout() {
        this.currentUser = null;
        this.sessionToken = null;
        storage.remove('session');
    }

    checkRateLimit(action, maxRequests = 10, windowMs = 60000) {
        const key = `${action}_${this.currentUser?.id || 'anonymous'}`;
        const now = Date.now();
        
        if (!this.rateLimits[key]) {
            this.rateLimits[key] = { count: 1, startTime: now };
            return true;
        }

        const limit = this.rateLimits[key];
        if (now - limit.startTime > windowMs) {
            this.rateLimits[key] = { count: 1, startTime: now };
            return true;
        }

        limit.count++;
        return limit.count <= maxRequests;
    }

    validateSession() {
        if (!this.isAuthenticated()) return false;
        
        const sessionData = storage.get('session');
        if (!sessionData) return false;
        
        const expiresAt = new Date(sessionData.expiresAt);
        if (expiresAt <= new Date()) {
            this.logout();
            return false;
        }
        
        return true;
    }
}

const security = new SecurityManager();

function sanitize(str) {
    return security.sanitizeInput(str || '');
}

function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}