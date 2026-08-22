<?php

namespace Database\Seeders;

use App\Models\Center;
use App\Models\ExamType;
use Illuminate\Database\Seeder;

class ExamTypeSeeder extends Seeder
{
    /**
     * Standard exam type templates to seed for each center.
     *
     * @return array<int, array<string, string>>
     */
    public static function getDefaultExamTypes(): array
    {
        return [
            [
                'code'        => 'general',
                'name'        => 'Đề Thi Chung / Tổng Hợp (General Test)',
                'description' => 'Đề kiểm tra đánh giá năng lực tổng hợp, cấu trúc đa dạng nhiều dạng bài.',
                'status'      => 'active',
            ],
            [
                'code'        => 'ielts',
                'name'        => 'IELTS Mock Test (4 Kỹ Năng)',
                'description' => 'Đề thi thử chuẩn IELTS 4 kỹ năng: Listening, Reading, Writing, Speaking.',
                'status'      => 'active',
            ],
            [
                'code'        => 'hsk',
                'name'        => 'HSK Đề Thi Chuẩn Hóa (Tiếng Trung)',
                'description' => 'Đề thi đánh giá năng lực Hán ngữ theo khung chuẩn HSK 1 - HSK 6.',
                'status'      => 'active',
            ],
            [
                'code'        => 'toeic',
                'name'        => 'TOEIC Practice Test',
                'description' => 'Đề thi thử chứng chỉ TOEIC định dạng Listening & Reading / Speaking & Writing.',
                'status'      => 'active',
            ],
            [
                'code'        => 'midterm',
                'name'        => 'Kiểm Tra Giữa Kỳ (Midterm Exam)',
                'description' => 'Bài thi đánh giá kết quả học tập giữa kỳ học phần / khóa học.',
                'status'      => 'active',
            ],
            [
                'code'        => 'final',
                'name'        => 'Kiểm Tra Cuối Kỳ (Final Exam)',
                'description' => 'Bài thi tổng kết và đánh giá kết quả hoàn thành khóa học.',
                'status'      => 'active',
            ],
            [
                'code'        => 'quiz_15m',
                'name'        => 'Kiểm Tra Nhanh 15 Phút (Quiz)',
                'description' => 'Bài kiểm tra nhanh đầu giờ hoặc cuối buổi củng cố kiến thức.',
                'status'      => 'active',
            ],
            [
                'code'        => 'custom',
                'name'        => 'Tuỳ Chỉnh Khác',
                'description' => 'Dạng đề thi đặc thù do giáo viên hoặc trung tâm tự thiết lập.',
                'status'      => 'active',
            ],
        ];
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $centers   = Center::all();
        $templates = self::getDefaultExamTypes();

        foreach ($centers as $center) {
            foreach ($templates as $template) {
                ExamType::updateOrCreate(
                    [
                        'center_id' => $center->id,
                        'code'      => $template['code'],
                    ],
                    [
                        'name'        => $template['name'],
                        'description' => $template['description'],
                        'status'      => $template['status'],
                    ]
                );
            }
        }
    }
}
