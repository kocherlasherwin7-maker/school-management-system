/**
 * Secure Storage Utility
 * Handles all localStorage operations with encryption, validation, and error handling
 */

class SecureStorage {
    constructor() {
        this.prefix = 'ems_';
        this.encryptionKey = 'EduManage_Pro_2024_Secret!';
    }

    // Simple XOR + Base64 encoding for basic obfuscation
    _encrypt(data) {
        try {
            const str = JSON.stringify(data);
            const encoded = btoa(unescape(encodeURIComponent(str)));
            let result = '';
            for (let i = 0; i < encoded.length; i++) {
                result += String.fromCharCode(encoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }
            return btoa(result);
        } catch (e) {
            console.error('Encryption error:', e);
            return null;
        }
    }

    _decrypt(encrypted) {
        try {
            const decoded = atob(encrypted);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }
            const str = decodeURIComponent(escape(atob(result)));
            return JSON.parse(str);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    }

    set(key, value) {
        try {
            const encrypted = this._encrypt(value);
            if (encrypted) {
                localStorage.setItem(this.prefix + key, encrypted);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const encrypted = localStorage.getItem(this.prefix + key);
            if (!encrypted) return defaultValue;
            const decrypted = this._decrypt(encrypted);
            return decrypted !== null ? decrypted : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
            keys.forEach(k => localStorage.removeItem(k));
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }

    getAll() {
        try {
            const result = {};
            const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
            keys.forEach(k => {
                const key = k.replace(this.prefix, '');
                result[key] = this.get(key);
            });
            return result;
        } catch (e) {
            console.error('Storage getAll error:', e);
            return {};
        }
    }
}

// Data Store - handles CRUD operations for all entities
class DataStore {
    constructor() {
        this.storage = new SecureStorage();
        this.initializeData();
    }

    initializeData() {
        if (!this.storage.get('initialized')) {
            this.seedData();
            this.storage.set('initialized', true);
        } else {
            // Ensure new seed users are always added (for code updates)
            this.mergeSeedUsers();
        }
    }

    mergeSeedUsers() {
        const existingUsers = this.getAll('users');
        const existingEmails = new Set(existingUsers.map(u => u.email));
        const seedUsers = [
            { name: 'Admin User', email: 'admin@school.com', password: this.hashPassword('admin123'), role: 'admin', phone: '+1-555-0100', address: '123 School Street, Education City', status: 'active' },
            { name: 'John Teacher', email: 'teacher@school.com', password: this.hashPassword('teacher123'), role: 'teacher', phone: '+1-555-0101', address: '456 Learning Lane, Education City', status: 'active' },
            { name: 'Alice Johnson', email: 'alice@student.com', password: this.hashPassword('student123'), role: 'student', phone: '+1-555-1001', address: '789 Oak Ave', status: 'active' },
            { name: 'Robert Johnson', email: 'robert@email.com', password: this.hashPassword('parent123'), role: 'parent', phone: '+1-555-2001', address: '789 Oak Ave', status: 'active' }
        ];
        let changed = false;
        seedUsers.forEach(u => {
            if (!existingEmails.has(u.email)) {
                existingUsers.push({ ...u, id: 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2,5), createdAt: new Date().toISOString() });
                existingEmails.add(u.email);
                changed = true;
            }
        });
        if (changed) {
            this.storage.set('users', existingUsers);
        }
    }

    // Collection methods
    getAll(collection) {
        return this.storage.get(collection, []);
    }

    getById(collection, id) {
        const items = this.getAll(collection);
        return items.find(item => item.id === id) || null;
    }

    add(collection, item) {
        const items = this.getAll(collection);
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        items.push(item);
        this.storage.set(collection, items);
        return item;
    }

    update(collection, id, updates) {
        const items = this.getAll(collection);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;
        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
        this.storage.set(collection, items);
        return items[index];
    }

    delete(collection, id) {
        const items = this.getAll(collection);
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length === items.length) return false;
        this.storage.set(collection, filtered);
        return true;
    }

    query(collection, predicate) {
        const items = this.getAll(collection);
        if (!predicate) return items;
        return items.filter(predicate);
    }

    count(collection) {
        return this.getAll(collection).length;
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Seed initial data
    seedData() {
        // Seed Users
        const users = [
            {
                id: 'u1',
                name: 'Admin User',
                email: 'admin@school.com',
                password: this.hashPassword('admin123'),
                role: 'admin',
                phone: '+1-555-0100',
                address: '123 School Street, Education City',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'u2',
                name: 'John Teacher',
                email: 'teacher@school.com',
                password: this.hashPassword('teacher123'),
                role: 'teacher',
                phone: '+1-555-0101',
                address: '456 Learning Lane, Education City',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'u3',
                name: 'Alice Johnson',
                email: 'alice@student.com',
                password: this.hashPassword('student123'),
                role: 'student',
                phone: '+1-555-1001',
                address: '789 Oak Ave',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'u4',
                name: 'Robert Johnson',
                email: 'robert@email.com',
                password: this.hashPassword('parent123'),
                role: 'parent',
                phone: '+1-555-2001',
                address: '789 Oak Ave',
                status: 'active',
                createdAt: new Date().toISOString()
            }
        ];
        this.storage.set('users', users);

        // Seed Students
        const students = [
            { id: 's1', firstName: 'Alice', lastName: 'Johnson', email: 'alice@student.com', phone: '+1-555-1001', dateOfBirth: '2012-03-15', gender: 'female', address: '789 Oak Ave', bloodGroup: 'A+', enrollmentDate: '2024-09-01', classId: 'c1', parentName: 'Robert Johnson', parentPhone: '+1-555-2001', parentEmail: 'robert@email.com', status: 'active' },
            { id: 's2', firstName: 'Bob', lastName: 'Smith', email: 'bob@student.com', phone: '+1-555-1002', dateOfBirth: '2013-07-22', gender: 'male', address: '321 Elm St', bloodGroup: 'B+', enrollmentDate: '2024-09-01', classId: 'c1', parentName: 'Sarah Smith', parentPhone: '+1-555-2002', parentEmail: 'sarah@email.com', status: 'active' },
            { id: 's3', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@student.com', phone: '+1-555-1003', dateOfBirth: '2012-11-08', gender: 'male', address: '555 Pine Rd', bloodGroup: 'O+', enrollmentDate: '2024-09-01', classId: 'c2', parentName: 'Lisa Brown', parentPhone: '+1-555-2003', parentEmail: 'lisa@email.com', status: 'active' },
            { id: 's4', firstName: 'Diana', lastName: 'Wilson', email: 'diana@student.com', phone: '+1-555-1004', dateOfBirth: '2013-01-30', gender: 'female', address: '777 Maple Dr', bloodGroup: 'AB+', enrollmentDate: '2024-09-01', classId: 'c2', parentName: 'Mark Wilson', parentPhone: '+1-555-2004', parentEmail: 'mark@email.com', status: 'active' },
            { id: 's5', firstName: 'Ethan', lastName: 'Davis', email: 'ethan@student.com', phone: '+1-555-1005', dateOfBirth: '2011-05-12', gender: 'male', address: '222 Birch Ln', bloodGroup: 'A-', enrollmentDate: '2023-09-01', classId: 'c3', parentName: 'Emily Davis', parentPhone: '+1-555-2005', parentEmail: 'emily@email.com', status: 'active' },
            { id: 's6', firstName: 'Fiona', lastName: 'Garcia', email: 'fiona@student.com', phone: '+1-555-1006', dateOfBirth: '2014-09-18', gender: 'female', address: '444 Cedar Ct', bloodGroup: 'B-', enrollmentDate: '2024-09-01', classId: 'c1', parentName: 'Carlos Garcia', parentPhone: '+1-555-2006', parentEmail: 'carlos@email.com', status: 'active' }
        ];
        this.storage.set('students', students);

        // Seed Teachers
        const teachers = [
            { id: 't1', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@school.com', phone: '+1-555-3001', dateOfBirth: '1985-03-20', gender: 'female', address: '111 Teacher Ave', qualification: 'M.Sc. Mathematics', specialization: 'Mathematics', experience: 12, classId: 'c1', status: 'active' },
            { id: 't2', firstName: 'Michael', lastName: 'Williams', email: 'michael.w@school.com', phone: '+1-555-3002', dateOfBirth: '1982-07-15', gender: 'male', address: '222 Educator St', qualification: 'M.A. English Literature', specialization: 'English', experience: 15, classId: 'c2', status: 'active' },
            { id: 't3', firstName: 'Emma', lastName: 'Brown', email: 'emma.b@school.com', phone: '+1-555-3003', dateOfBirth: '1990-11-05', gender: 'female', address: '333 Science Blvd', qualification: 'B.Ed., M.Sc. Physics', specialization: 'Science', experience: 8, classId: 'c3', status: 'active' }
        ];
        this.storage.set('teachers', teachers);

        // Seed Classes
        const classes = [
            { id: 'c1', name: 'Grade 5 - Section A', grade: 'Grade 5', section: 'A', room: '101', teacherId: 't1', capacity: 30, studentCount: 3, subjects: ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science'] },
            { id: 'c2', name: 'Grade 5 - Section B', grade: 'Grade 5', section: 'B', room: '102', teacherId: 't2', capacity: 30, studentCount: 2, subjects: ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science'] },
            { id: 'c3', name: 'Grade 6 - Section A', grade: 'Grade 6', section: 'A', room: '103', teacherId: 't3', capacity: 30, studentCount: 1, subjects: ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science'] }
        ];
        this.storage.set('classes', classes);

        // Seed Attendance
        const today = new Date().toISOString().split('T')[0];
        const attendance = [
            { id: 'a1', studentId: 's1', date: today, status: 'present', classId: 'c1', markedBy: 't1' },
            { id: 'a2', studentId: 's2', date: today, status: 'present', classId: 'c1', markedBy: 't1' },
            { id: 'a3', studentId: 's3', date: today, status: 'absent', classId: 'c2', markedBy: 't2' },
            { id: 'a4', studentId: 's4', date: today, status: 'present', classId: 'c2', markedBy: 't2' },
            { id: 'a5', studentId: 's5', date: today, status: 'late', classId: 'c3', markedBy: 't3' },
            { id: 'a6', studentId: 's6', date: today, status: 'present', classId: 'c1', markedBy: 't1' }
        ];
        this.storage.set('attendance', attendance);

        // Seed Grades
        const grades = [
            { id: 'g1', studentId: 's1', subject: 'Mathematics', examType: 'Midterm', score: 92, totalMarks: 100, grade: 'A', classId: 'c1', term: 'Term 1', year: 2024 },
            { id: 'g2', studentId: 's1', subject: 'English', examType: 'Midterm', score: 88, totalMarks: 100, grade: 'A', classId: 'c1', term: 'Term 1', year: 2024 },
            { id: 'g3', studentId: 's2', subject: 'Mathematics', examType: 'Midterm', score: 78, totalMarks: 100, grade: 'B+', classId: 'c1', term: 'Term 1', year: 2024 },
            { id: 'g4', studentId: 's2', subject: 'English', examType: 'Midterm', score: 85, totalMarks: 100, grade: 'A-', classId: 'c1', term: 'Term 1', year: 2024 },
            { id: 'g5', studentId: 's3', subject: 'Mathematics', examType: 'Midterm', score: 95, totalMarks: 100, grade: 'A+', classId: 'c2', term: 'Term 1', year: 2024 },
            { id: 'g6', studentId: 's5', subject: 'Science', examType: 'Midterm', score: 72, totalMarks: 100, grade: 'B', classId: 'c3', term: 'Term 1', year: 2024 }
        ];
        this.storage.set('grades', grades);

        // Seed Timetable
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const periods = ['08:00-08:45', '08:45-09:30', '09:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-13:00'];
        const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'Physical Education'];
        const timetable = [];
        
        classes.forEach(cls => {
            days.forEach((day, dayIdx) => {
                periods.forEach((period, periodIdx) => {
                    timetable.push({
                        id: `tt_${cls.id}_${dayIdx}_${periodIdx}`,
                        classId: cls.id,
                        day: day,
                        period: period,
                        periodIndex: periodIdx,
                        subject: subjects[(dayIdx + periodIdx) % subjects.length],
                        teacherId: cls.teacherId,
                        room: cls.room
                    });
                });
            });
        });
        this.storage.set('timetable', timetable);

        // Seed Assignments
        const assignments = [
            { id: 'as1', title: 'Algebra Problem Set', description: 'Complete problems 1-20 from Chapter 5', subject: 'Mathematics', classId: 'c1', teacherId: 't1', dueDate: '2024-12-20', maxScore: 100, status: 'active', submissions: [] },
            { id: 'as2', title: 'Essay: Book Review', description: 'Write a 500-word review of your favorite book', subject: 'English', classId: 'c1', teacherId: 't1', dueDate: '2024-12-22', maxScore: 50, status: 'active', submissions: [] },
            { id: 'as3', title: 'Science Project: Solar System', description: 'Create a model of the solar system', subject: 'Science', classId: 'c2', teacherId: 't2', dueDate: '2025-01-05', maxScore: 100, status: 'active', submissions: [] }
        ];
        this.storage.set('assignments', assignments);

        // Seed Announcements
        const announcements = [
            { id: 'an1', title: 'School Holiday - Christmas', content: 'School will remain closed from Dec 24th to Jan 1st for Christmas holidays.', category: 'holiday', priority: 'high', author: 'Admin User', date: '2024-12-15', targetRole: 'all' },
            { id: 'an2', title: 'Parent-Teacher Meeting', content: 'Annual parent-teacher meeting scheduled for Jan 15th. Please confirm your attendance.', category: 'event', priority: 'high', author: 'Admin User', date: '2024-12-10', targetRole: 'all' },
            { id: 'an3', title: 'Sports Day Announced', content: 'Annual sports day will be held on Feb 10th. Students are encouraged to participate.', category: 'event', priority: 'normal', author: 'Admin User', date: '2024-12-05', targetRole: 'all' }
        ];
        this.storage.set('announcements', announcements);

        // Seed Fees
        const fees = [
            { id: 'f1', studentId: 's1', type: 'Tuition Fee', amount: 2500, dueDate: '2025-01-10', status: 'paid', paidDate: '2025-01-05', paidAmount: 2500, paymentMethod: 'Online Transfer', term: 'Term 1', year: 2024 },
            { id: 'f2', studentId: 's2', type: 'Tuition Fee', amount: 2500, dueDate: '2025-01-10', status: 'pending', paidDate: null, paidAmount: 0, paymentMethod: '', term: 'Term 1', year: 2024 },
            { id: 'f3', studentId: 's3', type: 'Tuition Fee', amount: 2500, dueDate: '2025-01-10', status: 'overdue', paidDate: null, paidAmount: 0, paymentMethod: '', term: 'Term 1', year: 2024 },
            { id: 'f4', studentId: 's4', type: 'Tuition Fee', amount: 2500, dueDate: '2025-01-10', status: 'paid', paidDate: '2025-01-02', paidAmount: 2500, paymentMethod: 'Cash', term: 'Term 1', year: 2024 },
            { id: 'f5', studentId: 's5', type: 'Tuition Fee', amount: 2800, dueDate: '2025-01-10', status: 'pending', paidDate: null, paidAmount: 0, paymentMethod: '', term: 'Term 1', year: 2024 }
        ];
        this.storage.set('fees', fees);

        // Seed Library Books
        const books = [
            { id: 'b1', title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', category: 'Fiction', publisher: 'HarperCollins', publishYear: 1960, totalCopies: 5, availableCopies: 3, shelf: 'A1-01', status: 'available' },
            { id: 'b2', title: '1984', author: 'George Orwell', isbn: '978-0-45-152493-5', category: 'Fiction', publisher: 'Secker & Warburg', publishYear: 1949, totalCopies: 4, availableCopies: 2, shelf: 'A1-02', status: 'available' },
            { id: 'b3', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0-55-338016-3', category: 'Science', publisher: 'Bantam Books', publishYear: 1988, totalCopies: 3, availableCopies: 1, shelf: 'B2-01', status: 'available' },
            { id: 'b4', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-74-327356-5', category: 'Fiction', publisher: 'Charles Scribner\'s Sons', publishYear: 1925, totalCopies: 5, availableCopies: 4, shelf: 'A1-03', status: 'available' },
            { id: 'b5', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0-26-203384-8', category: 'Computer Science', publisher: 'MIT Press', publishYear: 2009, totalCopies: 2, availableCopies: 1, shelf: 'C3-01', status: 'available' },
            { id: 'b6', title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0-14-143951-8', category: 'Fiction', publisher: 'Penguin Classics', publishYear: 1813, totalCopies: 4, availableCopies: 3, shelf: 'A1-04', status: 'available' }
        ];
        this.storage.set('library', books);

        // Seed Book Issues
        this.storage.set('bookIssues', []);
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hashed_' + Math.abs(hash).toString(36);
    }
}

// Global instance
const db = new DataStore();
const storage = new SecureStorage();