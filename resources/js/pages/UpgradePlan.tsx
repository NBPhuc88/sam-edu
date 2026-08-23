import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    GraduationCap,
    Lock,
    MessageSquare,
    PhoneCall,
    ShieldAlert,
    Sparkles,
    Zap,
} from 'lucide-react';
import React from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface UpgradePlanProps {
    status?: number;
    reason?: 'expired' | 'feature_locked';
    title?: string;
    feature?: string;
    featureName?: string;
    message?: string;
    currentPlan?: string;
    planType?: string;
    requiredPlan?: string;
}

export default function UpgradePlan({
    status = 403,
    reason = 'feature_locked',
    title = 'Tính Năng Yêu Cầu Nâng Cấp Gói',
    featureName = 'Tính Năng Cao Cấp',
    message,
    currentPlan,
    planType,
    requiredPlan = 'advanced',
}: UpgradePlanProps) {
    const { contactInfo } = usePage().props as any;

    const isExpired = reason === 'expired';

    const getFeatureIcon = () => {
        if (isExpired) {
            return Clock;
        }
        if (featureName?.includes('CSV') || featureName?.includes('Xuất')) {
            return FileSpreadsheet;
        }
        if (featureName?.includes('Chat')) {
            return MessageSquare;
        }
        if (featureName?.includes('Thi') || featureName?.includes('Đề')) {
            return GraduationCap;
        }
        return Lock;
    };

    const FeatureIcon = getFeatureIcon();

    const advancedFeatures = [
        {
            title: 'Kho đề thi & Phòng thi trực tuyến',
            desc: '9 dạng câu hỏi (trắc nghiệm, audio, ghép nối, sắp xếp...), tự động tính giờ và chấm điểm.',
            icon: GraduationCap,
        },
        {
            title: 'Chat nhóm lớp học thời gian thực',
            desc: 'Trao đổi trao đổi thông tin, hỏi đáp bài tập và ghim thông báo quan trọng giữa giáo viên và học sinh.',
            icon: MessageSquare,
        },
        {
            title: 'Xuất dữ liệu định dạng CSV',
            desc: 'Xuất danh sách giáo viên, học sinh và báo cáo học viên nhanh chóng phục vụ lưu trữ.',
            icon: FileSpreadsheet,
        },
        {
            title: 'Hỗ trợ kỹ thuật ưu tiên 24/7',
            desc: 'Hỗ trợ vận hành trực tiếp từ đội ngũ chuyên gia Sam Edu.',
            icon: Zap,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
            <Head title={title} />

            <div className="w-full max-w-3xl">
                {/* Header Card */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-xs mb-5 animate-pulse">
                        <FeatureIcon className="h-10 w-10" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {isExpired ? 'Gói Hết Hạn (Mã 403)' : 'Nâng Cấp Gói Dịch Vụ'}
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                        {title}
                    </h1>

                    <p className="mt-3 text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
                        {message ||
                            (isExpired
                                ? 'Gói dịch vụ của trung tâm đã hết hạn. Vui lòng liên hệ Quản trị viên hệ thống để gia hạn.'
                                : `Tính năng '${featureName}' chỉ hỗ trợ từ Gói Nâng Cao trở lên. Vui lòng liên hệ Quản trị viên hệ thống để nâng cấp.`)}
                    </p>
                </div>

                {/* Content Box */}
                <Card className="border-gray-200/80 shadow-lg rounded-2xl overflow-hidden bg-white mb-8">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Gói hiện tại của Trung tâm
                                </span>
                                <div className="text-lg font-bold text-gray-900 mt-0.5">
                                    {planType === 'trial'
                                        ? 'Gói Dùng Thử (Trial)'
                                        : planType === 'basic'
                                          ? 'Gói Cơ Bản (Basic)'
                                          : planType === 'advanced'
                                            ? 'Gói Nâng Cao (Advanced)'
                                            : currentPlan || 'Gói Cơ Bản'}
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                    Gói yêu cầu
                                </span>
                                <div className="text-lg font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
                                    <Sparkles className="h-4 w-4" />
                                    {requiredPlan === 'advanced' ? 'Gói Nâng Cao' : 'Gói Đang Hoạt Động'}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                            Đặc quyền khi nâng cấp lên Gói Nâng Cao:
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {advancedFeatures.map((item, idx) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-emerald-200 transition-colors"
                                    >
                                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                                            <ItemIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                {item.title}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                                {item.desc}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Contact Callout */}
                        <div className="mt-8 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 text-center sm:text-left">
                                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <PhoneCall className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">
                                        Cần hỗ trợ nâng cấp hoặc gia hạn ngay?
                                    </div>
                                    <div className="text-xs text-gray-600 mt-0.5">
                                        Hotline:{' '}
                                        <span className="font-semibold text-emerald-700">
                                            {contactInfo?.phone || '0988.123.456'}
                                        </span>{' '}
                                        · Email:{' '}
                                        <span className="font-semibold text-emerald-700">
                                            {contactInfo?.email || 'support@sam-edu.vn'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Footer Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/dashboard">
                        <Button variant="secondary" className="w-full sm:w-auto px-6 py-2.5 flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Quay về Bảng Điều Khiển
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
