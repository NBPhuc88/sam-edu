import { usePage } from '@inertiajs/react';

interface CenterSharedData {
    id: number;
    code: string;
    name: string;
    subscription_plan?: string | null;
    plan_type?: 'trial' | 'basic' | 'advanced' | null;
    allowed_features?: string[];
    max_classes?: number | null;
    max_students?: number | null;
    expires_at?: string | null;
    is_expired?: boolean;
    expiring_soon?: boolean;
    expiring_1day?: boolean;
    days_remaining?: number;
}

interface PageProps {
    auth?: {
        user?: {
            id: number;
            role: string;
            admin_role?: string | null;
        } | null;
        role?: string | null;
    };
    center?: CenterSharedData | null;
}

/**
 * Custom hook kiểm tra xem trung tâm của người dùng hiện tại có được phép sử dụng tính năng này không.
 *
 * - Super Admin (hoặc người dùng không thuộc trung tâm nào) luôn có toàn quyền (true).
 * - Gói Dùng Thử (trial) luôn mở khóa toàn bộ tính năng (true).
 * - Gói trả phí (basic, advanced) sẽ kiểm tra theo danh sách `allowed_features`.
 */
export function usePlanFeature(featureCode: string): boolean {
    const { auth, center } = usePage().props as unknown as PageProps;

    // Super Admin có toàn quyền truy cập
    if (auth?.role === 'admin' && auth?.user?.admin_role === 'super_admin') {
        return true;
    }

    // Không thuộc trung tâm nào
    if (!center) {
        return true;
    }

    // Gói Dùng Thử mở khóa tất cả tính năng
    if (center.plan_type === 'trial' || center.subscription_plan === 'trial') {
        return true;
    }

    const allowedFeatures = center.allowed_features ?? [];

    return allowedFeatures.includes(featureCode);
}

/**
 * Tiện ích kiểm tra nhanh quyền Xuất file CSV (export_csv).
 */
export function useCanExportCsv(): boolean {
    return usePlanFeature('export_csv');
}

/**
 * Tiện ích kiểm tra nhanh quyền Nhập file CSV (export_csv).
 */
export function useCanImportCsv(): boolean {
    return usePlanFeature('export_csv');
}

/**
 * Tiện ích kiểm tra nhanh quyền sử dụng công cụ CSV.
 */
export function useCanUseCsv(): boolean {
    return usePlanFeature('export_csv');
}

/**
 * Tiện ích kiểm tra nhanh quyền sử dụng Kho đề thi (exams).
 */
export function useCanUseExams(): boolean {
    return usePlanFeature('exams');
}

/**
 * Tiện ích kiểm tra nhanh quyền Quản lý kỳ thi lớp học (class-exams).
 */
export function useCanUseClassExams(): boolean {
    return usePlanFeature('class-exams');
}

/**
 * Tiện ích kiểm tra nhanh quyền Chấm điểm bài thi (grading).
 */
export function useCanGradeExams(): boolean {
    return usePlanFeature('grading');
}

/**
 * Tiện ích kiểm tra nhanh quyền Tham gia phòng thi trực tuyến (online-exam).
 */
export function useCanTakeOnlineExam(): boolean {
    return usePlanFeature('online-exam');
}

/**
 * Tiện ích kiểm tra nhanh quyền Luyện tập & Thi thử (practice-exams).
 */
export function useCanTakePracticeExam(): boolean {
    return usePlanFeature('practice-exams');
}

/**
 * Tiện ích kiểm tra nhanh quyền Chat nhóm lớp học (chat).
 */
export function useCanUseChat(): boolean {
    return usePlanFeature('chat');
}
