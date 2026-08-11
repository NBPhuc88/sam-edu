/**
 * Navigation Configuration
 *
 * Cấu hình menu sidebar theo account_type và admin role.
 * Xem: .agents/AGENTS.md - Mục 6.1 Navigation Configuration Example
 *
 * IMPORTANT: Navigation chỉ là UI display.
 * Phân quyền thực tế được kiểm soát ở Backend API.
 */

import {
    BarChart3,
    Bell,
    BookOpen,
    Building2,
    DollarSign,
    FileCheck,
    LayoutDashboard,
    Lock,
    Settings,
    User,
    Users,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string;
    path?: string;
    icon?: LucideIcon;
    children?: NavItem[];
}

// ─── Super Admin Navigation ──────────────────────────────────────────────────
const superAdminNav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
        label: 'Administration',
        icon: Lock,
        children: [
            { label: 'Admins', path: '/admins' },
            { label: 'Centers', path: '/centers' },
            { label: 'Teachers', path: '/teachers' },
            { label: 'Students', path: '/students' },
        ],
    },
    {
        label: 'Academic',
        icon: BookOpen,
        children: [
            { label: 'Subjects', path: '/subjects' },
            { label: 'Rooms', path: '/rooms' },
            { label: 'Classes', path: '/classes' },
        ],
    },
    {
        label: 'Operations',
        icon: Zap,
        children: [
            { label: 'Schedules', path: '/schedules' },
            { label: 'Sessions', path: '/sessions' },
            { label: 'Attendance', path: '/attendance' },
            { label: 'Reschedules', path: '/reschedules' },
        ],
    },
    {
        label: 'Exams',
        icon: FileCheck,
        children: [
            { label: 'Exams', path: '/exams' },
            { label: 'Results', path: '/exam-results' },
            { label: 'Result Histories', path: '/exam-result-histories' },
        ],
    },
    {
        label: 'Finance',
        icon: DollarSign,
        children: [
            { label: 'Subscriptions', path: '/subscriptions' },
            { label: 'Payments', path: '/payments' },
            { label: 'Plans', path: '/plans' },
        ],
    },
    { label: 'Statistics', path: '/statistics', icon: BarChart3 },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    {
        label: 'System',
        icon: Settings,
        children: [{ label: 'Settings', path: '/settings' }],
    },
];

// ─── Admin Navigation (không có: Admins, System Settings) ────────────────────
const adminNav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
        label: 'Management',
        icon: Users,
        children: [
            { label: 'Centers', path: '/centers' },
            { label: 'Teachers', path: '/teachers' },
            { label: 'Students', path: '/students' },
            { label: 'Classes', path: '/classes' },
        ],
    },
    {
        label: 'Academic',
        icon: BookOpen,
        children: [
            { label: 'Subjects', path: '/subjects' },
            { label: 'Rooms', path: '/rooms' },
        ],
    },
    {
        label: 'Operations',
        icon: Zap,
        children: [
            { label: 'Schedules', path: '/schedules' },
            { label: 'Sessions', path: '/sessions' },
            { label: 'Attendance', path: '/attendance' },
            { label: 'Reschedules', path: '/reschedules' },
        ],
    },
    {
        label: 'Exams',
        icon: FileCheck,
        children: [
            { label: 'Exams', path: '/exams' },
            { label: 'Results', path: '/exam-results' },
        ],
    },
    {
        label: 'Finance',
        icon: DollarSign,
        children: [
            { label: 'Payments', path: '/payments' },
            { label: 'Subscriptions', path: '/subscriptions' },
        ],
    },
    { label: 'Statistics', path: '/statistics', icon: BarChart3 },
    { label: 'Notifications', path: '/notifications', icon: Bell },
];

// ─── Center Navigation ────────────────────────────────────────────────────────
const centerNav: NavItem[] = [
    { label: 'Dashboard', path: '/center/dashboard', icon: LayoutDashboard },
    {
        label: 'Management',
        icon: Users,
        children: [
            { label: 'Teachers', path: '/center/teachers' },
            { label: 'Students', path: '/center/students' },
            { label: 'Rooms', path: '/center/rooms' },
            { label: 'Classes', path: '/center/classes' },
        ],
    },
    {
        label: 'Academic',
        icon: BookOpen,
        children: [
            { label: 'Subjects', path: '/center/subjects' },
            { label: 'Schedule', path: '/center/schedule' },
        ],
    },
    {
        label: 'Operations',
        icon: Zap,
        children: [
            { label: 'Sessions', path: '/center/sessions' },
            { label: 'Reschedules', path: '/center/reschedules' },
            { label: 'Attendance', path: '/center/attendance' },
        ],
    },
    {
        label: 'Exams',
        icon: FileCheck,
        children: [
            { label: 'Exams', path: '/center/exams' },
            { label: 'Results', path: '/center/exam-results' },
        ],
    },
    {
        label: 'Finance',
        icon: DollarSign,
        children: [{ label: 'Payments', path: '/center/payments' }],
    },
    { label: 'Statistics', path: '/center/statistics', icon: BarChart3 },
    { label: 'Notifications', path: '/center/notifications', icon: Bell },
    { label: 'Settings', path: '/center/settings', icon: Settings },
];

// ─── Teacher Navigation ───────────────────────────────────────────────────────
const teacherNav: NavItem[] = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    {
        label: 'Teaching',
        icon: BookOpen,
        children: [
            { label: 'My Classes', path: '/teacher/classes' },
            { label: 'My Students', path: '/teacher/students' },
            { label: 'Schedule', path: '/teacher/schedule' },
            { label: 'Sessions', path: '/teacher/sessions' },
            { label: 'Attendance', path: '/teacher/attendance' },
        ],
    },
    {
        label: 'Exams',
        icon: FileCheck,
        children: [
            { label: 'Exams', path: '/teacher/exams' },
            { label: 'Results', path: '/teacher/exam-results' },
        ],
    },
    {
        label: 'Students',
        icon: Users,
        children: [
            { label: 'Notes', path: '/teacher/student-notes' },
            { label: 'Documents', path: '/teacher/student-documents' },
        ],
    },
    { label: 'Notifications', path: '/teacher/notifications', icon: Bell },
    { label: 'Profile', path: '/teacher/profile', icon: User },
];

// ─── Student Navigation ───────────────────────────────────────────────────────
const studentNav: NavItem[] = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    {
        label: 'Learning',
        icon: BookOpen,
        children: [
            { label: 'My Classes', path: '/student/classes' },
            { label: 'Schedule', path: '/student/schedule' },
            { label: 'Attendance', path: '/student/attendance' },
            { label: 'Exams', path: '/student/exams' },
            { label: 'Results', path: '/student/exam-results' },
        ],
    },
    {
        label: 'Documents',
        icon: FileCheck,
        children: [{ label: 'My Documents', path: '/student/documents' }],
    },
    {
        label: 'Finance',
        icon: DollarSign,
        children: [{ label: 'My Payments', path: '/student/payments' }],
    },
    { label: 'Notifications', path: '/student/notifications', icon: Bell },
    { label: 'Profile', path: '/student/profile', icon: User },
];

// ─── Full Config Map ──────────────────────────────────────────────────────────
export const navigationConfig = {
    admin: {
        super_admin: superAdminNav,
        admin: adminNav,
    },
    center: centerNav,
    teacher: teacherNav,
    student: studentNav,
};

/**
 * Lấy danh sách navigation items dựa trên role và admin_role từ Inertia shared props.
 *
 * @param role - 'admin' | 'center' | 'teacher' | 'student'  (auth.role)
 * @param adminRole - 'super_admin' | 'admin' | null  (auth.user.admin_role)
 */
export function getNavigationItems(
    role: string | null,
    adminRole?: string | null,
): NavItem[] {
    if (!role) {
return [];
}

    switch (role) {
        case 'admin':
            return adminRole === 'super_admin'
                ? navigationConfig.admin.super_admin
                : navigationConfig.admin.admin;
        case 'center':
            return navigationConfig.center;
        case 'teacher':
            return navigationConfig.teacher;
        case 'student':
            return navigationConfig.student;
        default:
            return [];
    }
}

/**
 * Lấy nhãn hiển thị cho từng loại account.
 */
export function getAccountLabel(role: string | null, adminRole?: string | null): string {
    if (!role) {
return 'Guest';
}

    const labels: Record<string, string> = {
        admin: adminRole === 'super_admin' ? 'Super Admin' : 'Admin',
        center: 'Quản lý Trung tâm',
        teacher: 'Giáo viên',
        student: 'Học sinh',
    };

    return labels[role] ?? 'User';
}

/**
 * Lấy icon chính của account type.
 */
export function getAccountIcon(role: string | null): LucideIcon {
    const icons: Record<string, LucideIcon> = {
        admin: Lock,
        center: Building2,
        teacher: BookOpen,
        student: User,
    };

    return icons[role ?? ''] ?? User;
}
