<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Role;
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
                'key' => 'hero_title',
                'value' => 'Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm Toàn Diện',
                'group' => 'homepage',
                'description' => 'Tiêu đề banner chính',
            ],
            [
                'key' => 'hero_subtitle',
                'value' => 'Hệ thống tối ưu hóa quy trình quản lý học sinh, sắp xếp lịch học, điểm danh thông minh và tự động gia hạn gói dịch vụ qua ZaloPay QR Code.',
                'group' => 'homepage',
                'description' => 'Mô tả banner chính',
            ],
            [
                'key' => 'promo_banner_text',
                'value' => 'Chương trình Khuyến Mãi 2026 - Giảm 30% khi đăng ký gói 1 năm + 14 ngày dùng thử miễn phí',
                'group' => 'promotions',
                'description' => 'Thông báo banner khuyến mãi',
            ],
            [
                'key' => 'company_name',
                'value' => 'Công ty Cổ phần Giáo dục Sam',
                'group' => 'company',
                'description' => 'Tên công ty',
            ],
            [
                'key' => 'contact_address',
                'value' => 'Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Q. Cầu Giấy, Hà Nội',
                'group' => 'contact',
                'description' => 'Địa chỉ trụ sở',
            ],
            [
                'key' => 'contact_phone',
                'value' => '0988.123.456',
                'group' => 'contact',
                'description' => 'Hotline tư vấn',
            ],
            [
                'key' => 'contact_email',
                'value' => 'hotro@giaoducsam.vn',
                'group' => 'contact',
                'description' => 'Email hỗ trợ',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // Subscription Plans
        $plans = [
            [
                'code' => 'free_trial',
                'name' => 'Gói Dùng Thử',
                'price' => 0,
                'duration_months' => 1,
                'max_students' => 30,
                'max_classes' => 3,
                'features' => [
                    'Dùng thử 14 ngày miễn phí',
                    'Tối đa 30 học sinh',
                    'Tối đa 3 lớp học',
                    'Hỗ trợ kỹ thuật qua Email',
                ],
                'badge_text' => 'MIỄN PHÍ',
                'is_featured' => false,
            ],
            [
                'code' => 'basic',
                'name' => 'Gói Basic',
                'price' => 490000,
                'duration_months' => 1,
                'max_students' => 150,
                'max_classes' => 10,
                'features' => [
                    'Quản lý 1 trung tâm',
                    'Tối đa 150 học sinh',
                    'Tối đa 10 lớp học',
                    'Điểm danh & Báo cáo cơ bản',
                    'Hỗ trợ hotline 24/7',
                ],
                'badge_text' => null,
                'is_featured' => false,
            ],
            [
                'code' => 'pro',
                'name' => 'Gói Pro (Khuyến Mãi)',
                'price' => 990000,
                'duration_months' => 12,
                'max_students' => 500,
                'max_classes' => 35,
                'features' => [
                    'Giảm 30% khi đăng ký 1 năm',
                    'Quản lý đa trung tâm',
                    'Tối đa 500 học sinh',
                    'Tối đa 35 lớp học',
                    'Thanh toán ZaloPay tự động',
                    'Biểu đồ thống kê Recharts nâng cao',
                ],
                'badge_text' => 'HOT 30% OFF',
                'is_featured' => true,
            ],
            [
                'code' => 'enterprise',
                'name' => 'Gói Enterprise',
                'price' => 2500000,
                'duration_months' => 12,
                'max_students' => 2000,
                'max_classes' => 150,
                'features' => [
                    'Không giới hạn số lượng trung tâm',
                    'Tối đa 2.000 học sinh',
                    'Tối đa 150 lớp học',
                    'Tùy chỉnh thương hiệu riêng',
                    'Quản trị viên hỗ trợ riêng',
                ],
                'badge_text' => 'DOANH NGHIỆP',
                'is_featured' => false,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(['code' => $plan['code']], $plan);
        }

        // Sample Centers & Classes for Statistics Demo
        $center1 = Center::updateOrCreate(['code' => 'CENTER-01'], [
            'name' => 'Trung tâm Giáo dục Sam - Cầu Giấy',
            'phone' => '024.3333.8888',
            'email' => 'caugiay@giaoducsam.vn',
            'address' => '100 Cầu Giấy, Hà Nội',
            'status' => 'active',
            'subscription_plan' => 'pro',
            'expires_at' => now()->addMonths(12),
        ]);

        $center2 = Center::updateOrCreate(['code' => 'CENTER-02'], [
            'name' => 'Trung tâm Giáo dục Sam - Đống Đa',
            'phone' => '024.3333.9999',
            'email' => 'dongda@giaoducsam.vn',
            'address' => '50 Chùa Bộc, Hà Nội',
            'status' => 'active',
            'subscription_plan' => 'basic',
            'expires_at' => now()->addMonths(6),
        ]);

        // Seed Default Roles
        $superAdminRole = Role::updateOrCreate(['code' => 'super_admin'], [
            'name' => 'Super Admin',
            'description' => 'Quản trị viên tối cao hệ thống Sam Edu',
        ]);

        Role::updateOrCreate(['code' => 'center_admin'], [
            'name' => 'Center Admin',
            'description' => 'Quản trị viên Trung tâm đào tạo',
        ]);

        Role::updateOrCreate(['code' => 'teacher'], [
            'name' => 'Giáo viên',
            'description' => 'Giáo viên giảng dạy',
        ]);

        Role::updateOrCreate(['code' => 'student'], [
            'name' => 'Học sinh',
            'description' => 'Học sinh trung tâm',
        ]);

        // Sample Super Admin
        $admin = Admin::updateOrCreate(['username' => 'admin'], [
            'admin_code' => 'ADM-001',
            'username' => 'admin',
            'email' => 'phuc.nb140198@gmail.com',
            'password' => bcrypt('admin140198'),
            'full_name' => 'Quản trị viên Hệ thống Sam',
            'status' => 'active',
        ]);

        // Assign Super Admin Role to Admin
        $admin->roles()->sync([$superAdminRole->id]);

        // Sample Classes
        SchoolClass::updateOrCreate(['code' => 'TQ-01'], [
            'center_id' => $center1->id,
            'name' => 'Tiếng Trung Sơ Cấp K1',
            'max_students' => 25,
            'status' => 'active',
        ]);

        SchoolClass::updateOrCreate(['code' => 'ENG-10'], [
            'center_id' => $center1->id,
            'name' => 'Tiếng Anh Giao Tiếp B1',
            'max_students' => 30,
            'status' => 'active',
        ]);

        SchoolClass::updateOrCreate(['code' => 'MATH-12'], [
            'center_id' => $center2->id,
            'name' => 'Toán Học Lớp 12 Nâng Cao',
            'max_students' => 20,
            'status' => 'active',
        ]);
    }
}
