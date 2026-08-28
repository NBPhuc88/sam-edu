/**
 * Auth Store - Zustand
 *
 * Quản lý trạng thái đăng nhập theo kiến trúc Account thay vì User.
 * Hệ thống có 4 loại tài khoản: admin, center, teacher, student.
 *
 * Xem: .agents/AGENTS.md - Mục 6.1 Auth Store (Zustand)
 */

import type { Account,AuthState } from '@/types/auth';
import { create } from 'zustand';

export const useAuthStore = create<AuthState>((set) => ({
    account: null,
    isAuthenticated: false,

    login: (account: Account, token: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('account', JSON.stringify(account));
        }

        set({ account, isAuthenticated: true });
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('account');
        }

        set({ account: null, isAuthenticated: false });
    },
}));
