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
                'value'       => 'hotro@giaoducsam.vn',
                'group'       => 'contact',
                'description' => 'Email hỗ trợ',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // Clean old subscription plans to ensure exact 3 plans
        SubscriptionPlan::query()->delete();

        // 3 Subscription Plans: Trial 14 Days, Monthly, Yearly (20% Off)
        $plans = [
            [
                'code'            => 'trial_14d',
                'name'            => 'Gói Dùng Thử 14 Ngày',
                'price'           => 0,
                'duration_months' => 1,
                'max_students'    => 30,
                'max_classes'     => 3,
                'features'        => [
                    'Trải nghiệm 14 ngày dùng thử miễn phí từ ngày tạo',
                    'Quản lý 1 trung tâm đào tạo',
                    'Tối đa 30 học sinh & 3 lớp học',
                    'Điểm danh & Quản lý lớp học cơ bản',
                    'Hỗ trợ kỹ thuật qua Email',
                ],
                'badge_text'  => 'DÙNG THỬ 14 NGÀY',
                'is_featured' => false,
            ],
            [
                'code'            => 'monthly',
                'name'            => 'Gói Hàng Tháng (Standard)',
                'price'           => 500000,
                'duration_months' => 1,
                'max_students'    => 200,
                'max_classes'     => 15,
                'features'        => [
                    'Thanh toán linh hoạt từng tháng (500.000đ/tháng)',
                    'Quản lý 1 trung tâm đào tạo',
                    'Tối đa 200 học sinh & 15 lớp học',
                    'Điểm danh & Quản lý sĩ số thông minh',
                    'Hỗ trợ hotline 24/7',
                ],
                'badge_text'  => 'LINH HOẠT',
                'is_featured' => false,
            ],
            [
                'code'            => 'yearly',
                'name'            => 'Gói Theo Năm (Tiết kiêm 20%)',
                'price'           => 4800000,
                'duration_months' => 12,
                'max_students'    => 500,
                'max_classes'     => 40,
                'features'        => [
                    'Tiết kiệm 20% so với mua lẻ hàng tháng (chỉ 400.000đ/tháng)',
                    'Thời hạn 1 năm (365 ngày)',
                    'Quản lý đa trung tâm đào tạo',
                    'Tối đa 500 học sinh & 40 lớp học',
                    'Gia hạn tự động qua ZaloPay QR Code v2',
                    'Biểu đồ thống kê Recharts nâng cao',
                ],
                'badge_text'  => 'TIẾT KIỆM 20%',
                'is_featured' => true,
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

        // Seed Roles ONLY for Admin (Super Admin & Center Admin)
        Role::query()->delete();

        $superAdminRole = Role::create([
            'code'        => 'super_admin',
            'name'        => 'Super Admin',
            'description' => 'Quản trị viên tối cao - Full tất cả quyền hệ thống',
        ]);

        $centerAdminRole = Role::create([
            'code'        => 'center_admin',
            'name'        => 'Quản lý Trung tâm',
            'description' => 'Quản lý trung tâm được phân công',
        ]);

        // Sample 1: Super Admin (Full system access)
        $superAdmin = Admin::updateOrCreate(['username' => 'admin'], [
            'admin_code' => 'ADM-001',
            'username'   => 'admin',
            'email'      => 'phuc.nb140198@gmail.com',
            'password'   => bcrypt('admin140198'),
            'full_name'  => 'Super Admin Quản trị Tối cao',
            'status'     => 'active',
        ]);
        $superAdmin->roles()->sync([$superAdminRole->id]);

        // Sample 2: Center Admin (Assigned to Center 1 with Subscribed Plan)
        $centerAdmin = Admin::updateOrCreate(['username' => 'centeradmin'], [
            'admin_code' => 'ADM-002',
            'username'   => 'centeradmin',
            'email'      => 'admin.caugiay@giaoducsam.vn',
            'password'   => bcrypt('admin140198'),
            'full_name'  => 'Quản lý Trung tâm Cầu Giấy',
            'status'     => 'active',
        ]);
        $centerAdmin->roles()->sync([$centerAdminRole->id]);
        $centerAdmin->centers()->sync([$center1->id]);

        // Sample Classes
        SchoolClass::updateOrCreate(['code' => 'TQ-01'], [
            'center_id'    => $center1->id,
            'name'         => 'Tiếng Trung Sơ Cấp K1',
            'max_students' => 25,
            'status'       => 'active',
        ]);

        SchoolClass::updateOrCreate(['code' => 'ENG-10'], [
            'center_id'    => $center1->id,
            'name'         => 'Tiếng Anh Giao Tiếp B1',
            'max_students' => 30,
            'status'       => 'active',
        ]);

        SchoolClass::updateOrCreate(['code' => 'MATH-12'], [
            'center_id'    => $center2->id,
            'name'         => 'Toán Học Lớp 12 Nâng Cao',
            'max_students' => 20,
            'status'       => 'active',
        ]);
    }
}
