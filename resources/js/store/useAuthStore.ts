import { create } from 'zustand';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
    id: number;
    username: string;
    email: string | null;
    full_name: string;
    role: UserRole;
    avatar?: string | null;
    center_id?: number | null;
    center_name?: string | null;
}

interface AuthState {
    user: UserProfile | null;
    role: UserRole;
    accessToken: string | null;
    setAuth: (user: UserProfile, token: string) => void;
    setRole: (role: UserRole) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: 'admin',
    accessToken: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
    setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token);
        }

        set({ user, role: user.role, accessToken: token });
    },
    setRole: (role) => set({ role }),
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
        }

        set({ user: null, accessToken: null });
    },
}));
