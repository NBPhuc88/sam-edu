import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { MapPin, Phone, Mail, CheckCircle2, Send, Building } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PublicLayout from '../../layouts/PublicLayout';

const contactSchema = z.object({
    full_name: z.string().min(2, 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)'),
    phone: z.string().min(8, 'Vui lòng nhập số điện thoại hợp lệ'),
    email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
    center_name: z.string().optional(),
    message: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export const Contact: React.FC<any> = ({ contactInfo }) => {
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
        <PublicLayout title="Liên Hệ Tư Vấn - Hệ thống Quản lý Giáo dục Sam">
            {/* Header */}
            <section className="bg-slate-50 py-12 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Liên Hệ Tư Vấn & Dùng Thử</h1>
                    <p className="text-sm text-gray-600 max-w-xl mx-auto">
                        Điền thông tin vào form bên dưới để đăng ký tư vấn giải pháp quản lý trung tâm hoặc nhận 14 ngày dùng thử miễn phí.
                    </p>
                </div>
            </section>

            {/* Main Contact Content */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Contact Information Cards (Loaded from Database) */}
                        <div className="space-y-6">
                            <Card className="p-6 space-y-4 border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                                    Thông Tin Trụ Sở
                                </h3>

                                <div className="space-y-4 text-xs text-gray-700">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Đơn vị chủ quản</div>
                                            <div>{contactInfo?.company_name || 'Công ty Cổ phần Giáo dục Sam'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Địa chỉ văn phòng</div>
                                            <div>{contactInfo?.address || 'Tòa nhà Sam Tower, Hà Nội'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Hotline hỗ trợ 24/7</div>
                                            <div className="text-emerald-700 font-bold">{contactInfo?.phone || '0988.123.456'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Email tư vấn</div>
                                            <div>{contactInfo?.email || 'hotro@giaoducsam.vn'}</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                                <div className="font-bold text-emerald-950">Cam kết tư vấn:</div>
                                <div>• Phản hồi yêu cầu trong vòng 30 phút.</div>
                                <div>• Hướng dẫn khởi tạo trung tâm dùng thử 14 ngày miễn phí.</div>
                            </div>
                        </div>

                        {/* Consultation Form Card */}
                        <div className="lg:col-span-2">
                            <Card className="p-6 sm:p-8 border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Đăng Ký Tư Vấn / Nhận Dùng Thử
                                </h3>

                                {/* Success Banner notification */}
                                {(isSubmitted || flash?.success) && (
                                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <span>
                                            {flash?.success ||
                                                'Cảm ơn bạn! Yêu cầu tư vấn đã được lưu vào hệ thống. Đội ngũ Giáo Dục Sam sẽ liên hệ lại ngay!'}
                                        </span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Họ và tên *"
                                            placeholder="VD: Nguyễn Văn A"
                                            error={errors.full_name?.message}
                                            {...register('full_name')}
                                        />

                                        <Input
                                            label="Số điện thoại liên hệ *"
                                            placeholder="VD: 0912345678"
                                            error={errors.phone?.message}
                                            {...register('phone')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Email nhận thông tin"
                                            placeholder="VD: nguyenvana@gmail.com"
                                            error={errors.email?.message}
                                            {...register('email')}
                                        />

                                        <Input
                                            label="Tên trung tâm / Cơ sở"
                                            placeholder="VD: Trung tâm Anh ngữ Sam"
                                            error={errors.center_name?.message}
                                            {...register('center_name')}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-900">
                                            Nội dung yêu cầu / Ghi chú
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Nhập nhu cầu quản lý hoặc câu hỏi của bạn..."
                                            className="ui-input"
                                            {...register('message')}
                                        />
                                    </div>

                                    <div className="pt-3">
                                        <Button
                                            type="submit"
                                            variant="success"
                                            isLoading={isSubmitting}
                                            icon={<Send className="w-4 h-4" />}
                                            className="w-full sm:w-auto px-8"
                                        >
                                            Gửi Yêu Cầu Tư Vấn
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default Contact;
