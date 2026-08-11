import { Link } from '@inertiajs/react';
import { Target, Heart, Award, ArrowRight } from 'lucide-react';
import React from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PublicLayout from '../../layouts/PublicLayout';

export const About: React.FC<any> = ({ company }) => {
    return (
        <PublicLayout title="Giới Thiệu - Hệ thống Quản lý Giáo dục Sam">
            {/* Header Section */}
            <section className="border-b border-gray-200 bg-slate-50 py-16">
                <div className="mx-auto max-w-7xl space-y-4 px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Về Chúng Tôi
                    </h1>
                    <p className="mx-auto max-w-2xl text-base text-gray-600">
                        Tìm hiểu về câu chuyện, tầm nhìn và sứ mệnh nâng tầm
                        quản lý giáo dục của{' '}
                        {company?.name || 'Công ty Cổ phần Giáo dục Sam'}.
                    </p>
                </div>
            </section>

            {/* Core Values & Vision Section */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <Card className="space-y-3 border-gray-200 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Target className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Tầm Nhìn
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Trở thành nền tảng SaaS quản lý giáo dục hàng
                                đầu tại Việt Nam, kết nối hơn 1.000 trung tâm
                                đào tạo đa cơ sở.
                            </p>
                        </Card>

                        <Card className="space-y-3 border-gray-200 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Heart className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Sứ Mệnh
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Đơn giản hóa mọi quy trình hành chính, điểm danh
                                và học phí để người quản lý tập trung nâng cao
                                chất lượng giảng dạy.
                            </p>
                        </Card>

                        <Card className="space-y-3 border-gray-200 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                <Award className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Giá Trị Cốt Lõi
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Đột phá công nghệ, Bảo mật dữ liệu nghiêm ngặt,
                                Đồng hành tận tâm cùng các nhà quản lý giáo dục.
                            </p>
                        </Card>
                    </div>

                    {/* Impressive Metrics Grid */}
                    <div className="grid grid-cols-2 gap-6 rounded-2xl bg-emerald-600 p-8 text-center text-white shadow-md md:grid-cols-4">
                        <div>
                            <div className="text-3xl font-extrabold">50+</div>
                            <div className="mt-1 text-xs text-emerald-100">
                                Trung Tâm Tin Dùng
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold">
                                10.000+
                            </div>
                            <div className="mt-1 text-xs text-emerald-100">
                                Học Sinh Quản Lý
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold">99.9%</div>
                            <div className="mt-1 text-xs text-emerald-100">
                                Thời Gian Uptime
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold">24/7</div>
                            <div className="mt-1 text-xs text-emerald-100">
                                Hỗ Trợ Kỹ Thuật
                            </div>
                        </div>
                    </div>

                    {/* Company Call to Action */}
                    <div className="space-y-4 pt-6 text-center">
                        <h3 className="text-xl font-bold text-gray-900">
                            Sẵn Sàng Trải Nghiệm Giáo Dục Sam?
                        </h3>
                        <div className="flex justify-center gap-4">
                            <Link href="/contact">
                                <Button
                                    variant="success"
                                    icon={<ArrowRight className="h-4 w-4" />}
                                >
                                    Đăng Ký Tư Vấn Ngay
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default About;
