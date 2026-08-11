import type { Account } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            // Dùng 'account' thay vì 'auth.user' — kiến trúc không có bảng users
            account: Account | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
