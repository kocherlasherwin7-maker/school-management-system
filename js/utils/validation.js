/**
 * Form Validation Utility
 * Provides email, phone, password, and general input validation
 */

class Validator {
    static isEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static isPhone(phone) {
        return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/.test(phone) && phone.replace(/\D/g, '').length >= 7;
    }

    static isDate(date) {
        return !isNaN(Date.parse(date));
    }

    static isFutureDate(date) {
        return this.isDate(date) && new Date(date) > new Date();
    }

    static isPastDate(date) {
        return this.isDate(date) && new Date(date) < new Date();
    }

    static isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    static isPositiveNumber(value) {
        return this.isNumeric(value) && parseFloat(value) > 0;
    }

    static isInRange(value, min, max) {
        return this.isNumeric(value) && value >= min && value <= max;
    }

    static isLength(str, min, max) {
        return str.length >= min && str.length <= max;
    }

    static isAlpha(str) {
        return /^[a-zA-Z\s]+$/.test(str);
    }

    static isAlphaNumeric(str) {
        return /^[a-zA-Z0-9\s]+$/.test(str);
    }

    static validateStudent(data) {
        const errors = [];
        if (!data.firstName || data.firstName.trim().length < 2) errors.push('First name must be at least 2 characters');
        if (!data.lastName || data.lastName.trim().length < 2) errors.push('Last name must be at least 2 characters');
        if (!data.email || !this.isEmail(data.email)) errors.push('Valid email is required');
        if (data.phone && !this.isPhone(data.phone)) errors.push('Valid phone number is required');
        if (!data.dateOfBirth || !this.isPastDate(data.dateOfBirth)) errors.push('Valid date of birth is required');
        if (!data.gender) errors.push('Gender is required');
        if (!data.classId) errors.push('Class is required');
        return { valid: errors.length === 0, errors };
    }

    static validateTeacher(data) {
        const errors = [];
        if (!data.firstName || data.firstName.trim().length < 2) errors.push('First name must be at least 2 characters');
        if (!data.lastName || data.lastName.trim().length < 2) errors.push('Last name must be at least 2 characters');
        if (!data.email || !this.isEmail(data.email)) errors.push('Valid email is required');
        if (data.phone && !this.isPhone(data.phone)) errors.push('Valid phone number is required');
        if (!data.qualification) errors.push('Qualification is required');
        if (!data.specialization) errors.push('Specialization is required');
        if (data.experience !== undefined && !this.isPositiveNumber(data.experience)) errors.push('Experience must be a positive number');
        return { valid: errors.length === 0, errors };
    }

    static validateClass(data) {
        const errors = [];
        if (!data.name || data.name.trim().length < 2) errors.push('Class name must be at least 2 characters');
        if (!data.grade) errors.push('Grade is required');
        if (!data.section) errors.push('Section is required');
        if (data.capacity && !this.isPositiveNumber(data.capacity)) errors.push('Capacity must be a positive number');
        return { valid: errors.length === 0, errors };
    }

    static validateFee(data) {
        const errors = [];
        if (!data.studentId) errors.push('Student is required');
        if (!data.type) errors.push('Fee type is required');
        if (!data.amount || !this.isPositiveNumber(data.amount)) errors.push('Valid amount is required');
        if (!data.dueDate || !this.isFutureDate(data.dueDate)) errors.push('Future due date is required');
        return { valid: errors.length === 0, errors };
    }

    static validateGrade(data) {
        const errors = [];
        if (!data.studentId) errors.push('Student is required');
        if (!data.subject) errors.push('Subject is required');
        if (!data.score || !this.isInRange(data.score, 0, data.totalMarks || 100)) errors.push(`Score must be between 0 and ${data.totalMarks || 100}`);
        if (data.totalMarks && !this.isPositiveNumber(data.totalMarks)) errors.push('Total marks must be a positive number');
        if (!data.examType) errors.push('Exam type is required');
        return { valid: errors.length === 0, errors };
    }

    static validateAssignment(data) {
        const errors = [];
        if (!data.title || data.title.trim().length < 3) errors.push('Title must be at least 3 characters');
        if (!data.description) errors.push('Description is required');
        if (!data.subject) errors.push('Subject is required');
        if (!data.classId) errors.push('Class is required');
        if (!data.dueDate || !this.isFutureDate(data.dueDate)) errors.push('Future due date is required');
        if (data.maxScore && !this.isPositiveNumber(data.maxScore)) errors.push('Max score must be a positive number');
        return { valid: errors.length === 0, errors };
    }

    static validateLibraryBook(data) {
        const errors = [];
        if (!data.title || data.title.trim().length < 2) errors.push('Title must be at least 2 characters');
        if (!data.author || data.author.trim().length < 2) errors.push('Author must be at least 2 characters');
        if (!data.isbn) errors.push('ISBN is required');
        if (!data.category) errors.push('Category is required');
        if (data.totalCopies && !this.isPositiveNumber(data.totalCopies)) errors.push('Total copies must be a positive number');
        return { valid: errors.length === 0, errors };
    }

    static sanitizeAndValidate(data, rules) {
        const sanitized = security.sanitizeObject(data);
        const errors = [];
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = sanitized[field];
            
            if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
                errors.push(`${rule.label || field} is required`);
                continue;
            }
            
            if (value && rule.type === 'email' && !this.isEmail(value)) {
                errors.push(`Valid email is required for ${rule.label || field}`);
            }
            
            if (value && rule.type === 'number' && !this.isNumeric(value)) {
                errors.push(`${rule.label || field} must be a number`);
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors.push(`${rule.label || field} must be at least ${rule.minLength} characters`);
            }
        }
        
        return { valid: errors.length === 0, sanitized, errors };
    }

    static getGradeFromScore(score, total = 100) {
        const percentage = (score / total) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 75) return 'B+';
        if (percentage >= 70) return 'B';
        if (percentage >= 65) return 'C+';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    static getGPAFromGrade(grade) {
        const gpaMap = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0
        };
        return gpaMap[grade] || 0;
    }
}