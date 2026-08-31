<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSubject;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\Schedule\ClassScheduleService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->service = app(ClassScheduleService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test ScheduleService',
        'status' => 'active',
    ]);
    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_sched',
        'first_name'   => 'Teacher',
        'last_name'    => 'Sched',
        'full_name'    => 'Teacher Sched',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => \App\Enums\Constant::TEACHER_STATUS_ACTIVE,
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id'  => $this->center->id,
        'code'       => 'CLS' . random_int(1000000, 9999999),
        'name'       => 'Lop Sched',
        'status'     => 1,
        'start_date' => now()->subDays(10)->toDateString(),
    ]);
    $this->subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'S' . random_int(1000000, 9999999),
        'name'      => 'Subject Sched',
    ]);
    $this->room = Room::create([
        'center_id' => $this->center->id,
        'name'      => 'Room Sched',
        'code'      => 'R' . random_int(1000000, 9999999),
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_sched_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Sched',
        'password'   => Hash::make('password123'),
        'role'       => \App\Enums\Constant::ROLE_SUPER_ADMIN,
        'status'     => \App\Enums\Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $this->classSubject = ClassSubject::create([
        'class_id'   => $this->schoolClass->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'status'     => \App\Enums\Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);
});

test('createSchedule creates schedule and generates sessions successfully', function () {
    $data = [
        'class_id'   => $this->schoolClass->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'start_date' => now()->toDateString(),
        'weeks'      => [
            '1' => [['08:00', '10:00']],
        ],
        'default_room_id' => $this->room->id,
    ];

    $schedule = $this->service->createSchedule($data, $this->superAdmin);

    expect($schedule)->not()->toBeNull()
        ->and($schedule->class_subject_id)->toBe($this->classSubject->id);
});

test('createSchedule throws validation exception when week slots overlap in same day', function () {
    $data = [
        'class_id'   => $this->schoolClass->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'weeks'      => [
            '1' => [
                ['08:00', '10:00'],
                ['09:00', '11:00'],
            ],
        ],
    ];

    expect(fn () => $this->service->createSchedule($data, $this->superAdmin))
        ->toThrow(ValidationException::class);
});
