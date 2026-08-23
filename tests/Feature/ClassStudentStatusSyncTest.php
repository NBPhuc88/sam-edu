<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;

beforeEach(function () {
    // Tạo trung tâm có giới hạn 2 lớp, 5 học sinh
    $this->center = Center::create([
        'code'              => 'CTR000000999',
        'name'              => 'Trung Tâm Thử Nghiệm Giới Hạn',
        'phone'             => '0901234567',
        'email'             => 'testcenter@gmail.com',
        'address'           => '123 Test Street, TP.HCM',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'max_classes'       => 2,
        'max_students'      => 5,
        'status'            => 'active',
    ]);

    // Super Admin
    $this->superAdmin = Admin::create([
        'admin_code' => 'ADM000000001',
        'username'   => 'super_admin_test',
        'full_name'  => 'Super Admin Test',
        'email'      => 'super_test@gmail.com',
        'phone'      => '0901111222',
        'password'   => bcrypt('password123'),
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    // Admin phụ quản lý trung tâm
    $this->subAdmin = Admin::create([
        'admin_code' => 'ADM000000002',
        'username'   => 'sub_admin_test',
        'full_name'  => 'Sub Admin Test',
        'email'      => 'sub_test@gmail.com',
        'phone'      => '0902222333',
        'password'   => bcrypt('password123'),
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $this->subAdmin->centers()->attach($this->center->id);

    // Giáo viên
    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV000000099',
        'first_name'   => 'Viên',
        'last_name'    => 'Giáo',
        'username'     => 'teacher_test',
        'full_name'    => 'Giáo Viên Test',
        'email'        => 'gv_test@gmail.com',
        'phone'        => '0903333444',
        'password'     => bcrypt('password123'),
        'status'       => 'active',
    ]);

    // Môn học
    $this->subject = Subject::create([
        'center_id'   => $this->center->id,
        'code'        => 'MH000000099',
        'name'        => 'Môn Toán Test',
        'tuition_fee' => 1000000,
        'status'      => 'active',
    ]);

    \Illuminate\Support\Facades\Auth::guard('admin')->setUser($this->superAdmin);
});

test('room creation is limited by center max_classes for active and paused rooms', function () {
    $roomService = app(\App\Services\Room\RoomServiceInterface::class);

    // Tạo phòng 1 (active) -> OK (1/2)
    $room1 = $roomService->createRoom([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 101',
        'code'      => 'R000000101',
        'capacity'  => 30,
        'status'    => 'active',
    ]);
    expect($room1)->toBeInstanceOf(Room::class);

    // Tạo phòng 2 (paused) -> OK (2/2)
    $room2 = $roomService->createRoom([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 102',
        'code'      => 'R000000102',
        'capacity'  => 30,
        'status'    => 'paused',
    ]);
    expect($room2)->toBeInstanceOf(Room::class);

    // Tạo phòng 3 khi đã đạt hạn mức 2 -> Ném ngoại lệ InvalidArgumentException
    expect(fn () => $roomService->createRoom([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 103',
        'code'      => 'R000000103',
        'capacity'  => 30,
        'status'    => 'active',
    ]))->toThrow(\InvalidArgumentException::class);

    // Đổi phòng 2 sang 'closed' -> Phòng closed không tính vào hạn mức -> Số phòng active/paused còn 1/2
    $room2->update(['status' => 'closed']);

    // Giờ tạo thêm phòng mới thành công
    $room3 = $roomService->createRoom([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 103',
        'code'      => 'R000000103',
        'capacity'  => 30,
        'status'    => 'active',
    ]);
    expect($room3)->toBeInstanceOf(Room::class);
});

test('class creation is limited by max_classes for active and paused classes', function () {
    $classService = app(\App\Services\Class\SchoolClassServiceInterface::class);

    // Tạo lớp 1 (active: status = 1) -> OK (1/2)
    $class1 = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Toán 1',
        'code'      => 'CLS000000001',
        'status'    => 1,
    ]);
    expect($class1)->toBeInstanceOf(SchoolClass::class);

    // Tạo lớp 2 (paused: status = 0) -> OK (2/2)
    $class2 = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Toán 2',
        'code'      => 'CLS000000002',
        'status'    => 0,
    ]);
    expect($class2)->toBeInstanceOf(SchoolClass::class);

    // Tạo lớp 3 vượt hạn mức -> Ném ngoại lệ
    expect(fn () => $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Toán 3',
        'code'      => 'CLS000000003',
        'status'    => 1,
    ]))->toThrow(\InvalidArgumentException::class);

    // Chuyển lớp 2 sang completed (status = 2) -> Không tính vào hạn mức
    $class2->update(['status' => 2]);

    // Tạo lớp mới thành công
    $class3 = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Toán 3',
        'code'      => 'CLS000000003',
        'status'    => 1,
    ]);
    expect($class3)->toBeInstanceOf(SchoolClass::class);
});

test('class status change to paused cascades only isolated students to paused', function () {
    $classService = app(\App\Services\Class\SchoolClassServiceInterface::class);

    $classA = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp A',
        'code'      => 'CLS000000010',
        'status'    => 1,
    ]);

    $classB = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp B',
        'code'      => 'CLS000000020',
        'status'    => 1,
    ]);

    // Học sinh 1: Chỉ học Lớp A
    $student1 = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000001',
        'first_name'   => 'Một',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh Chỉ Học Lớp A',
        'username'     => 'hs_only_a',
        'email'        => 'hs1@gmail.com',
        'password'     => bcrypt('password123'),
        'status'       => 1,
    ]);
    $classA->students()->attach($student1->id, ['status' => 'active', 'enrolled_at' => now()]);

    // Học sinh 2: Học cả Lớp A và Lớp B
    $student2 = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000002',
        'first_name'   => 'Hai',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh Học Cả 2 Lớp',
        'username'     => 'hs_both_ab',
        'email'        => 'hs2@gmail.com',
        'password'     => bcrypt('password123'),
        'status'       => 1,
    ]);
    $classA->students()->attach($student2->id, ['status' => 'active', 'enrolled_at' => now()]);
    $classB->students()->attach($student2->id, ['status' => 'active', 'enrolled_at' => now()]);

    // Đổi trạng thái Lớp A sang Tạm dừng (status = 0)
    $classService->updateClass($classA->id, [
        'center_id' => $this->center->id,
        'name'      => 'Lớp A',
        'code'      => 'CLS000000010',
        'status'    => 0,
    ]);

    // Kiểm tra: $student1 (chỉ học lớp A) phải bị chuyển sang status = 0
    expect($student1->fresh()->status->value)->toBe(0);

    // Kiểm tra: $student2 (vẫn đang học lớp B active) phải giữ nguyên status = 1
    expect($student2->fresh()->status->value)->toBe(1);
});

test('class status change to completed cascades isolated students to graduated', function () {
    $classService = app(\App\Services\Class\SchoolClassServiceInterface::class);

    $classA = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Hoàn Thành',
        'code'      => 'CLS000000030',
        'status'    => 1,
    ]);

    $student = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000003',
        'first_name'   => 'Ba',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh Hoàn Thành Khóa',
        'username'     => 'hs_graduated',
        'email'        => 'hs3@gmail.com',
        'password'     => bcrypt('password123'),
        'status'       => 1,
    ]);
    $classA->students()->attach($student->id, ['status' => 'active', 'enrolled_at' => now()]);

    // Đổi Lớp A sang Hoàn thành (status = 2)
    $classService->updateClass($classA->id, [
        'center_id' => $this->center->id,
        'name'      => 'Lớp Hoàn Thành',
        'code'      => 'CLS000000030',
        'status'    => 2,
    ]);

    // Học sinh chuyển sang Tốt nghiệp (status = 2)
    expect($student->fresh()->status->value)->toBe(2);
});

test('secondary admin cannot reopen completed or closed classes', function () {
    $class = SchoolClass::create([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Đã Đóng',
        'code'      => 'CLS000000040',
        'status'    => 3, // Closed
    ]);

    $response = $this->actingAs($this->subAdmin, 'admin')
        ->patch("/classes/{$class->id}", [
            'center_id' => $this->center->id,
            'name'      => 'Cố Mở Lại Lớp',
            'code'      => 'CLS000000040',
            'status'    => 1,
        ]);

    // Bị chặn 403 Forbidden
    $response->assertStatus(403);
});

test('inactive or paused student cannot enter online exam room or practice exam', function () {
    \Illuminate\Support\Facades\Auth::guard('admin')->logout();

    $inactiveStudent = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000099',
        'first_name'   => 'Tạm Dừng',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh Tạm Dừng',
        'username'     => 'hs_paused_test',
        'email'        => 'hspaused@gmail.com',
        'password'     => bcrypt('password123'),
        'status'       => 0, // Paused / Inactive
    ]);

    // Thử truy cập thi thử -> 403 Forbidden
    $practiceResponse = $this->actingAs($inactiveStudent, 'student')
        ->get('/practice-exams');
    $practiceResponse->assertStatus(403);

    // Thử vào phòng thi online -> 403 Forbidden
    $onlineResponse = $this->actingAs($inactiveStudent, 'student')
        ->get('/exam-room');
    $onlineResponse->assertStatus(403);
});

test('student can view printable transcript PDF page', function () {
    \Illuminate\Support\Facades\Auth::guard('admin')->logout();

    $student = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000088',
        'first_name'   => 'Văn A',
        'last_name'    => 'Nguyễn',
        'full_name'    => 'Nguyễn Văn A',
        'username'     => 'hs_transcript_test',
        'email'        => 'hstranscript@gmail.com',
        'password'     => bcrypt('password123'),
        'status'       => 1,
    ]);

    $response = $this->actingAs($student, 'student')
        ->get('/student/transcript/print');

    $response->assertStatus(200)
        ->assertInertia(
            fn ($page) => $page->component('Student/TranscriptPrint')
            ->has('student')
            ->has('center')
            ->has('results')
            ->has('gpa')
        );
});
