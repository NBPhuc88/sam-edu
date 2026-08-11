// Kiến trúc Account: 4 loại tài khoản độc lập - KHÔNG dùng bảng users
// Xem chi tiết: .agents/AGENTS.md - Mục 2.1 & 2.2

export type AccountType = 'admin' | 'center' | 'teacher' | 'student';

// AdminRole chỉ áp dụng cho account_type = 'admin'
export type AdminRole = 'super_admin' | 'admin';

export interface Account {
    account_type: AccountType;
    account_id: number;
    role?: AdminRole; // Chỉ tồn tại khi account_type = 'admin'
    name: string;
}

export interface AuthState {
    account: Account | null;
    isAuthenticated: boolean;
    login: (account: Account, token: string) => void;
    logout: () => void;
}
