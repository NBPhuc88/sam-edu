<?php

use App\Models\Admin;
use App\Models\Attendance;
use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassStudent;
use App\Models\ClassSubject;
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
});

test('super admin can access student show page', function () {
    $center = Center::create([
        'code'   => 'CTR000000031',
        'name'   => 'Trung Tâm Student Test',
        'email'  => 'center_student@test.com',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_show_student',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin_student@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000094',
    ]);

    $student = Student::create([
        'username'            => 'student_test_show',
        'first_name'          => 'Học Sinh',
        'last_name'           => 'Lê Văn',
        'full_name'           => 'Lê Văn Học Sinh',
        'email'               => 'student_show@test.com',
        'password'            => 'password123',
        'student_code'        => 'STD000000001',
        'center_id'           => $center->id,
        'status'              => 1,
        'parent_name'         => 'Lê Văn Phụ Huynh',
        'parent_phone'        => '0912345678',
        'parent_relationship' => 'father',
    ]);

    $teacher = Teacher::create([
        'username'     => 'teacher_for_student',
        'first_name'   => 'Toán',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên Toán',
        'email'        => 'teacher_math@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000031',
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB002',
        'name'      => 'Văn 10',
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS002',
        'name'      => 'Lớp 10B1',
        'status'    => 1,
    ]);

    ClassStudent::create([
        'class_id'    => $class->id,
        'student_id'  => $student->id,
        'status'      => 'active',
        'enrolled_at' => now(),
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    $room = Room::create([
        'center_id' => $center->id,
        'code'      => 'R002',
        'name'      => 'Phòng 201',
        'capacity'  => 25,
    ]);

    $session = ClassSession::create([
        'class_subject_id' => $classSubject->id,
        'teacher_id'       => $teacher->id,
        'room_id'          => $room->id,
        'session_date'     => now()->format('Y-m-d'),
        'start_time'       => '14:00:00',
        'end_time'         => '15:30:00',
        'status'           => 'completed',
    ]);

    Attendance::create([
        'session_id' => $session->id,
        'student_id' => $student->id,
        'status'     => 'present',
        'marked_at'  => now(),
    ]);

    $response = $this->actingAs($superAdmin, 'admin')
        ->get(route('students.show', ['id' => $student->id]));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('Admin/Students/Show')
            ->has('student')
            ->has('sessions', 1)
            ->has('stats')
            ->where('stats.present', 1)
            ->where('stats.total', 1)
    );
});

test('teacher can access student show page in same center', function () {
    $center = Center::create([
        'code'   => 'CTR000000041',
        'name'   => 'Trung Tâm Teacher Access',
        'email'  => 'center_teacher_acc@test.com',
        'status' => 'active',
    ]);

    $teacher = Teacher::create([
        'username'     => 'teacher_view_student',
        'first_name'   => 'Xem HS',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên Xem HS',
        'email'        => 'teacher_view@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000041',
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $student = Student::create([
        'username'     => 'student_view_by_teacher',
        'first_name'   => 'Của Trung Tâm',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh Của Trung Tâm',
        'email'        => 'student_view@test.com',
        'password'     => 'password123',
        'student_code' => 'STD000000041',
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS041',
        'name'      => 'Lớp 11A',
        'status'    => 1,
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB041',
        'name'      => 'Toán 11',
    ]);

    ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    ClassStudent::create([
        'class_id'    => $class->id,
        'student_id'  => $student->id,
        'status'      => 'active',
        'enrolled_at' => now(),
    ]);

    $response = $this->actingAs($teacher, 'teacher')
        ->get(route('students.show', ['id' => $student->id]));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('Admin/Students/Show')
            ->where('isTeacher', true)
    );
});

test('teacher cannot export student attendances', function () {
    $center = Center::create([
        'code'   => 'CTR000000051',
        'name'   => 'Trung Tâm No Export',
        'email'  => 'center_no_exp@test.com',
        'status' => 'active',
    ]);

    $teacher = Teacher::create([
        'username'     => 'teacher_no_export',
        'first_name'   => 'Không Export',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên Không Export',
        'email'        => 'teacher_no_exp@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000051',
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $student = Student::create([
        'username'     => 'student_no_exp',
        'first_name'   => 'No Export',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh No Export',
        'email'        => 'student_no_exp@test.com',
        'password'     => 'password123',
        'student_code' => 'STD000000051',
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $response = $this->actingAs($teacher, 'teacher')
        ->get(route('students.export-attendances', ['id' => $student->id]));

    $response->assertNotFound();
});
