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
        $appUrl = (string) config('app.url', 'https://www.samedu.io.vn');

        $seoEntries = [
            [
                'route_name'    => 'home',
                'title'         => 'Giải Pháp Quản Lý Trung Tâm Giáo Dục - SAM Digital',
                'description'   => 'Giải Pháp Quản Lý Trung Tâm Giáo Dục đột phá 2026. Tối ưu hóa quy trình quản lý học sinh, xếp lịch học, điểm danh thông minh.',
                'keywords'      => 'Giải Pháp Quản Lý Giáo Dục, phần mềm quản lý trung tâm, quản lý học sinh, điểm danh thông minh, SAM Digital, quản lý đào tạo 2026',
                'og_image'      => "{$appUrl}/images/og-home-banner.jpg",
                'canonical_url' => $appUrl,
            ],
            [
                'route_name'    => 'services',
                'title'         => 'Gói Cước & Dịch Vụ Phần Mềm Quản Lý Giáo Dục - SAM Digital',
                'description'   => 'Bảng giá dịch vụ phần mềm quản lý giáo dục minh bạch. Trải nghiệm 30 ngày dùng thử miễn phí, gói hàng tháng linh hoạt và gói năm tiết kiệm 20%.',
                'keywords'      => 'gói cước phần mềm giáo dục, bảng giá phần mềm quản lý trung tâm, dùng thử 30 ngày miễn phí, đăng ký gói SAM Digital',
                'og_image'      => "{$appUrl}/images/og-services-banner.jpg",
                'canonical_url' => "{$appUrl}/services",
            ],
            [
                'route_name'    => 'about',
                'title'         => 'Giới Thiệu SAM Digital - Nền Tảng Quản Trị Giáo Dục 2026',
                'description'   => 'Tìm hiểu về SAM Digital, sứ mệnh nâng tầm công nghệ vận hành giáo dục và giải pháp chuyển đổi số tối ưu cho các trung tâm đào tạo trên toàn quốc.',
                'keywords'      => 'về SAM Digital, công ty phần mềm giáo dục, giải pháp quản lý trung tâm, sứ mệnh SAM Digital, đối tác chuyển đổi số giáo dục',
                'og_image'      => "{$appUrl}/images/og-about-banner.jpg",
                'canonical_url' => "{$appUrl}/about",
            ],
            [
                'route_name'    => 'contact',
                'title'         => 'Liên Hệ Tư Vấn & Đăng Ký Dùng Thử Miễn Phí - SAM Digital',
                'description'   => 'Đăng ký nhận tư vấn trực tiếp và trải nghiệm giải pháp quản lý trung tâm giáo dục miễn phí 30 ngày. Đội ngũ chuyên gia SAM Digital hỗ trợ 24/7.',
                'keywords'      => 'liên hệ SAM Digital, tư vấn phần mềm quản lý trung tâm, đăng ký dùng thử 30 ngày, hotline hỗ trợ SAM Digital',
                'og_image'      => "{$appUrl}/images/og-contact-banner.jpg",
                'canonical_url' => "{$appUrl}/contact",
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
