<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
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
                'value'       => 'Giải pháp SaaS toàn diện tối ưu hóa quy trình quản lý học viên, sắp xếp thời khóa biểu thông minh, điểm danh, tổ chức kỳ thi 4 kỹ năng và thu học phí tự động.',
                'group'       => 'homepage',
                'description' => 'Mô tả banner chính',
            ],
            [
                'key'         => 'promo_banner_text',
                'value'       => 'Chương trình Khuyến Mãi 2026 - Giảm 30% khi đăng ký gói 1 năm + 14 ngày trải nghiệm dùng thử miễn phí',
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
        SubscriptionPlan::query()->delete();

        $plans = [
            [
                'code'          => 'trial_14d',
                'name'          => 'Gói Dùng Thử (Trial 14 Ngày)',
                'price'         => 0,
                'yearly_price'  => 0,
                'duration_days' => 14,
                'max_students'  => 30,
                'max_classes'   => 3,
                'features'      => [
                    'Trải nghiệm 14 ngày dùng thử miễn phí đầy đủ tính năng',
                    'Quản lý 1 trung tâm đào tạo',
                    'Tối đa 30 học sinh cùng lúc & 3 lớp học cùng lúc',
                    'Điểm danh & Quản lý lớp học cơ bản',
                    'Hỗ trợ kỹ thuật qua Email',
                ],
                'badge_text'  => 'DÙNG THỬ 14 NGÀY',
                'is_featured' => false,
            ],
            [
                'code'          => 'standard',
                'name'          => 'Gói Tiêu Chuẩn (Standard)',
                'price'         => 500000,
                'yearly_price'  => 4800000,
                'duration_days' => 30,
                'max_students'  => 200,
                'max_classes'   => 15,
                'features'      => [
                    'Thanh toán linh hoạt theo tháng (500.000đ/tháng) hoặc năm (4.800.000đ/năm - Tiết kiệm 20%)',
                    'Thời hạn 30 ngày / tháng',
                    'Quản lý 1 trung tâm đào tạo',
                    'Tối đa 200 học sinh cùng lúc & 15 lớp học cùng lúc',
                    'Điểm danh, Sĩ số & Quản lý thu học phí',
                    'Tổ chức bài kiểm tra & chấm điểm trực tuyến',
                    'Hỗ trợ hotline 24/7',
                ],
                'badge_text'  => 'PHỔ BIẾN NHẤT',
                'is_featured' => true,
            ],
            [
                'code'          => 'pro',
                'name'          => 'Gói Chuyên Nghiệp (Pro)',
                'price'         => 900000,
                'yearly_price'  => 8640000,
                'duration_days' => 30,
                'max_students'  => 500,
                'max_classes'   => 40,
                'features'      => [
                    'Tiết kiệm 20% khi thanh toán cả năm (8.640.000đ/năm)',
                    'Thời hạn 30 ngày / tháng',
                    'Quản lý trung tâm quy mô vừa và lớn',
                    'Tối đa 500 học sinh cùng lúc & 40 lớp học cùng lúc',
                    'Báo cáo thống kê chuyên sâu & Phân tích chuyên cần',
                    'Ngân hàng đề thi 9 dạng câu hỏi & Kỳ thi 4 kỹ năng',
                    'Cổng thanh toán ZaloPay QR Code v2',
                ],
                'badge_text'  => 'DOANH NGHIỆP',
                'is_featured' => false,
            ],
            [
                'code'          => 'enterprise',
                'name'          => 'Gói Doanh Nghiệp (Enterprise)',
                'price'         => 2000000,
                'yearly_price'  => 19200000,
                'duration_days' => 30,
                'max_students'  => 2000,
                'max_classes'   => 150,
                'features'      => [
                    'Hệ thống chuỗi trung tâm đào tạo lớn',
                    'Tối đa 2.000 học sinh cùng lúc & 150 lớp học cùng lúc',
                    'Tích hợp tên miền riêng & Tùy biến thương hiệu',
                    'Hạ tầng server riêng biệt & SLA 99.9%',
                    'Dedicated Account Manager hỗ trợ 1-1',
                ],
                'badge_text'  => 'KHÔNG GIỚI HẠN',
                'is_featured' => false,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::create($plan);
        }
    }
}
