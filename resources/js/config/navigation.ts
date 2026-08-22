/**
 * Navigation Configuration
 *
 * Cấu hình menu sidebar theo account_type và admin role.
 * Lọc động theo danh sách quyền permissions từ Database.
 * Xem: .agents/AGENTS.md - Mục 6.1 Navigation Configuration
 * 100% Tiếng Việt
 */

import {
    BarChart3,
    Bell,
    BookOpen,
    DollarSign,
    FileCheck,
    LayoutDashboard,
    Lock,
    MessageSquare,
    Settings,
    Shield,
    User,
    Users,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string;
    path?: string;
    icon?: LucideIcon;
    permission?: string;
    children?: NavItem[];
}

// ─── Super Admin Navigation ──────────────────────────────────────────────────
const superAdminNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.index' },
    {
        label: 'Quản Trị Hệ Thống',
        icon: Lock,
        children: [
            { label: 'Trung Tâm', path: '/centers', permission: 'centers.index' },
            { label: 'Quản Trị Viên', path: '/admins', permission: 'admins.index' },
            { label: 'Phân Quyền', path: '/permissions', permission: 'permissions.index' },
            { label: 'Giáo Viên', path: '/teachers', permission: 'teachers.index' },
            { label: 'Học Sinh', path: '/students', permission: 'students.index' },
        ],
    },
    {
        label: 'Học Thuật',
        icon: BookOpen,
        children: [
            { label: 'Môn Học', path: '/subjects', permission: 'subjects.index' },
            { label: 'Phòng Học', path: '/rooms', permission: 'rooms.index' },
            { label: 'Lớp Học', path: '/classes', permission: 'classes.index' },
        ],
    },
    {
        label: 'Vận Hành',
        icon: Zap,
        children: [
            { label: 'Lịch Học', path: '/schedules', permission: 'schedules.index' },
            { label: 'Buổi Học', path: '/sessions', permission: 'sessions.index' },
            { label: 'Ngày Lễ', path: '/holidays', permission: 'holidays.index' },
        ],
    },
    {
        label: 'Thi & Kiểm Tra',
        icon: FileCheck,
        children: [
            { label: 'Thi Thử / Luyện Tập', path: '/practice-exams', permission: 'practice-exams.index' },
            { label: 'Vào Phòng Thi', path: '/exam-room', permission: 'online-exam.enter' },
            { label: 'Kho Đề Thi', path: '/exams', permission: 'exams.index' },
            { label: 'Loại Đề Thi', path: '/exam-types', permission: 'exam-types.index' },
            { label: 'Kỳ Thi Lớp Học', path: '/class-exams', permission: 'class-exams.index' },
            { label: 'Chấm Bài Thi', path: '/grading', permission: 'grading.index' },
        ],
    },
    {
        label: 'Tài Chính',
        icon: DollarSign,
        children: [
            { label: 'Cấu Hình Gói', path: '/plans', permission: 'plans.index' },
            { label: 'Học Phí Học Sinh', path: '/tuitions', permission: 'tuitions.index' },
        ],
    },
    { label: 'Thống Kê Báo Cáo', path: '/statistics', icon: BarChart3, permission: 'statistics.index' },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
    {
        label: 'Cài Đặt',
        icon: Settings,
        children: [{ label: 'Cài Đặt Hệ Thống', path: '/settings' }],
    },
];

// ─── Admin Navigation (Quản lý Trung tâm được gán) ─────────────────────────
const adminNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.index' },
    {
        label: 'Quản Lý Trung Tâm',
        icon: Users,
        children: [
            { label: 'Giáo Viên', path: '/teachers', permission: 'teachers.index' },
            { label: 'Học Sinh', path: '/students', permission: 'students.index' },
        ],
    },
    {
        label: 'Học Thuật',
        icon: BookOpen,
        children: [
            { label: 'Môn Học', path: '/subjects', permission: 'subjects.index' },
            { label: 'Phòng Học', path: '/rooms', permission: 'rooms.index' },
            { label: 'Lớp Học', path: '/classes', permission: 'classes.index' },
        ],
    },
    {
        label: 'Vận Hành',
        icon: Zap,
        children: [
            { label: 'Lịch Học', path: '/schedules', permission: 'schedules.index' },
            { label: 'Buổi Học', path: '/sessions', permission: 'sessions.index' },
            { label: 'Ngày Lễ', path: '/holidays', permission: 'holidays.index' },
        ],
    },
    {
        label: 'Thi & Kiểm Tra',
        icon: FileCheck,
        children: [
            { label: 'Thi Thử / Luyện Tập', path: '/practice-exams', permission: 'practice-exams.index' },
            { label: 'Vào Phòng Thi', path: '/exam-room', permission: 'online-exam.enter' },
            { label: 'Kho Đề Thi', path: '/exams', permission: 'exams.index' },
            { label: 'Loại Đề Thi', path: '/exam-types', permission: 'exam-types.index' },
            { label: 'Kỳ Thi Lớp Học', path: '/class-exams', permission: 'class-exams.index' },
            { label: 'Chấm Bài Thi', path: '/grading', permission: 'grading.index' },
        ],
    },
    {
        label: 'Tài Chính',
        icon: DollarSign,
        children: [
            { label: 'Học Phí Học Sinh', path: '/tuitions', permission: 'tuitions.index' },
        ],
    },
    { label: 'Thống Kê Báo Cáo', path: '/statistics', icon: BarChart3, permission: 'statistics.index' },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
];

// ─── Teacher Navigation ───────────────────────────────────────────────────────
const teacherNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.index' },
    {
        label: 'Giảng Dạy',
        icon: BookOpen,
        children: [
            { label: 'Lớp Học Của Tôi', path: '/classes', permission: 'classes.index' },
            { label: 'Học Sinh Của Tôi', path: '/students', permission: 'students.index' },
            { label: 'Lịch Dạy', path: '/schedules', permission: 'schedules.index' },
        ],
    },
    {
        label: 'Thi & Điểm Số',
        icon: FileCheck,
        children: [
            { label: 'Thi Thử / Luyện Tập', path: '/practice-exams', permission: 'practice-exams.index' },
            { label: 'Vào Phòng Thi', path: '/exam-room', permission: 'online-exam.enter' },
            { label: 'Kho Đề Thi', path: '/exams', permission: 'exams.index' },
            { label: 'Kỳ Thi Lớp Học', path: '/class-exams', permission: 'class-exams.index' },
            { label: 'Chấm Bài Thi', path: '/grading', permission: 'grading.index' },
        ],
    },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
];

// ─── Student Navigation ───────────────────────────────────────────────────────
const studentNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.index' },
    { label: 'Thi Thử / Luyện Tập', path: '/practice-exams', icon: FileCheck, permission: 'practice-exams.index' },
    { label: 'Vào Phòng Thi', path: '/exam-room', icon: Zap, permission: 'online-exam.enter' },
    { label: 'Trò Chuyện Lớp Học', path: '/classes', icon: MessageSquare, permission: 'classes.index' },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
];

// ─── Full Config Map ──────────────────────────────────────────────────────────
export const navigationConfig = {
    admin: {
        super_admin: superAdminNav,
        admin: adminNav,
    },
    teacher: teacherNav,
    student: studentNav,
};

/**
 * Lọc danh sách menu theo quyền động.
 */
function filterNavItemsByPermissions(items: NavItem[], permissions: string[], isSuperAdmin: boolean): NavItem[] {
    if (isSuperAdmin) {
        return items;
    }

    const filtered: NavItem[] = [];

    for (const item of items) {
        // Kiểm tra quyền của item cha nếu có path và permission
        if (item.permission && !permissions.includes(item.permission)) {
            continue;
        }

        if (item.children && item.children.length > 0) {
            const validChildren = item.children.filter((child) => {
                if (!child.permission) {
                    return true;
                }
                return permissions.includes(child.permission);
            });

            // Chỉ hiển thị menu cha nếu có ít nhất 1 menu con hợp lệ
            if (validChildren.length > 0) {
                filtered.push({
                    ...item,
                    children: validChildren,
                });
            }
        } else {
            filtered.push(item);
        }
    }

    return filtered;
}

export function getNavigationItems(
    role: string | null,
    adminRole?: string | null,
    permissions: string[] = [],
): NavItem[] {
    if (!role) {
        return [];
    }

    const isSuperAdmin = role === 'admin' && adminRole === 'super_admin';

    let rawItems: NavItem[] = [];
    switch (role) {
        case 'admin':
        case 'super_admin':
            rawItems = adminRole === 'super_admin'
                ? navigationConfig.admin.super_admin
                : navigationConfig.admin.admin;
            break;
        case 'teacher':
            rawItems = navigationConfig.teacher;
            break;
        case 'student':
            rawItems = navigationConfig.student;
            break;
        default:
            return [];
    }

    return filterNavItemsByPermissions(rawItems, permissions, isSuperAdmin);
}

export function getAccountLabel(role: string | null, adminRole?: string | null): string {
    if (!role) {
        return 'Khách';
    }

    const labels: Record<string, string> = {
        admin: adminRole === 'super_admin' ? 'Super Admin' : 'Admin Quản Lý Trung Tâm',
        super_admin: 'Super Admin',
        teacher: 'Giáo Viên',
        student: 'Học Sinh',
    };

    return labels[role] ?? 'Người Dùng';
}

export function getAccountIcon(role: string | null): LucideIcon {
    const icons: Record<string, LucideIcon> = {
        admin: Lock,
        super_admin: Lock,
        teacher: BookOpen,
        student: User,
    };

    return icons[role ?? ''] ?? User;
}
