<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $basicFeatures = [
            'dashboard',
            'statistics',
            'teachers',
            'students',
            'classes',
            'schedules',
            'sessions',
            'attendance',
            'subjects',
            'rooms',
            'tuitions',
        ];

        $advancedFeatures = array_merge($basicFeatures, [
            'export_csv',
            'exams',
            'exam-types',
            'class-exams',
            'grading',
            'online-exam',
            'practice-exams',
            'chat',
        ]);

        $plans = [
            [
                'code'          => 'trial',
                'name'          => 'Gói Dùng Thử (1 Tháng)',
                'plan_type'     => 'trial',
                'price'         => 0,
                'yearly_price'  => 0,
                'duration_days' => 30,
                'max_students'  => 600,
                'max_classes'   => 20,
                'features'      => [
                    'Trải nghiệm 30 ngày dùng thử miễn phí đầy đủ tính năng',
                    'Tối đa 20 lớp học & 600 học sinh',
                    'Đầy đủ tính năng thi trực tuyến, chat nhóm & xuất CSV',
                    'Hỗ trợ kỹ thuật tận tâm',
                ],
                'allowed_features' => $advancedFeatures,
                'badge_text'       => 'DÙNG THỬ 1 THÁNG',
                'is_featured'      => false,
            ],
            [
                'code'          => 'basic_5',
                'name'          => 'Gói Cơ Bản (5 Lớp)',
                'plan_type'     => 'basic',
                'price'         => 250000,
                'yearly_price'  => 2400000,
                'duration_days' => 30,
                'max_students'  => 150,
                'max_classes'   => 5,
                'features'      => [
                    'Quản lý 5 lớp học & 150 học sinh',
                    'Quản lý giáo viên, môn học & phòng học',
                    'Thời khóa biểu thông minh & điểm danh từng ca',
                    'Quản lý học phí & đợt đóng tiền',
                    'Tiết kiệm 20% khi thanh toán theo năm (2.400.000đ/năm)',
                ],
                'allowed_features' => $basicFeatures,
                'badge_text'       => 'CƠ BẢN · 5 LỚP',
                'is_featured'      => false,
            ],
            [
                'code'          => 'basic_20',
                'name'          => 'Gói Cơ Bản (20 Lớp)',
                'plan_type'     => 'basic',
                'price'         => 500000,
                'yearly_price'  => 4800000,
                'duration_days' => 30,
                'max_students'  => 600,
                'max_classes'   => 20,
                'features'      => [
                    'Quản lý 20 lớp học & 600 học sinh',
                    'Quản lý giáo viên, môn học & phòng học',
                    'Thời khóa biểu thông minh & điểm danh từng ca',
                    'Quản lý học phí & đợt đóng tiền',
                    'Tiết kiệm 20% khi thanh toán theo năm (4.800.000đ/năm)',
                ],
                'allowed_features' => $basicFeatures,
                'badge_text'       => 'CƠ BẢN · 20 LỚP',
                'is_featured'      => false,
            ],
            [
                'code'          => 'advanced_5',
                'name'          => 'Gói Nâng Cao (5 Lớp)',
                'plan_type'     => 'advanced',
                'price'         => 500000,
                'yearly_price'  => 4800000,
                'duration_days' => 30,
                'max_students'  => 150,
                'max_classes'   => 5,
                'features'      => [
                    'Bao gồm toàn bộ tính năng Gói Cơ Bản',
                    'Kho đề thi 9 dạng câu hỏi & kỳ thi lớp học',
                    'Phòng thi trực tuyến, thi thử & chấm điểm tự luận',
                    'Chat nhóm lớp học thời gian thực',
                    'Xuất dữ liệu giáo viên, học sinh định dạng CSV',
                    'Tối đa 5 lớp học & 150 học sinh',
                    'Tiết kiệm 20% khi thanh toán theo năm (4.800.000đ/năm)',
                ],
                'allowed_features' => $advancedFeatures,
                'badge_text'       => 'NÂNG CAO · 5 LỚP',
                'is_featured'      => false,
            ],
            [
                'code'          => 'advanced_20',
                'name'          => 'Gói Nâng Cao (20 Lớp)',
                'plan_type'     => 'advanced',
                'price'         => 1000000,
                'yearly_price'  => 9600000,
                'duration_days' => 30,
                'max_students'  => 600,
                'max_classes'   => 20,
                'features'      => [
                    'Bao gồm toàn bộ tính năng Gói Cơ Bản',
                    'Kho đề thi 9 dạng câu hỏi & kỳ thi lớp học',
                    'Phòng thi trực tuyến, thi thử & chấm điểm tự luận',
                    'Chat nhóm lớp học thời gian thực',
                    'Xuất dữ liệu giáo viên, học sinh định dạng CSV',
                    'Tối đa 20 lớp học & 600 học sinh',
                    'Tiết kiệm 20% khi thanh toán theo năm (9.600.000đ/năm)',
                ],
                'allowed_features' => $advancedFeatures,
                'badge_text'       => '⭐ PHỔ BIẾN NHẤT',
                'is_featured'      => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['code' => $plan['code']],
                $plan
            );
        }

        // Dọn dẹp các mã gói cũ không còn sử dụng nếu có
        $validCodes = array_column($plans, 'code');
        SubscriptionPlan::whereNotIn('code', $validCodes)->delete();
    }
}
