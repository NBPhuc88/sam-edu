/**
 * Navigation Configuration
 *
 * Cấu hình menu sidebar theo account_type và admin role.
 * Xem: .agents/AGENTS.md - Mục 6.1 Navigation Configuration
 * 100% Tiếng Việt
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
    MessageSquare,
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
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard },
    {
        label: 'Quản Trị Hệ Thống',
        icon: Lock,
        children: [
            { label: 'Quản Trị Viên', path: '/admins' },
            { label: 'Trung Tâm', path: '/centers' },
            { label: 'Giáo Viên', path: '/teachers' },
            { label: 'Học Sinh', path: '/students' },
        ],
    },
    {
        label: 'Học Thuật',
        icon: BookOpen,
        children: [
            { label: 'Môn Học', path: '/subjects' },
            { label: 'Phòng Học', path: '/rooms' },
            { label: 'Lớp Học', path: '/classes' },
        ],
    },
    {
        label: 'Vận Hành',
        icon: Zap,
        children: [
            { label: 'Lịch Học', path: '/schedules' },
            { label: 'Buổi Học', path: '/sessions' },
            { label: 'Điểm Danh', path: '/attendance' },
            { label: 'Đổi Lịch Học', path: '/reschedules' },
        ],
    },
    {
        label: 'Thi & Kiểm Tra',
        icon: FileCheck,
        children: [
            { label: 'Kỳ Thi', path: '/exams' },
            { label: 'Kết Quả Thi', path: '/exam-results' },
            { label: 'Lịch Sử Kết Quả', path: '/exam-result-histories' },
        ],
    },
    {
        label: 'Tài Chính',
        icon: DollarSign,
        children: [
            { label: 'Gói Dịch Vụ', path: '/subscriptions' },
            { label: 'Giao Dịch Thanh Toán', path: '/payments' },
            { label: 'Cấu Hình Gói', path: '/plans' },
        ],
    },
    { label: 'Thống Kê Báo Cáo', path: '/statistics', icon: BarChart3 },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
    {
        label: 'Cài Đặt',
        icon: Settings,
        children: [{ label: 'Cài Đặt Hệ Thống', path: '/settings' }],
    },
];

// ─── Admin Navigation (Quản lý Trung tâm được gán) ─────────────────────────
const adminNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard },
    {
        label: 'Quản Lý Trung Tâm',
        icon: Users,
        children: [
            { label: 'Trung Tâm', path: '/centers' },
            { label: 'Giáo Viên', path: '/teachers' },
            { label: 'Học Sinh', path: '/students' },
            { label: 'Lớp Học', path: '/classes' },
        ],
    },
    {
        label: 'Học Thuật',
        icon: BookOpen,
        children: [
            { label: 'Môn Học', path: '/subjects' },
            { label: 'Phòng Học', path: '/rooms' },
        ],
    },
    {
        label: 'Vận Hành',
        icon: Zap,
        children: [
            { label: 'Lịch Học', path: '/schedules' },
            { label: 'Buổi Học', path: '/sessions' },
            { label: 'Điểm Danh', path: '/attendance' },
            { label: 'Đổi Lịch', path: '/reschedules' },
        ],
    },
    {
        label: 'Thi & Kiểm Tra',
        icon: FileCheck,
        children: [
            { label: 'Kỳ Thi', path: '/exams' },
            { label: 'Kết Quả Thi', path: '/exam-results' },
        ],
    },
    {
        label: 'Tài Chính',
        icon: DollarSign,
        children: [
            { label: 'Thanh Toán', path: '/payments' },
            { label: 'Gói Dịch Vụ', path: '/subscriptions' },
        ],
    },
    { label: 'Thống Kê Báo Cáo', path: '/statistics', icon: BarChart3 },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
];

// ─── Center Navigation ────────────────────────────────────────────────────────
const centerNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard },
    {
        label: 'Quản Lý',
        icon: Users,
        children: [
            { label: 'Giáo Viên', path: '/teachers' },
            { label: 'Học Sinh', path: '/students' },
            { label: 'Phòng Học', path: '/rooms' },
            { label: 'Lớp Học', path: '/classes' },
        ],
    },
    {
        label: 'Học Thuật',
        icon: BookOpen,
        children: [
            { label: 'Môn Học', path: '/subjects' },
            { label: 'Lịch Học', path: '/schedules' },
        ],
    },
    {
        label: 'Vận Hành',
        icon: Zap,
        children: [
            { label: 'Buổi Học', path: '/sessions' },
            { label: 'Đổi Lịch', path: '/reschedules' },
            { label: 'Điểm Danh', path: '/attendance' },
        ],
    },
    {
        label: 'Thi & Kiểm Tra',
        icon: FileCheck,
        children: [
            { label: 'Kỳ Thi', path: '/exams' },
            { label: 'Kết Quả Thi', path: '/exam-results' },
        ],
    },
    {
        label: 'Tài Chính',
        icon: DollarSign,
        children: [{ label: 'Thanh Toán & Gia Hạn', path: '/payments' }],
    },
    { label: 'Thống Kê Báo Cáo', path: '/statistics', icon: BarChart3 },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
];

// ─── Teacher Navigation ───────────────────────────────────────────────────────
const teacherNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard },
    {
        label: 'Giảng Dạy',
        icon: BookOpen,
        children: [
            { label: 'Lớp Học Của Tôi', path: '/classes' },
            { label: 'Học Sinh Của Tôi', path: '/students' },
            { label: 'Lịch Dạy', path: '/schedules' },
            { label: 'Điểm Danh', path: '/attendance' },
        ],
    },
    {
        label: 'Thi & Điểm Số',
        icon: FileCheck,
        children: [
            { label: 'Kỳ Thi', path: '/exams' },
            { label: 'Nhập Điểm Thi', path: '/exam-results' },
        ],
    },
    { label: 'Thông Báo', path: '/notifications', icon: Bell },
];

// ─── Student Navigation (Chỉ Dashboard và Chat nhóm lớp) ─────────────────────
const studentNav: NavItem[] = [
    { label: 'Bảng Điều Khiển', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Trò Chuyện Lớp Học', path: '/classes', icon: MessageSquare },
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

export function getNavigationItems(
    role: string | null,
    adminRole?: string | null,
): NavItem[] {
    if (!role) {
        return [];
    }

    switch (role) {
        case 'admin':
        case 'super_admin':
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

export function getAccountLabel(role: string | null, adminRole?: string | null): string {
    if (!role) {
        return 'Khách';
    }

    const labels: Record<string, string> = {
        admin: adminRole === 'super_admin' ? 'Super Admin' : 'Admin Trung Tâm',
        super_admin: 'Super Admin',
        center: 'Quản Lý Trung Tâm',
        teacher: 'Giáo Viên',
        student: 'Học Sinh',
    };

    return labels[role] ?? 'Người Dùng';
}

export function getAccountIcon(role: string | null): LucideIcon {
    const icons: Record<string, LucideIcon> = {
        admin: Lock,
        super_admin: Lock,
        center: Building2,
        teacher: BookOpen,
        student: User,
    };

    return icons[role ?? ''] ?? User;
}
