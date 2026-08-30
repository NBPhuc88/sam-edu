import { router } from '@inertiajs/react';
import { useCallback } from 'react';

/**
 * Hook hỗ trợ điều hướng quay lại thông minh (Smart Back Navigation):
 * 1. Ưu tiên kiểm tra tham số `return_url` hoặc `from` trên query URL hiện tại.
 * 2. Nếu không có, ưu tiên sử dụng `window.history.back()` để giữ nguyên lịch sử, state, filter, và trang trước đó.
 * 3. Nếu không có lịch sử (mở trực tiếp tab mới), điều hướng về fallbackUrl mặc định.
 */
export function useBackNavigation() {
    const goBack = useCallback((fallbackUrl: string = '/') => {
        if (typeof window === 'undefined') {
            return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        const returnUrl = searchParams.get('return_url') || searchParams.get('from');

        // Nếu có return_url an toàn (bắt đầu bằng /)
        if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
            router.visit(returnUrl);
            return;
        }

        // Nếu có lịch sử trình duyệt trong session
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        // Fallback về URL mặc định
        router.visit(fallbackUrl);
    }, []);

    return { goBack };
}

export default useBackNavigation;
