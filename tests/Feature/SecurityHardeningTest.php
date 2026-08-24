<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Middleware\ThrottleRequests;

beforeEach(function () {
    $this->seed(\Database\Seeders\PermissionSeeder::class);

    $this->center1 = Center::create([
        'code'              => 'CTR000000001',
        'name'              => 'Trung tâm Quận 1',
        'email'             => 'center1@sam-edu.vn',
        'phone'             => '0901111111',
        'address'           => '123 Lê Lợi, Q1',
        'status'            => 'active',
        'plan_type'         => 'trial',
        'subscription_plan' => 'trial',
        'expires_at'        => now()->addYear(),
    ]);

    $this->center2 = Center::create([
        'code'              => 'CTR000000002',
        'name'              => 'Trung tâm Quận 2',
        'email'             => 'center2@sam-edu.vn',
        'phone'             => '0902222222',
        'address'           => '456 Thảo Điền, Q2',
        'status'            => 'active',
        'plan_type'         => 'trial',
        'subscription_plan' => 'trial',
        'expires_at'        => now()->addYear(),
    ]);

    $this->adminCenter2 = Admin::create([
        'username'   => 'admin_center_2',
        'full_name'  => 'Admin Center 2',
        'email'      => 'admin2@sam-edu.vn',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000088',
    ]);
    $this->adminCenter2->centers()->attach($this->center2->id);
});

test('rate limiting blocks excessive login attempts with 429 status', function () {
    $this->withMiddleware(ThrottleRequests::class);

    // Make 10 requests (allowed)
    for ($i = 0; $i < 10; $i++) {
        $this->post('/login', [
            'role'     => 'admin',
            'username' => 'wrong_user',
            'password' => 'wrong_pass',
        ]);
    }

    // 11th request must be throttled
    $response = $this->post('/login', [
        'role'     => 'admin',
        'username' => 'wrong_user',
        'password' => 'wrong_pass',
    ]);

    $response->assertStatus(429);
});

test('multi-center admin cannot import students into another center', function () {
    $csvContent = "mã học sinh,tên đăng nhập,họ và tên,email,số điện thoại\n"
        . 'STDTEST01,stdtest01,Nguyễn Văn Test,stdtest01@sam-edu.vn,0912345678';

    $file = UploadedFile::fake()->createWithContent('students.csv', $csvContent);

    // Admin Center 2 attempts to pass center_id = Center 1
    $response = $this->actingAs($this->adminCenter2, 'admin')->post('/students/import', [
        'file'      => $file,
        'center_id' => $this->center1->id,
    ]);

    $response->assertSessionHas('success');

    // The student must be created in Center 2 (admin's assigned center), NOT Center 1
    $student = Student::where('student_code', 'STDTEST01')->first();
    expect($student)->not->toBeNull();
    expect((int) $student->center_id)->toBe($this->center2->id);
});

test('multi-center admin cannot import teachers into another center', function () {
    $csvContent = "mã giáo viên,tên đăng nhập,họ và tên,email,số điện thoại\n"
        . 'TCHTEST01,tchtest01,Trần Văn Test,tchtest01@sam-edu.vn,0987654321';

    $file = UploadedFile::fake()->createWithContent('teachers.csv', $csvContent);

    // Admin Center 2 attempts to pass center_id = Center 1
    $response = $this->actingAs($this->adminCenter2, 'admin')->post('/teachers/import', [
        'file'      => $file,
        'center_id' => $this->center1->id,
    ]);

    $response->assertSessionHas('success');

    // The teacher must be created in Center 2, NOT Center 1
    $teacher = Teacher::where('teacher_code', 'TCHTEST01')->first();
    expect($teacher)->not->toBeNull();
    expect((int) $teacher->center_id)->toBe($this->center2->id);
});

test('audio streaming blocks path traversal attempts', function () {
    $response = $this->actingAs($this->adminCenter2, 'admin')->get('/class-exams/audio-stream?path=../../etc/passwd');
    $response->assertStatus(403);

    $response2 = $this->actingAs($this->adminCenter2, 'admin')->get('/class-exams/audio-stream?path=other_folder/secret.txt');
    $response2->assertStatus(403);
});

test('media upload rejects dangerous SVG files to prevent stored XSS', function () {
    $svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>';
    $file       = UploadedFile::fake()->createWithContent('malicious.svg', $svgContent);

    $response = $this->actingAs($this->adminCenter2, 'admin')->postJson('/api/uploads/media', [
        'file' => $file,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['file']);
});

test('deleting a class exam submission automatically removes associated audio files from disk', function () {
    \Illuminate\Support\Facades\Storage::fake('sam');

    $audioPath = 'exams/speaking/test_audio_sample_123.webm';
    \Illuminate\Support\Facades\Storage::disk('sam')->put($audioPath, 'dummy audio content');

    expect(\Illuminate\Support\Facades\Storage::disk('sam')->exists($audioPath))->toBeTrue();

    $student = \App\Models\Student::create([
        'student_code' => 'STD000000099',
        'username'     => 'test_student_clean',
        'first_name'   => 'Test',
        'last_name'    => 'Clean',
        'full_name'    => 'Test Clean',
        'email'        => 'student_clean@sam-edu.vn',
        'password'     => 'password123',
        'center_id'    => $this->center2->id,
        'status'       => 1,
    ]);

    $subject = \App\Models\Subject::create([
        'center_id'        => $this->center2->id,
        'code'             => 'S000000099',
        'name'             => 'Tiếng Anh Giao Tiếp',
        'total_sessions'   => 20,
        'duration_minutes' => 60,
        'tuition_fee'      => 2000000,
        'status'           => 'active',
    ]);

    $class = \App\Models\SchoolClass::create([
        'center_id'    => $this->center2->id,
        'code'         => 'C000000099',
        'name'         => 'Lớp Giao Tiếp 01',
        'max_students' => 20,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $exam = \App\Models\Exam::create([
        'center_id'        => $this->center2->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000099',
        'name'             => 'Đề Thi Speaking',
        'duration_minutes' => 30,
        'max_score'        => 10,
        'status'           => 'published',
    ]);

    $classExam = \App\Models\ClassExam::create([
        'code'             => 'CE000000099',
        'access_code'      => '123456',
        'class_id'         => $class->id,
        'exam_id'          => $exam->id,
        'title'            => 'Kiểm Tra Speaking',
        'exam_date'        => now()->format('Y-m-d'),
        'duration_minutes' => 30,
        'max_score'        => 10,
        'status'           => 'ongoing',
    ]);

    $submission = \App\Models\ClassExamSubmission::create([
        'class_exam_id'  => $classExam->id,
        'student_id'     => $student->id,
        'attempt_number' => 1,
        'status'         => 'submitted',
        'answers'        => [
            1 => 'answer text',
            2 => $audioPath,
        ],
        'grading_details' => [],
    ]);

    // When submission is deleted
    $submission->delete();

    // The audio file must be automatically deleted from disk 'sam'
    expect(\Illuminate\Support\Facades\Storage::disk('sam')->exists($audioPath))->toBeFalse();
});
