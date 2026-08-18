<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Center;

use App\Models\SchoolClass;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemContentSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // System Settings Banners & Contact Info
        $settings = [
            [
                'key'         => 'hero_title',
                'value'       => 'Giải Pháp Quản Lý Giáo Dục',
                'group'       => 'homepage',
                'description' => 'Tiêu đề banner chính',
            ],
            [
                'key'         => 'hero_subtitle',
                'value'       => 'Hệ thống tối ưu hóa quy trình quản lý học sinh, sắp xếp lịch học, điểm danh thông minh và tự động gia hạn gói dịch vụ qua ZaloPay QR Code.',
                'group'       => 'homepage',
                'description' => 'Mô tả banner chính',
            ],
            [
                'key'         => 'promo_banner_text',
                'value'       => 'Chương trình Khuyến Mãi 2026 - Giảm 30% khi đăng ký gói 1 năm + 14 ngày dùng thử miễn phí',
                'group'       => 'promotions',
                'description' => 'Thông báo banner khuyến mãi',
            ],
            [
                'key'         => 'company_name',
                'value'       => 'Công ty Cổ phần Giáo dục Sam',
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
                'value'       => 'phucstt01@gmail.com',
                'group'       => 'contact',
                'description' => 'Email hỗ trợ',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // Seed Default SEO Metadata using dedicated Seeder
        $this->call(SeoMetadataSeeder::class);

        // Clean old subscription plans
        SubscriptionPlan::query()->delete();

        // Subscription Plans with integrated yearly_price
        $plans = [
            [
                'code'          => 'trial_14d',
                'name'          => 'Gói Dùng Thử (Trial)',
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
                    'Điểm danh, Sĩ số & Học phí cơ bản',
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
                    'Quản lý đa trung tâm đào tạo',
                    'Tối đa 500 học sinh cùng lúc & 40 lớp học cùng lúc',
                    'Báo cáo thống kê & Điểm thi chuyên sâu',
                    'Cổng thanh toán ZaloPay QR Code v2',
                ],
                'badge_text'  => 'DOANH NGHIỆP',
                'is_featured' => false,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::create($plan);
        }

        // Sample Centers & Classes for Statistics Demo
        $center1 = Center::updateOrCreate(['code' => 'CENTER-01'], [
            'name'              => 'Trung tâm Giáo dục Sam - Cầu Giấy',
            'phone'             => '024.3333.8888',
            'email'             => 'caugiay@giaoducsam.vn',
            'address'           => '100 Cầu Giấy, Hà Nội',
            'status'            => 'active',
            'subscription_plan' => 'yearly',
            'expires_at'        => now()->addMonths(12),
        ]);

        $center2 = Center::updateOrCreate(['code' => 'CENTER-02'], [
            'name'              => 'Trung tâm Giáo dục Sam - Đống Đa',
            'phone'             => '024.3333.9999',
            'email'             => 'dongda@giaoducsam.vn',
            'address'           => '50 Chùa Bộc, Hà Nội',
            'status'            => 'active',
            'subscription_plan' => 'trial_14d',
            'expires_at'        => now()->addDays(14),
        ]);

        // Admin 1: Super Admin (Quyền cao nhất - quản lý toàn hệ thống)
        $superAdmin = Admin::updateOrCreate(['username' => 'admin'], [
            'admin_code' => 'ADM-001',
            'username'   => 'admin',
            'email'      => 'phuc.nb140198@gmail.com',
            'password'   => bcrypt('admin140198'),
            'full_name'  => 'Ban Quản trị Tối cao',
            'role'       => 'super_admin', // Lưu trực tiếp vào cột role - không dùng RBAC
            'status'     => 'active',
        ]);

        // Admin 2: Center Admin (Quyền vừa - được phân công quản lý trung tâm)
        $centerAdmin = Admin::updateOrCreate(['username' => 'centeradmin'], [
            'admin_code' => 'ADM-002',
            'username'   => 'centeradmin',
            'email'      => 'admin.caugiay@giaoducsam.vn',
            'password'   => bcrypt('admin140198'),
            'full_name'  => 'Quản lý Trung tâm Cầu Giấy',
            'role'       => 'admin', // Lưu trực tiếp vào cột role
            'status'     => 'active',
        ]);
        $centerAdmin->centers()->sync([$center1->id]);

        // Sample Classes
        SchoolClass::updateOrCreate(['code' => 'TQ-01'], [
            'center_id'    => $center1->id,
            'name'         => 'Tiếng Trung Sơ Cấp K1',
            'max_students' => 25,
            'status'       => 1,
        ]);

        SchoolClass::updateOrCreate(['code' => 'ENG-10'], [
            'center_id'    => $center1->id,
            'name'         => 'Tiếng Anh Giao Tiếp B1',
            'max_students' => 30,
            'status'       => 1,
        ]);

        SchoolClass::updateOrCreate(['code' => 'MATH-12'], [
            'center_id'    => $center2->id,
            'name'         => 'Toán Học Lớp 12 Nâng Cao',
            'max_students' => 20,
            'status'       => 1,
        ]);
    }
}
