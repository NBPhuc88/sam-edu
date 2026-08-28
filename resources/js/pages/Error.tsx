import { Link } from '@inertiajs/react';
import { ArrowLeft,Home,ShieldAlert } from 'lucide-react';
import React from 'react';
import Button from '../components/ui/Button';

interface ErrorProps {
    status?: number;
    message?: string;
}

export const Error: React.FC<ErrorProps> = ({ status = 404, message }) => {
    const title =
        status === 403
            ? '403 - Truy cập bị từ chối'
            : '404 - Không tìm thấy trang';
    const defaultMessage =
        status === 403
            ? 'Bạn không có quyền truy cập vào tài nguyên này hoặc trung tâm đã hết hạn sử dụng.'
            : 'Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn URL không chính xác.';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center font-sans text-gray-900">
            <div className="max-w-md space-y-6">
                {/* Icon Container */}
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-red-100 bg-red-50 text-red-600 shadow-sm">
                    <ShieldAlert className="h-10 w-10" />
                </div>

                {/* Status Code & Title */}
                <div className="space-y-2">
                    <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
                        {status}
                    </h1>
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-600">
                        {message || defaultMessage}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-4">
                    <Link href="/dashboard">
                        <Button
                            variant="success"
                            icon={<Home className="h-4 w-4" />}
                        >
                            Về Trang Dashboard
                        </Button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="btn-base btn-secondary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </button>
                </div>

                <div className="pt-8 text-xs text-gray-400">
                    Multi-Center Student Management System © 2026
                </div>
            </div>
        </div>
    );
};

export default Error;
