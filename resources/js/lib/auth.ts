/**
 * Auth Helper Functions - Kiểm tra Account Type & Role
 *
 * IMPORTANT: Không implement hasPermission() hoặc checkPermission()
 * Hệ thống không dùng dynamic RBAC.
 *
 * Phân quyền được kiểm soát ở Backend:
 * - Backend kiểm tra account_type + role
 * - Backend kiểm tra data scope (admin_centers, teacher classes, etc)
 * - Backend trả về dữ liệu đã lọc hoặc 403 Forbidden
 *
 * Frontend chỉ dùng các helper này để hiển thị UI phù hợp.
 *
 * Xem: .agents/AGENTS.md - Mục 6.1 Auth Helper Functions
 */

import type { Account } from '@/types/auth';

/**
 * Kiểm tra xem account có phải super_admin hay không
 */
export const isSuperAdmin = (account: Account | null): boolean => {
    return account?.account_type === 'admin' && account?.role === 'super_admin';
};

/**
 * Kiểm tra xem account có phải normal admin (role = admin) hay không
 */
export const isNormalAdmin = (account: Account | null): boolean => {
    return account?.account_type === 'admin' && account?.role === 'admin';
};

/**
 * Kiểm tra xem account có phải admin (super_admin hoặc admin) hay không
 */
export const isAdmin = (account: Account | null): boolean => {
    return account?.account_type === 'admin';
};

/**
 * Kiểm tra xem account có phải teacher hay không
 */
export const isTeacher = (account: Account | null): boolean => {
    return account?.account_type === 'teacher';
};

/**
 * Kiểm tra xem account có phải student hay không
 */
export const isStudent = (account: Account | null): boolean => {
    return account?.account_type === 'student';
};
