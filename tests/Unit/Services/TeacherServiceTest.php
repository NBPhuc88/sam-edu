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
use App\Services\Teacher\TeacherService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    Mail::fake();
    $this->service = app(TeacherService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test TeacherService',
        'status' => Constant::STATUS_ACTIVE,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_tch_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Tch',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
});

test('createTeacher auto-generates teacher code when code is empty', function () {
    $data = [
        'full_name' => 'Tran Thi Mai',
        'username'  => 'mai_tran',
        'email'     => 'mai.tran@example.com',
        'center_id' => $this->center->id,
        'password'  => 'password123',
    ];

    $teacher = $this->service->createTeacher($data, $this->superAdmin);

    expect($teacher)->toBeInstanceOf(Teacher::class)
        ->and($teacher->teacher_code)->toBe('GV0000001')
        ->and($teacher->full_name)->toBe('Tran Thi Mai');
});

test('updateTeacher updates teacher details and specialization', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'old_teacher_name',
        'first_name'   => 'Old',
        'last_name'    => 'Teacher',
        'full_name'    => 'Old Teacher Name',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $updated = $this->service->updateTeacher($teacher->id, [
        'full_name'      => 'New Teacher Name',
        'specialization' => 'Toan Cao Cap',
        'phone'          => '0987654321',
    ], $this->superAdmin);

    expect($updated->full_name)->toBe('New Teacher Name')
        ->and($updated->specialization)->toBe('Toan Cao Cap')
        ->and($updated->phone)->toBe('0987654321');
});

test('deleteTeacher prevents deleting teacher who has scheduled future sessions', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_future_sess',
        'first_name'   => 'Teacher',
        'last_name'    => 'Future',
        'full_name'    => 'Teacher Future Session',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'SUB' . random_int(100, 999),
        'name'      => 'Toan 12',
    ]);

    $room = Room::create([
        'center_id' => $this->center->id,
        'name'      => 'Phong 102',
        'code'      => 'R' . random_int(100, 999),
    ]);

    $class = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(100, 999),
        'name'      => 'Lop 12A1',
        'status'    => 1,
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    ClassSession::create([
        'class_subject_id' => $classSubject->id,
        'teacher_id'       => $teacher->id,
        'room_id'          => $room->id,
        'session_date'     => now()->addDays(2)->toDateString(),
        'start_time'       => '08:00:00',
        'end_time'         => '10:00:00',
        'status'           => Constant::SESSION_STATUS_SCHEDULED,
    ]);

    expect(fn () => $this->service->deleteTeacher($teacher->id, $this->superAdmin))
        ->toThrow(ValidationException::class);
});

test('deleteTeacher soft deletes teacher successfully when no future active sessions exist', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_del_soft',
        'first_name'   => 'Teacher',
        'last_name'    => 'Del',
        'full_name'    => 'Teacher Del Soft',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $result = $this->service->deleteTeacher($teacher->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('teachers', ['id' => $teacher->id]);
});
