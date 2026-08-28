import { zodResolver } from '@hookform/resolvers/zod';
import { router,usePage } from '@inertiajs/react';
import {
Building,
CheckCircle2,
Mail,
MapPin,
Phone,
Send,
User,
} from 'lucide-react';
import React,{ useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PublicLayout from '../../layouts/PublicLayout';

import { VIETNAMESE_PHONE_REGEX } from '../../utils/validation';

const contactSchema = z.object({
    full_name: z
        .string()
        .min(2, 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)')
        .max(50, 'Họ và tên không được vượt quá 50 ký tự'),
    phone: z
        .string()
        .min(1, 'Vui lòng nhập số điện thoại')
        .regex(VIETNAMESE_PHONE_REGEX, 'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912345678)'),
    email: z
        .string()
        .email('Email không đúng định dạng')
        .max(100, 'Email không được vượt quá 100 ký tự')
        .optional()
        .or(z.literal('')),
    center_name: z.string().max(100, 'Tên trung tâm không được vượt quá 100 ký tự').optional(),
    message: z.string().max(2000, 'Nội dung tin nhắn không được vượt quá 2000 ký tự').optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactProps {
    contactInfo?: {
        company_name?: string;
        address?: string;
        phone?: string;
        email?: string;
    };
}

export const Contact: React.FC<ContactProps> = ({ contactInfo }) => {
    const { flash } = usePage().props as any;
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            full_name: '',
            phone: '',
            email: '',
            center_name: '',
            message: '',
        },
    });

    const onSubmit = (data: ContactFormValues) => {
        router.post('/contact', data, {
            onSuccess: () => {
                setIsSubmitted(true);
                reset();
            },
        });
    };

    return (
        <PublicLayout title="Liên Hệ Tư Vấn Giải Pháp - SAM Digital">
            {/* Header */}
            <section className="border-b border-gray-200 bg-slate-50 py-10 sm:py-16">
                <div className="mx-auto max-w-7xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-extrabold text-gray-900 sm:text-4xl">
                        Liên Hệ Tư Vấn Giải Pháp
                    </h1>
                    <p className="mx-auto max-w-xl text-xs sm:text-sm text-gray-600">
                        Gửi câu hỏi hoặc yêu cầu tư vấn giải pháp quản lý cho trung tâm đào tạo của bạn. Đội ngũ chuyên viên SAM Digital sẽ hỗ trợ bạn 24/7.
                    </p>
                </div>
            </section>

            {/* Main Contact Section */}
            <section className="bg-white py-10 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
                        {/* Information Sidebar */}
                        <div className="space-y-6">
                            <Card className="space-y-4 border-gray-200 p-5 sm:p-6">
                                <h3 className="border-b border-gray-100 pb-3 text-base font-bold text-gray-900">
                                    Thông Tin Trụ Sở
                                </h3>

                                <div className="space-y-4 text-xs text-gray-700">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Đơn vị chủ quản
                                            </div>
                                            <div>
                                                {contactInfo?.company_name ||
                                                    'Công ty Cổ phần SAM Digital'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Địa chỉ trụ sở
                                            </div>
                                            <div>
                                                {contactInfo?.address ||
                                                    'Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Hà Nội'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Hotline tư vấn 24/7
                                            </div>
                                            <div className="font-bold text-emerald-700">
                                                {contactInfo?.phone ||
                                                    '0988.123.456'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Email hỗ trợ
                                            </div>
                                            <div>
                                                {contactInfo?.email ||
                                                    'phucstt01@gmail.com'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-xs text-emerald-900">
                                <h4 className="font-bold">Bạn đã sẵn sàng đăng ký trung tâm?</h4>
                                <p className="mt-1 text-emerald-800">
                                    Truy cập trang Đăng Ký Trung Tâm để khởi tạo mã trung tâm và chọn gói trải nghiệm ngay lập tức.
                                </p>
                                <a
                                    href="/register-center"
                                    className="mt-3 inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                                >
                                    Đăng ký trung tâm ngay →
                                </a>
                            </div>
                        </div>

                        {/* Contact Consultation Form */}
                        <div className="lg:col-span-2">
                            <Card className="border-gray-200 p-5 sm:p-8 shadow-xs">
                                {isSubmitted || flash?.success ? (
                                    <div className="space-y-4 py-8 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Gửi Yêu Cầu Tư Vấn Thành Công!
                                        </h3>
                                        <p className="mx-auto max-w-md text-xs text-gray-600 leading-relaxed">
                                            Cảm ơn bạn đã liên hệ với SAM Digital. Đội ngũ chuyên viên tư vấn sẽ phản hồi lại bạn trong thời gian sớm nhất.
                                        </p>
                                        <div className="pt-4">
                                            <Button
                                                variant="secondary"
                                                size="md"
                                                onClick={() => setIsSubmitted(false)}
                                            >
                                                Gửi câu hỏi khác
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Form Gửi Yêu Cầu Tư Vấn
                                            </h2>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Vui lòng điền thông tin bên dưới để nhận tư vấn chuyên sâu
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <Input
                                                label="Họ và tên người liên hệ (*)"
                                                placeholder="VD: Nguyễn Văn An"
                                                icon={<User className="h-4 w-4" />}
                                                error={errors.full_name?.message}
                                                {...register('full_name')}
                                            />

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
                                                <Input
                                                    label="Số điện thoại liên hệ (*)"
                                                    placeholder="VD: 0988123456"
                                                    icon={<Phone className="h-4 w-4" />}
                                                    error={errors.phone?.message}
                                                    {...register('phone')}
                                                />
                                                <Input
                                                    label="Email liên hệ"
                                                    type="email"
                                                    placeholder="VD: an.nguyen@email.com"
                                                    icon={<Mail className="h-4 w-4" />}
                                                    error={errors.email?.message}
                                                    {...register('email')}
                                                />
                                            </div>

                                            <Input
                                                label="Tên trung tâm đào tạo (Nếu có)"
                                                placeholder="VD: Trung tâm Ngoại ngữ Sam Cầu Giấy"
                                                icon={<Building className="h-4 w-4" />}
                                                error={errors.center_name?.message}
                                                {...register('center_name')}
                                            />

                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-semibold text-gray-700">
                                                    Nội dung cần tư vấn / Câu hỏi:
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        rows={4}
                                                        placeholder="Nhập nội dung thắc mắc hoặc yêu cầu tư vấn..."
                                                        className="w-full rounded-lg border border-gray-300 p-3 text-xs text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        {...register('message')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="success"
                                            size="lg"
                                            isLoading={isSubmitting}
                                            className="w-full justify-center py-3"
                                            icon={<Send className="h-5 w-5" />}
                                        >
                                            Gửi Yêu Cầu Tư Vấn
                                        </Button>
                                    </form>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default Contact;
