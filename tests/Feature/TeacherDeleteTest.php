<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\Exam;
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

test('admin can delete a teacher who has class sessions and assignments without integrity violation', function () {
    $center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm Test',
        'email'  => 'centertest@test.com',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_del_teacher',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin_del_teacher@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000092',
    ]);

    $teacher = Teacher::create([
        'username'       => 'teacher_test_del',
        'first_name'     => 'Giáo Viên',
        'last_name'      => 'Trần',
        'full_name'      => 'Trần Giáo Viên',
        'email'          => 'teacher_del@test.com',
        'password'       => 'password123',
        'teacher_code'   => 'GV000000002',
        'center_id'      => $center->id,
        'status'         => 'active',
        'specialization' => 'Toán học',
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB002',
        'name'      => 'Toán 11',
    ]);

    $room = Room::create([
        'center_id' => $center->id,
        'name'      => 'Phòng 101',
        'code'      => 'R001',
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS002',
        'name'      => 'Lớp 11A1',
        'status'    => 1,
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    ClassSchedule::create([
        'class_subject_id' => $classSubject->id,
        'room_id'          => $room->id,
        'weeks'            => [1 => [['08:00', '10:00']]],
        'status'           => 'active',
    ]);

    $classSession = ClassSession::create([
        'class_subject_id' => $classSubject->id,
        'teacher_id'       => $teacher->id,
        'room_id'          => $room->id,
        'session_date'     => '2026-09-01',
        'start_time'       => '08:00',
        'end_time'         => '10:00',
        'status'           => 'scheduled',
    ]);

    $exam = Exam::create([
        'center_id'             => $center->id,
        'class_subject_id'      => $classSubject->id,
        'subject_id'            => $subject->id,
        'created_by_teacher_id' => $teacher->id,
        'title'                 => 'Kiểm tra 1 tiết',
        'code'                  => 'EX001',
        'duration_minutes'      => 45,
        'max_score'             => 10,
        'type'                  => 'offline',
        'status'                => 'active',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')
        ->delete(route('teachers.destroy', $teacher->id));

    $response->assertRedirect();

    // Verify teacher is soft deleted
    expect(Teacher::find($teacher->id))->toBeNull();
    expect(Teacher::withTrashed()->find($teacher->id))->not->toBeNull();

    // Verify class sessions and class subjects are cleaned up
    expect(ClassSession::where('teacher_id', $teacher->id)->count())->toBe(0);
    expect(ClassSubject::where('teacher_id', $teacher->id)->count())->toBe(0);

    // Verify exam created_by_teacher_id is null
    $exam->refresh();
    expect($exam->created_by_teacher_id)->toBeNull();
});
