<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Models\Subject;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('admin can update exam basic info and sections', function () {
    $center = Center::create([
        'code'   => 'CTR000000088',
        'name'   => 'Trung Tâm Test Update',
        'email'  => 'center88@test.com',
        'phone'  => '0901234588',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_88',
        'full_name'  => 'Super Admin 88',
        'email'      => 'admin88@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM000000088',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000088',
        'name'             => 'Môn Học Test 88',
        'total_sessions'   => 20,
        'duration_minutes' => 60,
        'tuition_fee'      => 2000000,
        'status'           => Constant::STATUS_ACTIVE,
    ]);

    $exam = Exam::create([
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000088',
        'name'             => 'Đề Thi Gốc',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => Constant::EXAM_STATUS_DRAFT,
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
        'duration_minutes' => 60,
        'max_score'        => 10,
        'pass_score'       => 5,
        'status'           => Constant::EXAM_STATUS_PUBLISHED,
        'sections'         => [
            [
                'id'          => $section->id,
                'title'       => 'Phần 1 Đã Sửa',
                'skill'       => 'reading',
                'order_index' => 0,
                'questions'   => [
                    [
                        'id'             => $q1->id,
                        'code'           => 'Q000000088',
                        'question_type'  => 'single_choice',
                        'content'        => 'Câu hỏi 1 đã sửa',
                        'score'          => 5.0,
                        'correct_answer' => 'A',
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
        ->and($exam->status)->toBe(Constant::EXAM_STATUS_PUBLISHED)
        ->and($exam->questions()->count())->toBe(2);
});

test('deleting an exam deletes all related media and directory on storage', function () {
    Storage::fake('sam');
    Storage::fake('public');

    $center = Center::create([
        'code'   => 'CTR000000089',
        'name'   => 'Trung Tâm Test Delete Media',
        'email'  => 'center89@test.com',
        'phone'  => '0901234589',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_89',
        'full_name'  => 'Super Admin 89',
        'email'      => 'admin89@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM000000089',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000089',
        'name'             => 'Môn Học Test 89',
        'total_sessions'   => 20,
        'duration_minutes' => 60,
        'tuition_fee'      => 2000000,
        'status'           => Constant::STATUS_ACTIVE,
    ]);

    $exam = Exam::create([
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000089',
        'name'             => 'Đề Thi Có Ảnh',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => Constant::EXAM_STATUS_PUBLISHED,
    ]);

    $section = ExamSection::create([
        'exam_id' => $exam->id,
        'title'   => 'Phần 1',
        'skill'   => 'reading',
    ]);

    // Tạo file mẫu trên storage disk 'sam' và 'public'
    Storage::disk('sam')->put("exams/{$exam->id}/q1_image.png", 'fake image content');
    Storage::disk('sam')->put("exams/{$exam->id}/q2_audio.mp3", 'fake audio content');
    Storage::disk('sam')->put('media/custom_question_image.png', 'fake image content');

    $q1 = ExamQuestion::create([
        'exam_id'       => $exam->id,
        'section_id'    => $section->id,
        'code'          => 'Q000000089',
        'question_type' => 'single_choice',
        'content'       => 'Câu hỏi có ảnh',
        'image_url'     => "/sam-storage/exams/{$exam->id}/q1_image.png",
        'audio_url'     => "/sam-storage/exams/{$exam->id}/q2_audio.mp3",
        'options'       => [
            ['id' => '1', 'text' => 'Option A', 'image' => '/sam-storage/media/custom_question_image.png'],
        ],
        'score' => 5.0,
    ]);

    // Kiểm tra file tồn tại trước khi xóa
    expect(Storage::disk('sam')->exists("exams/{$exam->id}/q1_image.png"))->toBeTrue()
        ->and(Storage::disk('sam')->exists('media/custom_question_image.png'))->toBeTrue();

    // Thực hiện xóa đề thi
    $response = $this->actingAs($admin, 'admin')->delete(route('exams.destroy', $exam->id));
    $response->assertRedirect(route('exams.index'));

    // Kiểm tra database: Exam đã bị soft delete
    expect(Exam::find($exam->id))->toBeNull()
        ->and(Exam::withTrashed()->find($exam->id)->trashed())->toBeTrue();

    // Kiểm tra Storage: File & thư mục đã bị xóa sạch
    expect(Storage::disk('sam')->exists("exams/{$exam->id}/q1_image.png"))->toBeFalse()
        ->and(Storage::disk('sam')->exists("exams/{$exam->id}/q2_audio.mp3"))->toBeFalse()
        ->and(Storage::disk('sam')->exists('media/custom_question_image.png'))->toBeFalse()
        ->and(Storage::disk('sam')->exists("exams/{$exam->id}"))->toBeFalse();
});
