<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemContentSeeder extends Seeder
{
    /**
     * Seed the application's global configuration, SEO, plans and permissions.
     */
    public function run(): void
    {
        // 1. System Settings & Contact Info
        $settings = [
            [
                'key'         => 'hero_title',
                'value'       => 'Hệ Thống Quản Lý Giáo Dục Đa Trung Tâm Sam',
                'group'       => 'homepage',
                'description' => 'Tiêu đề banner chính',
            ],
            [
                'key'         => 'hero_subtitle',
                'value'       => 'Giải pháp SaaS toàn diện tối ưu hóa quy trình quản lý học viên, sắp xếp thời khóa biểu thông minh, điểm danh, tổ chức kỳ thi 4 kỹ năng và.',
                'group'       => 'homepage',
                'description' => 'Mô tả banner chính',
            ],
            [
                'key'         => 'promo_banner_text',
                'value'       => 'Chương trình Khuyến Mãi 2026 - Giảm 20% khi đăng ký gói 1 năm + 14 ngày trải nghiệm dùng thử miễn phí',
                'group'       => 'promotions',
                'description' => 'Thông báo banner khuyến mãi',
            ],
            [
                'key'         => 'company_name',
                'value'       => 'Công ty Cổ phần Công nghệ Giáo dục Sam (Sam Edu JSC)',
                'group'       => 'company',
                'description' => 'Tên công ty',
            ],
            [
                'key'         => 'contact_address',
                'value'       => 'Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Q. Cầu Giấy, Hà Nội',
                'group'       => 'contact',
                'description' => 'Địa chỉ trụ sở',
            ],
            [
                'key'         => 'contact_phone',
                'value'       => '0988.123.456',
                'group'       => 'contact',
                'description' => 'Hotline tư vấn',
            ],
            [
                'key'         => 'contact_email',
                'value'       => 'support@sam-edu.vn',
                'group'       => 'contact',
                'description' => 'Email hỗ trợ',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // 2. Seed Default SEO Metadata
        $this->call(SeoMetadataSeeder::class);

        // 3. Seed Permissions & Role Bindings
        $this->call(PermissionSeeder::class);

        // 4. Subscription Plans
        $this->call(SubscriptionPlanSeeder::class);
    }
}
