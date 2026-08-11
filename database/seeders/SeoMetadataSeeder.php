<?php

namespace Database\Seeders;

use App\Models\SeoMetadata;
use Illuminate\Database\Seeder;

class SeoMetadataSeeder extends Seeder
{
    /**
     * Seed initial comprehensive SEO metadata for all public pages.
     */
    public function run(): void
    {
        $appUrl = (string) config('app.url', 'https://sam-edu.test');

        $seoEntries = [
            [
                'route_name'    => 'home',
                'title'         => 'Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm - Giáo Dục Sam',
                'description'   => 'Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm đột phá 2026. Tối ưu hóa quy trình quản lý học sinh, xếp lịch học, điểm danh thông minh và tự động gia hạn gói dịch vụ qua ZaloPay QR Code v2.',
                'keywords'      => 'Giải Pháp Quản Lý Giáo Dục, phần mềm quản lý trung tâm, quản lý học sinh, điểm danh thông minh, Sam Edu, Giáo dục Sam, ZaloPay QR Code, quản lý đào tạo 2026',
                'og_image'      => "{$appUrl}/images/og-home-banner.jpg",
                'canonical_url' => $appUrl,
            ],
            [
                'route_name'    => 'services',
                'title'         => 'Gói Cước & Dịch Vụ Phần Mềm Quản Lý Giáo Dục - Giáo Dục Sam',
                'description'   => 'Bảng giá dịch vụ phần mềm quản lý giáo dục minh bạch. Trải nghiệm 14 ngày dùng thử miễn phí, gói hàng tháng linh hoạt và gói năm tiết kiệm 20% tự động gia hạn qua ZaloPay.',
                'keywords'      => 'gói cước phần mềm giáo dục, bảng giá phần mềm quản lý trung tâm, dùng thử 14 ngày miễn phí, thanh toán ZaloPay QR, đăng ký gói Sam Edu',
                'og_image'      => "{$appUrl}/images/og-services-banner.jpg",
                'canonical_url' => "{$appUrl}/services",
            ],
            [
                'route_name'    => 'about',
                'title'         => 'Giới Thiệu Công Ty Cổ Phần Giáo Dục Sam - Nền Tảng Giáo Dục 2026',
                'description'   => 'Tìm hiểu về Công ty Cổ phần Giáo dục Sam, sứ mệnh nâng tầm công nghệ vận hành giáo dục và giải pháp chuyển đổi số tối ưu cho các trung tâm đào tạo trên toàn quốc.',
                'keywords'      => 'về giáo dục sam, công ty phần mềm giáo dục, giải pháp quản lý trung tâm, sứ mệnh Sam Edu, đối tác chuyển đổi số giáo dục',
                'og_image'      => "{$appUrl}/images/og-about-banner.jpg",
                'canonical_url' => "{$appUrl}/about",
            ],
            [
                'route_name'    => 'contact',
                'title'         => 'Liên Hệ Tư Vấn & Đăng Ký Dùng Thử Miễn Phí - Giáo Dục Sam',
                'description'   => 'Đăng ký nhận tư vấn trực tiếp và trải nghiệm giải pháp quản lý giáo dục đa trung tâm miễn phí 14 ngày. Đội ngũ chuyên gia Giáo dục Sam hỗ trợ 24/7.',
                'keywords'      => 'liên hệ giáo dục sam, tư vấn phần mềm quản lý trung tâm, đăng ký dùng thử 14 ngày, hotline hỗ trợ Sam Edu',
                'og_image'      => "{$appUrl}/images/og-contact-banner.jpg",
                'canonical_url' => "{$appUrl}/contact",
            ],
            [
                'route_name'    => 'login',
                'title'         => 'Đăng Nhập Hệ Thống Quản Lý Giáo Dục Sam - Sam Edu Portal',
                'description'   => 'Cổng đăng nhập hệ thống dành cho Quản trị viên, Quản lý Trung tâm, Giáo viên và Học sinh. Truy cập an toàn và bảo mật.',
                'keywords'      => 'đăng nhập giáo dục sam, sam edu login, portal quản lý trung tâm, đăng nhập giáo viên, đăng nhập học sinh',
                'og_image'      => "{$appUrl}/images/og-login-banner.jpg",
                'canonical_url' => "{$appUrl}/login",
            ],
        ];

        foreach ($seoEntries as $seo) {
            SeoMetadata::updateOrCreate(
                ['route_name' => $seo['route_name']],
                $seo
            );
        }
    }
}
