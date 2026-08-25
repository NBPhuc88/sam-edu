<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\ClassSubject;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('soft deleted exam retains past submissions and scores but blocks taking exam', function () {
    $center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm Test',
        'email'  => 'centertest@test.com',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_exam_del',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin_exam@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000097',
    ]);

    $studentA = Student::create([
        'username'     => 'student_a_exam',
        'first_name'   => 'Học Sinh',
        'last_name'    => 'Đã Thi',
        'full_name'    => 'Đã Thi Học Sinh',
        'email'        => 'student_a@test.com',
        'password'     => 'password123',
        'student_code' => 'HS000000008',
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $studentB = Student::create([
        'username'     => 'student_b_exam',
        'first_name'   => 'Học Sinh',
        'last_name'    => 'Chưa Thi',
        'full_name'    => 'Chưa Thi Học Sinh',
        'email'        => 'student_b@test.com',
        'password'     => 'password123',
        'student_code' => 'HS000000009',
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB008',
        'name'      => 'Hóa Học 10',
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS008',
        'name'      => 'Lớp 10 Hóa',
        'status'    => 1,
    ]);

    $teacher = Teacher::create([
        'username'     => 'teacher_hoa_test',
        'first_name'   => 'Giáo Viên',
        'last_name'    => 'Hóa',
        'full_name'    => 'Hóa Giáo Viên',
        'email'        => 'teacher_hoa@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000008',
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    $exam = Exam::create([
        'class_subject_id' => $classSubject->id,
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'name'             => 'Thi trắc nghiệm Hóa 10',
        'code'             => 'EX_HOA_01',
        'exam_date'        => now()->toDateString(),
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'published',
    ]);

    $classExam = ClassExam::create([
        'class_id'         => $class->id,
        'exam_id'          => $exam->id,
        'title'            => 'Kỳ thi Hóa Giữa Kỳ',
        'code'             => 'CE_HOA_01',
        'access_code'      => 'HOA123',
        'exam_date'        => now()->toDateString(),
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'scheduled',
        'valid_from'       => now()->subDays(1),
        'valid_to'         => now()->addDays(5),
    ]);

    // Học sinh A đã làm bài nộp
    $submissionA = ClassExamSubmission::create([
        'class_exam_id' => $classExam->id,
        'student_id'    => $studentA->id,
        'answers'       => ['q1' => 'A', 'q2' => 'B'],
        'score'         => 8.5,
        'submitted_at'  => now()->subHours(2),
        'status'        => 'completed',
    ]);

    // 1. Xóa bài thi (ClassExam)
    $response = $this->actingAs($superAdmin, 'admin')
        ->delete(route('class-exams.destroy', $classExam->id));

    $response->assertRedirect();
    expect(ClassExam::find($classExam->id))->toBeNull();
    expect(ClassExam::withTrashed()->find($classExam->id))->not->toBeNull();

    // 2. Bài làm của học sinh A KHÔNG bị xóa và vẫn load được thông tin bài thi
    $submissionA->refresh();
    expect($submissionA->exists)->toBeTrue();
    expect($submissionA->classExam)->not->toBeNull();
    expect($submissionA->classExam->title)->toBe('Kỳ thi Hóa Giữa Kỳ');
    expect((float) $submissionA->score)->toBe(8.5);

    // 3. Học sinh B cố gắng vào phòng thi của bài thi đã xóa -> Bị chặn
    $joinResponse = $this->actingAs($studentB, 'student')
        ->post(route('online-exam.join'), ['code' => 'HOA123']);

    $joinResponse->assertSessionHasErrors('code');

    $lobbyResponse = $this->actingAs($studentB, 'student')
        ->get(route('online-exam.lobby', ['id' => $classExam->id]));

    $lobbyResponse->assertStatus(404);
});
