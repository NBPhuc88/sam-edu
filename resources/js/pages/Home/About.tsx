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
            <section className="bg-slate-50 py-16 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Về Chúng Tôi</h1>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto">
                        Tìm hiểu về câu chuyện, tầm nhìn và sứ mệnh nâng tầm quản lý giáo dục của {company?.name || 'Công ty Cổ phần Giáo dục Sam'}.
                    </p>
                </div>
            </section>

            {/* Core Values & Vision Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="p-6 space-y-3 border-gray-200 text-center">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Tầm Nhìn</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Trở thành nền tảng SaaS quản lý giáo dục hàng đầu tại Việt Nam, kết nối hơn 1.000 trung tâm đào tạo đa cơ sở.
                            </p>
                        </Card>

                        <Card className="p-6 space-y-3 border-gray-200 text-center">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Sứ Mệnh</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Đơn giản hóa mọi quy trình hành chính, điểm danh và học phí để người quản lý tập trung nâng cao chất lượng giảng dạy.
                            </p>
                        </Card>

                        <Card className="p-6 space-y-3 border-gray-200 text-center">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Giá Trị Cốt Lõi</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Đột phá công nghệ, Bảo mật dữ liệu nghiêm ngặt, Đồng hành tận tâm cùng các nhà quản lý giáo dục.
                            </p>
                        </Card>
                    </div>

                    {/* Impressive Metrics Grid */}
                    <div className="bg-emerald-600 rounded-2xl p-8 text-white text-center grid grid-cols-2 md:grid-cols-4 gap-6 shadow-md">
                        <div>
                            <div className="text-3xl font-extrabold">50+</div>
                            <div className="text-xs text-emerald-100 mt-1">Trung Tâm Tin Dùng</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold">10.000+</div>
                            <div className="text-xs text-emerald-100 mt-1">Học Sinh Quản Lý</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold">99.9%</div>
                            <div className="text-xs text-emerald-100 mt-1">Thời Gian Uptime</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold">24/7</div>
                            <div className="text-xs text-emerald-100 mt-1">Hỗ Trợ Kỹ Thuật</div>
                        </div>
                    </div>

                    {/* Company Call to Action */}
                    <div className="text-center space-y-4 pt-6">
                        <h3 className="text-xl font-bold text-gray-900">Sẵn Sàng Trải Nghiệm Giáo Dục Sam?</h3>
                        <div className="flex justify-center gap-4">
                            <Link href="/contact">
                                <Button variant="success" icon={<ArrowRight className="w-4 h-4" />}>
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
