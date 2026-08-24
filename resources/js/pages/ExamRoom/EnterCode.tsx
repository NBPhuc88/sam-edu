import { Head, router } from '@inertiajs/react';
import { FileCheck, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import AppLayout from '@/layouts/AppLayout';

interface Props {
    errors?: Record<string, string>;
}

export default function EnterCode({ errors = {} }: Props) {
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsSubmitting(true);
        router.post(
            '/exam-room/join',
            { code: code.trim() },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Phòng Thi Trực Tuyến - SAM Digital">
            <Head title="Nhập Mã Phòng Thi" />

            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
                            <FileCheck className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            Phòng Thi Trực Tuyến
                        </h1>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            Nhập Mã Kỳ Thi hoặc Mã Truy Cập do Giáo viên / Trung tâm cung cấp để bắt đầu làm bài thi.
                        </p>
                    </div>

                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                    <KeyRound className="h-4 w-4 text-emerald-600" />
                                    Mã Phòng Thi / Mã Truy Cập (*)
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="VD: CE000000001 hoặc 682941"
                                    required
                                    autoFocus
                                    className="w-full text-center tracking-widest font-mono text-xl font-bold uppercase rounded-xl border border-gray-300 bg-slate-50/50 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                                />
                                {errors.code && (
                                    <p className="mt-2 text-xs font-medium text-red-600 text-center">
                                        {errors.code}
                                    </p>
                                )}
                                {errors.unauthorized && (
                                    <p className="mt-2 text-xs font-medium text-red-600 text-center">
                                        {errors.unauthorized}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="success"
                                size="lg"
                                className="w-full font-bold text-sm py-3"
                                isLoading={isSubmitting}
                                icon={<ArrowRight className="h-5 w-5" />}
                            >
                                Vào Phòng Thi
                            </Button>
                        </form>
                    </Card>

                    <div className="flex items-center justify-center gap-2 text-2xs text-gray-400 font-medium">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Hệ thống giám sát và bảo mật bài thi SAM Digital</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
