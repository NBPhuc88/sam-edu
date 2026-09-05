import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { PLAN_TYPE_LABELS } from '@/constants/enums';
import AppLayout from '@/layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    GraduationCap,
    Home,
    Lock,
    MessageSquare,
    PhoneCall,
    ShieldAlert,
    Sparkles,
    Zap,
} from 'lucide-react';
import React from 'react';

interface UpgradePlanProps {
    status?: number;
    reason?: 'expired' | 'feature_locked';
    title?: string;
    feature?: string;
    featureName?: string;
    message?: string;
    currentPlan?: string;
    currentPlanId?: number | null;
    planType?: number | null;
    requiredPlan?: string;
}

export default function UpgradePlan({
    status = 403,
    reason = 'feature_locked',
    title = 'Tính Năng Yêu Cầu Nâng Cấp Gói',
    featureName = 'Tính Năng Cao Cấp',
    message,
    currentPlan,
    currentPlanId,
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
        if (featureName?.includes('Đấu trường') || featureName?.includes('Game')) {
            return Zap;
        }
        if (featureName?.includes('Thi') || featureName?.includes('Đề') || featureName?.includes('Chấm')) {
            return GraduationCap;
        }
        return Lock;
    };

    const FeatureIcon = getFeatureIcon();

    const advancedFeatures = [
        {
            title: 'Kho đề thi, kỳ thi lớp học & chấm điểm',
            desc: 'Quản lý ngân hàng đề thi mẫu, giao đề thi cho lớp học và chấm điểm bài thi tự luận, âm thanh và bài thi giấy.',
            icon: GraduationCap,
        },
        {
            title: 'Đấu trường trực tiếp thời gian thực',
            desc: 'Tổ chức các trận đấu câu hỏi tương tác trực tiếp với hiệu ứng đỉnh cao, bảng xếp hạng và tính điểm tốc độ.',
            icon: Zap,
        },
        {
            title: 'Phòng thi trực tuyến & Thi thử',
            desc: 'Tham gia phòng thi thời gian thực với 9 dạng câu hỏi, đếm ngược thời gian, tự động lưu bài và luyện tập thi thử công khai.',
            icon: GraduationCap,
        },
        {
            title: 'Chat nhóm lớp học thời gian thực',
            desc: 'Trao đổi thông tin, hỏi đáp bài tập và ghim thông báo quan trọng giữa giáo viên và học sinh.',
            icon: MessageSquare,
        },
        {
            title: 'Xuất & Nhập dữ liệu định dạng CSV',
            desc: 'Xuất danh sách giáo viên, học sinh, nhập liệu tự động và báo cáo học viên nhanh chóng phục vụ lưu trữ.',
            icon: FileSpreadsheet,
        },
        {
            title: 'Hỗ trợ kỹ thuật ưu tiên 24/7',
            desc: 'Hỗ trợ vận hành trực tiếp từ đội ngũ chuyên gia SAM Digital.',
            icon: Zap,
        },
    ];

    return (
        <AppLayout title={title}>
            <div className="space-y-6">
                <PageHeader
                    title={title}
                    subtitle={
                        isExpired
                            ? 'Gói dịch vụ của trung tâm đã hết hạn. Vui lòng liên hệ quản trị viên để gia hạn.'
                            : `Tính năng '${featureName}' yêu cầu trung tâm nâng cấp lên gói dịch vụ nâng cao.`
                    }
                    breadcrumbs={[
                        { label: 'Bảng điều khiển', href: '/dashboard' },
                        { label: 'Nâng cấp gói dịch vụ' },
                    ]}
                />

                <div className="max-w-4xl mx-auto">
                    {/* Header Banner Card */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-xs mb-4">
                            <FeatureIcon className="h-10 w-10" />
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {isExpired ? 'Gói Hết Hạn' : 'Nâng Cấp Gói Dịch Vụ'}
                        </div>

                        <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
                            {message ||
                                (isExpired
                                    ? 'Gói dịch vụ của trung tâm đã hết hạn. Vui lòng liên hệ Quản trị viên hệ thống để gia hạn.'
                                    : `Tính năng '${featureName}' chỉ hỗ trợ từ Gói Nâng Cao trở lên. Vui lòng liên hệ Quản trị viên hệ thống để nâng cấp.`)}
                        </p>
                    </div>

                    {/* Content Detail Card */}
                    <Card className="border-gray-200/80 shadow-md rounded-2xl overflow-hidden bg-white mb-6">
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-5 mb-6 gap-4">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Gói hiện tại của Trung tâm
                                    </span>
                                    <div className="text-lg font-bold text-gray-900 mt-0.5">
                                        {currentPlan ||
                                            (planType && PLAN_TYPE_LABELS[Number(planType)]
                                                ? PLAN_TYPE_LABELS[Number(planType)]
                                                : 'Gói Cơ Bản')}
                                    </div>
                                </div>

                                <div className="sm:text-right">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                        Gói yêu cầu
                                    </span>
                                    <div className="text-lg font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
                                        <Sparkles className="h-4 w-4 text-emerald-600" />
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
                        <Button
                            variant="secondary"
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay Lại Trang Trước
                        </Button>
                        <Link href="/dashboard">
                            <Button
                                variant="success"
                                className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Về Bảng Điều Khiển
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
