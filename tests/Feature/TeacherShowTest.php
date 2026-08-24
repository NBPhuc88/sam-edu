<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('super admin can access teacher show page', function () {
    $center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm A',
        'email'  => 'centera@test.com',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_show_teacher',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin_teacher@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000091',
    ]);

    $teacher = Teacher::create([
        'username'       => 'teacher_test_show',
        'first_name'     => 'Giáo Viên',
        'last_name'      => 'Nguyễn Văn',
        'full_name'      => 'Nguyễn Văn Giáo Viên',
        'email'          => 'teacher_show@test.com',
        'password'       => 'password123',
        'teacher_code'   => 'GV000000001',
        'center_id'      => $center->id,
        'status'         => 'active',
        'specialization' => 'Toán học',
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB001',
        'name'      => 'Toán 10',
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS001',
        'name'      => 'Lớp 10A1',
        'status'    => 1,
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    $room = Room::create([
        'center_id' => $center->id,
        'code'      => 'R001',
        'name'      => 'Phòng 101',
        'capacity'  => 30,
    ]);

    ClassSession::create([
        'class_subject_id' => $classSubject->id,
        'teacher_id'       => $teacher->id,
        'room_id'          => $room->id,
        'session_date'     => now()->format('Y-m-d'),
        'start_time'       => '08:00:00',
        'end_time'         => '09:30:00',
        'status'           => 'completed',
        'topic'            => 'Hàm số bậc nhất',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')
        ->get(route('teachers.show', ['id' => $teacher->id]));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('Admin/Teachers/Show')
            ->has('teacher')
            ->has('sessions', 1)
            ->has('stats')
            ->where('stats.completed', 1)
            ->where('stats.total', 1)
    );
});

test('admin can access teacher in their center but cannot access teacher in another center', function () {
    $centerA = Center::create([
        'code'   => 'CTR000000011',
        'name'   => 'Trung Tâm A',
        'email'  => 'centera11@test.com',
        'status' => 'active',
    ]);

    $centerB = Center::create([
        'code'   => 'CTR000000012',
        'name'   => 'Trung Tâm B',
        'email'  => 'centerb12@test.com',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'admin_branch_a',
        'full_name'  => 'Admin Chi Nhánh A',
        'email'      => 'admin_a@test.com',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000092',
    ]);
    $admin->centers()->attach($centerA->id);

    $teacherA = Teacher::create([
        'username'     => 'teacher_a',
        'first_name'   => 'A',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên A',
        'email'        => 'teachera@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000011',
        'center_id'    => $centerA->id,
        'status'       => 'active',
    ]);

    $teacherB = Teacher::create([
        'username'     => 'teacher_b',
        'first_name'   => 'B',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên B',
        'email'        => 'teacherb@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000012',
        'center_id'    => $centerB->id,
        'status'       => 'active',
    ]);

    // Truy cập giáo viên thuộc trung tâm mình -> OK
    $resA = $this->actingAs($admin, 'admin')->get(route('teachers.show', ['id' => $teacherA->id]));
    $resA->assertOk();

    // Truy cập giáo viên thuộc trung tâm khác -> 404
    $resB = $this->actingAs($admin, 'admin')->get(route('teachers.show', ['id' => $teacherB->id]));
    $resB->assertNotFound();
});

test('teacher sessions export csv returns streamed csv', function () {
    $center = Center::create([
        'code'   => 'CTR000000021',
        'name'   => 'Trung Tâm Export Test',
        'email'  => 'centerexport@test.com',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_export_test',
        'full_name'  => 'Super Admin Export',
        'email'      => 'superadmin_exp@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000093',
    ]);

    $teacher = Teacher::create([
        'username'     => 'teacher_export_csv',
        'first_name'   => 'Export',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên Export',
        'email'        => 'teacherexport@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000021',
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')
        ->get(route('teachers.export-sessions', ['id' => $teacher->id, 'type' => 'all']));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
});
