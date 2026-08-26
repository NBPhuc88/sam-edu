/**
 * Dynamic Navigation Configuration
 *
 * Menu sidebar động hoàn toàn (100% Dynamic).
 * Tự động lọc từ Master Navigation Tree dựa trên danh sách quyền permissions từ Database.
 * Không fix cứng menu theo vai trò.
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
    Sliders,
    User,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string;
    path?: string;
    icon?: LucideIcon;
    permission?: string;
    planFeature?: string;
    children?: NavItem[];
}

// ─── Master Navigation Tree (Cây Menu Toàn Cục Duy Nhất) ───────────────────
export const masterNavigation: NavItem[] = [
    {
        label: 'Bảng Điều Khiển',
        path: '/dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard.index',
    },
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
        label: 'Kho Đề Thi',
        icon: Sliders,
        path: '/exams',
        permission: 'exams.index',
        planFeature: 'exams',
    },
    {
        label: 'Thi & Chấm Thi',
        icon: FileCheck,
        children: [
            { label: 'Kỳ Thi Lớp Học', path: '/class-exams', permission: 'class-exams.index', planFeature: 'class-exams' },
            { label: 'Chấm Bài Thi', path: '/grading', permission: 'grading.index', planFeature: 'grading' },
            { label: 'Chấm Bài Thi Giấy', path: '/grading/offline/create', permission: 'grading.create', planFeature: 'grading' },
            { label: 'Vào Phòng Thi', path: '/exam-room', permission: 'online-exam.enter', planFeature: 'online-exam' },
            { label: 'Thi Thử / Luyện Tập', path: '/practice-exams', permission: 'practice-exams.index', planFeature: 'practice-exams' },
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
    {
        label: 'Thống Kê Báo Cáo',
        path: '/statistics',
        icon: BarChart3,
        permission: 'statistics.index',
    },
    {
        label: 'Nhóm Chat',
        path: '/chats',
        icon: MessageSquare,
        permission: 'classes.chat',
        planFeature: 'chat',
    },
    {
        label: 'Thông Báo',
        path: '/notifications',
        icon: Bell,
    },
    {
        label: 'Cài Đặt',
        icon: Settings,
        children: [
            { label: 'Cài Đặt Hệ Thống', path: '/settings', permission: 'settings.index' },
        ],
    },
];

/**
 * Lọc danh sách menu theo quyền động và gói dịch vụ.
 * - Super Admin luôn thấy toàn bộ menu.
 * - Các vai trò khác chỉ thấy menu mà họ được cấp quyền trong Database VÀ gói dịch vụ của Trung tâm cho phép.
 * - Nhóm cha có children tự động ẩn nếu không có menu con nào hợp lệ.
 */
function filterNavItemsByPermissionsAndPlan(
    items: NavItem[],
    permissions: string[],
    isSuperAdmin: boolean,
    allowedFeatures: string[] = [],
    isTrial: boolean = false,
): NavItem[] {
    if (isSuperAdmin) {
        return items;
    }

    const filtered: NavItem[] = [];

    for (const item of items) {
        // Item đơn không có children
        if (!item.children || item.children.length === 0) {
            if (item.planFeature && !isTrial && !allowedFeatures.includes(item.planFeature)) {
                continue;
            }
            if (!item.permission || permissions.includes(item.permission)) {
                filtered.push(item);
            }
            continue;
        }

        // Item có children: lọc theo quyền permissions của role và tính năng gói
        const validChildren = item.children.filter((child) => {
            if (child.planFeature && !isTrial && !allowedFeatures.includes(child.planFeature)) {
                return false;
            }
            if (!child.permission) {
                return true;
            }
            return permissions.includes(child.permission);
        });

        // Chỉ hiển thị nhóm cha nếu có ít nhất 1 menu con được cấp quyền
        if (validChildren.length > 0) {
            filtered.push({
                ...item,
                children: validChildren,
            });
        }
    }

    return filtered;
}

/**
 * Lấy danh sách menu động cho người dùng hiện tại dựa trên permissions và gói dịch vụ.
 */
export function getNavigationItems(
    role: string | null,
    adminRole?: string | null,
    permissions: string[] = [],
    allowedFeatures: string[] = [],
    planType?: string | null,
): NavItem[] {
    if (!role) {
        return [];
    }

    const isSuperAdmin = role === 'admin' && adminRole === 'super_admin';
    const isTrial = planType === 'trial';

    return filterNavItemsByPermissionsAndPlan(masterNavigation, permissions, isSuperAdmin, allowedFeatures, isTrial);
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
