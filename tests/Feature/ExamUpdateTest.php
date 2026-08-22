<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can update exam basic info and sections', function () {
    $center = Center::create([
        'code'   => 'CTR000000088',
        'name'   => 'Trung Tâm Test Update',
        'email'  => 'center88@test.com',
        'phone'  => '0901234588',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_88',
        'full_name'  => 'Super Admin 88',
        'email'      => 'admin88@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000088',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000088',
        'name'             => 'Môn Học Test 88',
        'total_sessions'   => 20,
        'duration_minutes' => 60,
        'tuition_fee'      => 2000000,
        'status'           => 'active',
    ]);

    $exam = Exam::create([
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000088',
        'name'             => 'Đề Thi Gốc',
        'exam_type'        => 'general',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'draft',
    ]);

    $section = ExamSection::create([
        'exam_id' => $exam->id,
        'title'   => 'Phần 1 Gốc',
        'skill'   => 'reading',
    ]);

    $q1 = ExamQuestion::create([
        'exam_id'       => $exam->id,
        'section_id'    => $section->id,
        'code'          => 'Q000000088',
        'question_type' => 'single_choice',
        'content'       => 'Câu hỏi 1',
        'score'         => 5.0,
    ]);

    $updatePayload = [
        'name'             => 'Đề Thi Đã Cập Nhật',
        'code'             => 'EX000000088',
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'exam_type'        => 'general',
        'duration_minutes' => 60,
        'max_score'        => 10,
        'pass_score'       => 5,
        'status'           => 'published',
        'sections'         => [
            [
                'id'          => $section->id,
                'title'       => 'Phần 1 Đã Sửa',
                'skill'       => 'reading',
                'order_index' => 0,
                'questions'   => [
                    [
                        'id'            => $q1->id,
                        'code'          => 'Q000000088',
                        'question_type' => 'single_choice',
                        'content'       => 'Câu hỏi 1 đã sửa',
                        'score'         => 5.0,
                    ],
                    [
                        'code'          => 'Q000000089',
                        'question_type' => 'essay',
                        'content'       => 'Câu hỏi 2 mới thêm',
                        'score'         => 5.0,
                    ],
                ],
            ],
        ],
    ];

    $response = $this->actingAs($admin, 'admin')->patch(route('exams.update', $exam->id), $updatePayload);
    $response->assertRedirect(route('exams.index'));

    $exam->refresh();
    expect($exam->name)->toBe('Đề Thi Đã Cập Nhật')
        ->and($exam->duration_minutes)->toBe(60)
        ->and($exam->status)->toBe('published')
        ->and($exam->questions()->count())->toBe(2);
});
