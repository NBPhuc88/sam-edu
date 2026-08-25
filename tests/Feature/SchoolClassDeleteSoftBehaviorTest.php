<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\Exam;
use App\Models\ExamResult;
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

test('soft deleting school class retains exam results and past sessions but blocks chat access', function () {
    $center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm Test',
        'email'  => 'centertest@test.com',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_del_class',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin_class@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000096',
    ]);

    $teacher = Teacher::create([
        'username'     => 'teacher_class_test',
        'first_name'   => 'Giáo Viên',
        'last_name'    => 'Lớp Test',
        'full_name'    => 'Lớp Test Giáo Viên',
        'email'        => 'teacher_class@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000007',
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $student = Student::create([
        'username'     => 'student_class_test',
        'first_name'   => 'Học Sinh',
        'last_name'    => 'Lớp Test',
        'full_name'    => 'Lớp Test Học Sinh',
        'email'        => 'student_class@test.com',
        'password'     => 'password123',
        'student_code' => 'HS000000007',
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB007',
        'name'      => 'Vật Lý 10',
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS007',
        'name'      => 'Lớp 10 Lý',
        'status'    => 1,
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    // Gán điểm thi cho học sinh trong lớp
    $exam = Exam::create([
        'center_id'        => $center->id,
        'class_id'         => $class->id,
        'class_subject_id' => $classSubject->id,
        'subject_id'       => $subject->id,
        'name'             => 'Thi giữa kỳ Lý',
        'code'             => 'EX_LY_01',
        'exam_date'        => now()->toDateString(),
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'published',
    ]);

    $examResult = ExamResult::create([
        'exam_id'    => $exam->id,
        'student_id' => $student->id,
        'score'      => 9.5,
        'grade'      => 'Xuất sắc',
    ]);

    // Ca học đã dạy trong quá khứ của giáo viên
    $pastSession = ClassSession::create([
        'class_subject_id' => $classSubject->id,
        'teacher_id'       => $teacher->id,
        'session_date'     => now()->subDays(2)->toDateString(),
        'start_time'       => '14:00',
        'end_time'         => '16:00',
        'status'           => 'completed',
    ]);

    // 1. Xóa lớp học
    $response = $this->actingAs($superAdmin, 'admin')
        ->delete(route('classes.destroy', $class->id));

    $response->assertRedirect();
    expect(SchoolClass::find($class->id))->toBeNull();
    expect(SchoolClass::withTrashed()->find($class->id))->not->toBeNull();

    // 2. Học sinh vẫn xem được điểm thi kèm tên lớp cũ qua withTrashed()
    $examResult->refresh();
    expect($examResult->exam)->not->toBeNull();
    expect($examResult->exam->schoolClass)->not->toBeNull();
    expect($examResult->exam->schoolClass->name)->toBe('Lớp 10 Lý');

    // 3. Giáo viên vẫn xem được ca học đã dạy trong quá khứ kèm lớp học qua withTrashed()
    $pastSession->refresh();
    expect($pastSession->classSubject)->not->toBeNull();
    expect($pastSession->classSubject->schoolClass)->not->toBeNull();
    expect($pastSession->classSubject->schoolClass->name)->toBe('Lớp 10 Lý');

    // 4. Nhóm chat của lớp bị xóa -> Không thể truy cập
    $chatResponse = $this->actingAs($student, 'student')
        ->get(route('classes.chat.messages', ['classId' => $class->id]));

    $chatResponse->assertStatus(404);
});
