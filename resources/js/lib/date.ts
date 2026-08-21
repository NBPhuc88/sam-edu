export const WEEKDAY_NAMES = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
];

export interface DateFormatOptions {
    separator?: '/' | '-';
    includeWeekday?: boolean;
}

export interface DateTimeFormatOptions {
    separator?: '/' | '-';
    timeFirst?: boolean;
}

/**
 * Parse chuỗi ngày an toàn hỗ trợ các định dạng:
 * - d-m-Y hoặc d/m/Y (ví dụ: '21-08-2026', '21/08/2026', '21-08-2026 22:00')
 * - Y-m-d (ví dụ: '2026-08-21', '2026-08-21T00:00:00.000000Z')
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();

    // 1. Dạng d-m-Y hoặc d/m/Y (có hoặc không có giờ)
    if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(str)) {
        const [datePart, timePart] = str.split(' ');
        const separator = datePart.includes('-') ? '-' : '/';
        const [d, m, y] = datePart.split(separator).map(Number);
        if (timePart && timePart.includes(':')) {
            const [hours, minutes] = timePart.split(':').map(Number);
            return new Date(y, m - 1, d, hours || 0, minutes || 0);
        }
        return new Date(y, m - 1, d);
    }

    // 2. Dạng Y-m-d hoặc ISO 8601
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const [datePart, timePart] = str.replace('T', ' ').split(' ');
        const [y, m, d] = datePart.split('-').map(Number);
        if (timePart && timePart.includes(':')) {
            const [hours, minutes] = timePart.split(':').map(Number);
            return new Date(y, m - 1, d, hours || 0, minutes || 0);
        }
        return new Date(y, m - 1, d);
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Format ngày hiển thị:
 * - Mặc định: "21-08-2026"
 * - Hỗ trợ option separator: formatDate(date, '/') => "21/08/2026"
 * - Hỗ trợ option includeWeekday: formatDate(date, { includeWeekday: true, separator: '/' }) => "Thứ Sáu, 21/08/2026"
 */
export function formatDate(
    dateStr: string | null | undefined,
    options?: DateFormatOptions | boolean | string
): string {
    if (!dateStr) return '---';

    const d = parseDate(dateStr);
    if (!d) return String(dateStr);

    let separator = '-';
    let includeWeekday = false;

    if (typeof options === 'boolean') {
        includeWeekday = options;
    } else if (typeof options === 'string') {
        separator = options;
    } else if (options && typeof options === 'object') {
        if (options.separator) separator = options.separator;
        if (options.includeWeekday !== undefined) includeWeekday = options.includeWeekday;
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    const formattedDate = `${day}${separator}${month}${separator}${year}`;

    if (includeWeekday) {
        const dayName = WEEKDAY_NAMES[d.getDay()];
        return `${dayName}, ${formattedDate}`;
    }

    return formattedDate;
}

/**
 * Chuyển đổi an toàn chuỗi ngày thành dạng "YYYY-MM-DD"
 */
export function toISODateString(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const d = parseDate(dateStr);
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Format ngày giờ hiển thị:
 * - Mặc định: "21-08-2026 22:00"
 * - Option separator: formatDateTime(dt, '/') => "21/08/2026 22:00"
 * - Option timeFirst: formatDateTime(dt, { timeFirst: true }) => "22:00 21-08-2026"
 */
export function formatDateTime(
    dtStr: string | null | undefined,
    options?: DateTimeFormatOptions | string
): string {
    if (!dtStr) return '---';

    const d = parseDate(dtStr);
    if (!d) return String(dtStr);

    let separator = '-';
    let timeFirst = false;

    if (typeof options === 'string') {
        separator = options;
    } else if (options && typeof options === 'object') {
        if (options.separator) separator = options.separator;
        if (options.timeFirst !== undefined) timeFirst = options.timeFirst;
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    const formattedDate = `${day}${separator}${month}${separator}${year}`;
    const formattedTime = `${hours}:${minutes}`;

    if (timeFirst) {
        return `${formattedTime} ${formattedDate}`;
    }

    return `${formattedDate} ${formattedTime}`;
}

/**
 * Format giờ hiển thị dạng: "08:00"
 */
export function formatTime(timeStr: string | null | undefined): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
}
