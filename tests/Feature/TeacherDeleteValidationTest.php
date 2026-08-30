<?php

use App\Enums\Constant;
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

test('teacher deletion is prevented when teacher has future sessions or active classes', function () {
    $center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm Test',
        'email'  => 'centertest@test.com',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_del_val',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin_del_val@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM000000095',
    ]);

    $teacher = Teacher::create([
        'username'       => 'teacher_future_test',
        'first_name'     => 'Giáo Viên',
        'last_name'      => 'Đang Dạy',
        'full_name'      => 'Đang Dạy Giáo Viên',
        'email'          => 'teacher_future@test.com',
        'password'       => 'password123',
        'teacher_code'   => 'GV000000005',
        'center_id'      => $center->id,
        'status'         => Constant::STATUS_ACTIVE,
        'specialization' => 'Toán học',
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB005',
        'name'      => 'Toán 12',
    ]);

    $room = Room::create([
        'center_id' => $center->id,
        'name'      => 'Phòng 201',
        'code'      => 'R005',
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS005',
        'name'      => 'Lớp 12A1',
        'status'    => 1,
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    // Ca học trong tương lai
    $futureSession = ClassSession::create([
        'class_subject_id' => $classSubject->id,
        'teacher_id'       => $teacher->id,
        'room_id'          => $room->id,
        'session_date'     => now()->addDays(3)->toDateString(),
        'start_time'       => '08:00',
        'end_time'         => '10:00',
        'status'           => Constant::SESSION_STATUS_SCHEDULED,
    ]);

    // 1. Cố gắng xóa giáo viên còn ca tương lai -> Bị từ chối
    $response = $this->actingAs($superAdmin, 'admin')
        ->delete(route('teachers.destroy', $teacher->id));

    $response->assertSessionHasErrors('teacher');
    expect(Teacher::find($teacher->id))->not->toBeNull();

    // 2. Chuyển ca học tương lai sang giáo viên khác và gỡ phân công lớp active
    $otherTeacher = Teacher::create([
        'username'     => 'teacher_replacement',
        'first_name'   => 'Giáo Viên',
        'last_name'    => 'Thay Thế',
        'full_name'    => 'Thay Thế Giáo Viên',
        'email'        => 'teacher_rep@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000006',
        'center_id'    => $center->id,
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $futureSession->update(['teacher_id' => $otherTeacher->id]);
    $classSubject->update(['teacher_id' => $otherTeacher->id]);

    // 3. Tạo 1 ca học trong quá khứ đã hoàn thành của giáo viên cũ
    $pastSession = ClassSession::create([
        'class_subject_id' => $classSubject->id,
        'teacher_id'       => $teacher->id,
        'room_id'          => $room->id,
        'session_date'     => now()->subDays(5)->toDateString(),
        'start_time'       => '08:00',
        'end_time'         => '10:00',
        'status'           => Constant::SESSION_STATUS_COMPLETED,
    ]);

    // 4. Xóa giáo viên -> Thành công (Soft Delete)
    $response2 = $this->actingAs($superAdmin, 'admin')
        ->delete(route('teachers.destroy', $teacher->id));

    $response2->assertRedirect();

    // Xác minh giáo viên bị xóa mềm
    expect(Teacher::find($teacher->id))->toBeNull();
    expect(Teacher::withTrashed()->find($teacher->id))->not->toBeNull();

    // Xác minh ca học quá khứ vẫn giữ teacher_id và load được tên qua withTrashed()
    $pastSession->refresh();
    expect($pastSession->teacher_id)->toBe($teacher->id);
    expect($pastSession->teacher)->not->toBeNull();
    expect($pastSession->teacher->full_name)->toBe('Đang Dạy Giáo Viên');
});
