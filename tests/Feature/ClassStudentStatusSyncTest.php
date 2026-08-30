<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);

    // Tạo trung tâm có giới hạn 2 lớp, 5 học sinh
    $this->center = Center::create([
        'code'              => 'CTR000000999',
        'name'              => 'Trung Tâm Thử Nghiệm Giới Hạn',
        'phone'             => '0901234567',
        'email'             => 'testcenter@gmail.com',
        'address'           => '123 Test Street, TP.HCM',
        'subscription_plan' => 'basic_5',
        'plan_type'         => Constant::PLAN_TYPE_STANDARD,
        'max_classes'       => 2,
        'max_students'      => 5,
        'status'            => Constant::STATUS_ACTIVE,
    ]);

    // Super Admin
    $this->superAdmin = Admin::create([
        'admin_code' => 'ADM000000001',
        'username'   => 'super_admin_test',
        'full_name'  => 'Super Admin Test',
        'email'      => 'super_test@gmail.com',
        'phone'      => '0901111222',
        'password'   => bcrypt('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    // Admin phụ quản lý trung tâm
    $this->subAdmin = Admin::create([
        'admin_code' => 'ADM000000002',
        'username'   => 'sub_admin_test',
        'full_name'  => 'Sub Admin Test',
        'email'      => 'sub_test@gmail.com',
        'phone'      => '0902222333',
        'password'   => bcrypt('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
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
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    // Môn học
    $this->subject = Subject::create([
        'center_id'   => $this->center->id,
        'code'        => 'MH000000099',
        'name'        => 'Môn Toán Test',
        'tuition_fee' => 1000000,
        'status'      => Constant::STATUS_ACTIVE,
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
        'status'    => Constant::ROOM_STATUS_ACTIVE,
    ], $this->superAdmin);
    expect($room1)->toBeInstanceOf(Room::class);

    // Tạo phòng 2 (paused) -> OK (2/2)
    $room2 = $roomService->createRoom([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 102',
        'code'      => 'R000000102',
        'capacity'  => 30,
        'status'    => Constant::ROOM_STATUS_PAUSED,
    ], $this->superAdmin);
    expect($room2)->toBeInstanceOf(Room::class);

    // Tạo phòng 3 khi đã đạt hạn mức 2 -> Ném ngoại lệ InvalidArgumentException
    expect(fn () => $roomService->createRoom([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 103',
        'code'      => 'R000000103',
        'capacity'  => 30,
        'status'    => Constant::ROOM_STATUS_ACTIVE,
    ], $this->superAdmin))->toThrow(\InvalidArgumentException::class);

    // Đổi phòng 2 sang 'closed' -> Phòng closed không tính vào hạn mức -> Số phòng active/paused còn 1/2
    $room2->update(['status' => Constant::ROOM_STATUS_CLOSED]);

    // Giờ tạo thêm phòng mới thành công
    $room3 = $roomService->createRoom([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 103',
        'code'      => 'R000000103',
        'capacity'  => 30,
        'status'    => Constant::ROOM_STATUS_ACTIVE,
    ], $this->superAdmin);
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
    ], $this->superAdmin);
    expect($class1)->toBeInstanceOf(SchoolClass::class);

    // Tạo lớp 2 (paused: status = CLASS_STATUS_INACTIVE) -> OK (2/2)
    $class2 = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Toán 2',
        'code'      => 'CLS000000002',
        'status'    => Constant::CLASS_STATUS_INACTIVE,
    ], $this->superAdmin);
    expect($class2)->toBeInstanceOf(SchoolClass::class);

    // Tạo lớp 3 vượt hạn mức -> Ném ngoại lệ
    expect(fn () => $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Toán 3',
        'code'      => 'CLS000000003',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ], $this->superAdmin))->toThrow(\InvalidArgumentException::class);

    // Chuyển lớp 2 sang completed -> Không tính vào hạn mức
    $class2->update(['status' => Constant::CLASS_STATUS_COMPLETED]);

    // Tạo lớp mới thành công
    $class3 = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Toán 3',
        'code'      => 'CLS000000003',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ], $this->superAdmin);
    expect($class3)->toBeInstanceOf(SchoolClass::class);
});

test('class status change to paused cascades only isolated students to paused', function () {
    $classService = app(\App\Services\Class\SchoolClassServiceInterface::class);

    $classA = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp A',
        'code'      => 'CLS000000010',
        'status'    => 1,
    ], $this->superAdmin);

    $classB = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp B',
        'code'      => 'CLS000000020',
        'status'    => 1,
    ], $this->superAdmin);

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
    $classA->students()->attach($student1->id, ['status' => Constant::CLASS_STUDENT_STATUS_ACTIVE, 'enrolled_at' => now()]);

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
    $classA->students()->attach($student2->id, ['status' => Constant::CLASS_STUDENT_STATUS_ACTIVE, 'enrolled_at' => now()]);
    $classB->students()->attach($student2->id, ['status' => Constant::CLASS_STUDENT_STATUS_ACTIVE, 'enrolled_at' => now()]);

    // Đổi trạng thái Lớp A sang Tạm dừng
    $classService->updateClass($classA->id, [
        'center_id' => $this->center->id,
        'name'      => 'Lớp A',
        'code'      => 'CLS000000010',
        'status'    => Constant::CLASS_STATUS_INACTIVE,
    ], $this->superAdmin);

    // Kiểm tra: $student1 (chỉ học lớp A) phải bị chuyển sang inactive
    $s1Status = is_object($student1->fresh()->status) ? $student1->fresh()->status->value : (int) $student1->fresh()->status;
    expect($s1Status)->toBe(Constant::STUDENT_STATUS_INACTIVE);

    // Kiểm tra: $student2 (vẫn đang học lớp B active) phải giữ nguyên active
    $s2Status = is_object($student2->fresh()->status) ? $student2->fresh()->status->value : (int) $student2->fresh()->status;
    expect($s2Status)->toBe(Constant::STUDENT_STATUS_ACTIVE);
});

test('class status change to completed cascades isolated students to graduated', function () {
    $classService = app(\App\Services\Class\SchoolClassServiceInterface::class);

    $classA = $classService->createClass([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Hoàn Thành',
        'code'      => 'CLS000000030',
        'status'    => 1,
    ], $this->superAdmin);

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
    $classA->students()->attach($student->id, ['status' => Constant::CLASS_STUDENT_STATUS_ACTIVE, 'enrolled_at' => now()]);

    // Đổi Lớp A sang Hoàn thành
    $classService->updateClass($classA->id, [
        'center_id' => $this->center->id,
        'name'      => 'Lớp Hoàn Thành',
        'code'      => 'CLS000000030',
        'status'    => Constant::CLASS_STATUS_COMPLETED,
    ], $this->superAdmin);

    // Học sinh chuyển sang Tốt nghiệp
    $sStatus = is_object($student->fresh()->status) ? $student->fresh()->status->value : (int) $student->fresh()->status;
    expect($sStatus)->toBe(Constant::STUDENT_STATUS_GRADUATED);
});

test('secondary admin cannot reopen completed or closed classes', function () {
    $class = SchoolClass::create([
        'center_id' => $this->center->id,
        'name'      => 'Lớp Đã Đóng',
        'code'      => 'CLS000000040',
        'status'    => Constant::CLASS_STATUS_CLOSED,
    ]);

    $response = $this->actingAs($this->subAdmin, 'admin')
        ->patch("/classes/{$class->id}", [
            'center_id' => $this->center->id,
            'name'      => 'Cố Mở Lại Lớp',
            'code'      => 'CLS000000040',
            'status'    => Constant::CLASS_STATUS_ACTIVE,
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
        'status'       => Constant::STUDENT_STATUS_INACTIVE,
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
