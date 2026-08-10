import { Link } from '@inertiajs/react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import React from 'react';
import Button from '../components/ui/Button';

interface ErrorProps {
    status?: number;
    message?: string;
}

export const Error: React.FC<ErrorProps> = ({ status = 404, message }) => {
    const title = status === 403 ? '403 - Truy cập bị từ chối' : '404 - Không tìm thấy trang';
    const defaultMessage =
        status === 403
            ? 'Bạn không có quyền truy cập vào tài nguyên này hoặc trung tâm đã hết hạn sử dụng.'
            : 'Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn URL không chính xác.';

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans text-gray-900">
            <div className="max-w-md space-y-6">
                {/* Icon Container */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 text-red-600 border border-red-100 shadow-sm">
                    <ShieldAlert className="w-10 h-10" />
                </div>

                {/* Status Code & Title */}
                <div className="space-y-2">
                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">{status}</h1>
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                        {message || defaultMessage}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-4">
                    <Link href="/dashboard">
                        <Button variant="success" icon={<Home className="w-4 h-4" />}>
                            Về Trang Dashboard
                        </Button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="btn-base btn-secondary"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                </div>

                <div className="text-xs text-gray-400 pt-8">
                    Multi-Center Student Management System © 2026
                </div>
            </div>
        </div>
    );
};

export default Error;
