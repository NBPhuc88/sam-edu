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
