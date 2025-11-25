/**
 * Date utility functions for docket management
 */

/**
 * Validates if a date string is in mm/dd/yyyy format
 */
export function isValidDateFormat(dateString: string): boolean {
    const regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    return regex.test(dateString);
}

/**
 * Parses a date string in mm/dd/yyyy format to a Date object
 */
export function parseDateString(dateString: string): Date | null {
    if (!isValidDateFormat(dateString)) {
        return null;
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculates the number of days between two dates
 */
export function getDaysDifference(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    const diffTime = date2.getTime() - date1.getTime();
    return Math.ceil(diffTime / oneDay);
}

/**
 * Computes the status based on deadline
 * - Overdue: deadline < today
 * - Urgent: deadline within 7 days
 * - Due: deadline within 14 days
 * - Active: deadline > 14 days
 */
export function computeStatus(deadline: Date): 'Overdue' | 'Urgent' | 'Due' | 'Active' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const daysUntilDeadline = getDaysDifference(today, deadlineDate);

    if (daysUntilDeadline < 0) {
        return 'Overdue';
    } else if (daysUntilDeadline === 0) {
        return 'Due';
    } else if (daysUntilDeadline <= 5) {
        return 'Urgent';
    } else {
        return 'Active';
    }
}

/**
 * Formats a date to mm/dd/yyyy string
 */
export function formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

/**
 * Converts mm/dd/yyyy to yyyy-mm-dd for database storage
 */
export function convertToDBFormat(dateString: string): string | null {
    const date = parseDateString(dateString);
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
