export const WEEKDAY_NAMES = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
];

/**
 * Parse chuỗi ngày an toàn hỗ trợ các định dạng:
 * - d-m-Y (ví dụ: '21-08-2026', '21-08-2026 22:00')
 * - Y-m-d (ví dụ: '2026-08-21', '2026-08-21T00:00:00.000000Z')
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();

    // 1. Dạng d-m-Y hoặc d-m-Y H:i
    if (/^\d{2}-\d{2}-\d{4}/.test(str)) {
        const [datePart, timePart] = str.split(' ');
        const [d, m, y] = datePart.split('-').map(Number);
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
 * Format ngày hiển thị dạng: "Thứ Sáu, 21/08/2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '---';

    const d = parseDate(dateStr);
    if (!d) return String(dateStr);

    const dayName = WEEKDAY_NAMES[d.getDay()];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${dayName}, ${day}/${month}/${year}`;
}

/**
 * Format ngày giờ hiển thị dạng: "22:00 - 21/08/2026"
 */
export function formatDateTime(dtStr: string | null | undefined): string {
    if (!dtStr) return '---';

    const d = parseDate(dtStr);
    if (!d) return String(dtStr);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

/**
 * Format giờ hiển thị dạng: "08:00"
 */
export function formatTime(timeStr: string | null | undefined): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
}
