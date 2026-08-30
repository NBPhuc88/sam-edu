// Kiến trúc Account: 3 loại tài khoản độc lập (Admin, Giáo viên, Học sinh)
// Trung tâm (Center) là thực thể tổ chức được quản lý bởi Admin
export type AccountType = 'admin' | 'teacher' | 'student';

// AdminRole chỉ áp dụng cho account_type = 'admin' (1 = Super Admin, 2 = Admin Quản trị)
export type AdminRole = 1 | 2;

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
