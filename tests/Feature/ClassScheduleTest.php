<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\Schedule\ClassScheduleServiceInterface;

test('creates schedule, generates 60 sessions immediately, and calculates end date', function () {
    $center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm Test',
        'email'  => 'center@test.com',
        'phone'  => '0901234567',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_2',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin2@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000002',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000002',
        'username'     => 'teacher_test_2',
        'first_name'   => 'B',
        'last_name'    => 'Nguyễn Văn',
        'full_name'    => 'Nguyễn Văn B',
        'email'        => 'teacher2@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000006',
        'name'             => 'Luyện Thi IELTS C1 Test',
        'total_sessions'   => 60,
        'duration_minutes' => 90,
        'tuition_fee'      => 4000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000002',
        'name'         => 'Lớp IELTS C1 - Test',
        'max_students' => 25,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $service = app(ClassScheduleServiceInterface::class);

    $data = [
        'class_id'         => $class->id,
        'subject_id'       => $subject->id,
        'teacher_id'       => $teacher->id,
        'start_date'       => '2026-09-01',
        'end_date'         => null, // Để trống để tự tính
        'weekly_schedules' => [
            ['weekday' => 1, 'start_time' => '18:00', 'end_time' => '20:00'],
            ['weekday' => 3, 'start_time' => '18:00', 'end_time' => '20:00'],
            ['weekday' => 5, 'start_time' => '18:00', 'end_time' => '20:00'],
        ],
        'exclude_vietnam_holidays' => true,
        'status'                   => 'active',
    ];

    $schedule = $service->createSchedule($data, $admin);

    expect($schedule)->toBeInstanceOf(ClassSchedule::class)
        ->and($schedule->effective_from->format('Y-m-d'))->toBe('2026-09-01')
        ->and($schedule->effective_to)->not->toBeNull();

    $classSubject = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    expect($classSubject)->not->toBeNull()
        ->and($classSubject->start_date->format('Y-m-d'))->toBe('2026-09-01')
        ->and($classSubject->end_date)->not->toBeNull()
        ->and($classSubject->end_date->format('Y-m-d'))->toBe($schedule->effective_to->format('Y-m-d'));

    $sessionsCount = ClassSession::where('class_subject_id', $classSubject->id)->count();
    expect($sessionsCount)->toBe(60);
});

test('updates schedule and resyncs 60 sessions with new weekly times', function () {
    $center = Center::create([
        'code'   => 'CTR000000002',
        'name'   => 'Trung Tâm Test 2',
        'email'  => 'center2@test.com',
        'phone'  => '0901234568',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_3',
        'full_name'  => 'Super Admin Test 3',
        'email'      => 'superadmin3@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000003',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000003',
        'username'     => 'teacher_test_3',
        'first_name'   => 'C',
        'last_name'    => 'Nguyễn Văn',
        'full_name'    => 'Nguyễn Văn C',
        'email'        => 'teacher3@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000007',
        'name'             => 'Luyện Thi IELTS C1 Test 2',
        'total_sessions'   => 60,
        'duration_minutes' => 90,
        'tuition_fee'      => 4000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000003',
        'name'         => 'Lớp IELTS C1 - Test 2',
        'max_students' => 25,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $service = app(ClassScheduleServiceInterface::class);

    $schedule = $service->createSchedule([
        'class_id'         => $class->id,
        'subject_id'       => $subject->id,
        'teacher_id'       => $teacher->id,
        'start_date'       => '2026-09-01',
        'end_date'         => null,
        'weekly_schedules' => [
            ['weekday' => 1, 'start_time' => '18:00', 'end_time' => '20:00'],
        ],
        'exclude_vietnam_holidays' => true,
        'status'                   => 'active',
    ], $admin);

    $classSubject = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    expect(ClassSession::where('class_subject_id', $classSubject->id)->count())->toBe(60);

    // Update with 2 days per week (Tuesday and Thursday)
    $updatedSchedule = $service->updateSchedule($schedule->id, [
        'teacher_id'       => $teacher->id,
        'start_date'       => '2026-09-01',
        'end_date'         => null, // Clear end date to recalculate
        'weekly_schedules' => [
            ['weekday' => 2, 'start_time' => '18:00', 'end_time' => '20:00'],
            ['weekday' => 4, 'start_time' => '18:00', 'end_time' => '20:00'],
        ],
        'exclude_vietnam_holidays' => true,
        'status'                   => 'active',
    ], $admin);

    expect($updatedSchedule)->toBeInstanceOf(ClassSchedule::class)
        ->and($updatedSchedule->effective_to)->not->toBeNull();

    $newSessionsCount = ClassSession::where('class_subject_id', $classSubject->id)->count();
    expect($newSessionsCount)->toBe(60);
});

test('does not recreate sessions when only teacher or room changes without date or schedule changes', function () {
    $center = Center::create([
        'code'   => 'CTR000000003',
        'name'   => 'Trung Tâm Test 3',
        'email'  => 'center3@test.com',
        'phone'  => '0901234569',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_4',
        'full_name'  => 'Super Admin Test 4',
        'email'      => 'superadmin4@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000004',
    ]);

    $teacher1 = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000004',
        'username'     => 'teacher_test_4',
        'first_name'   => 'D',
        'last_name'    => 'Nguyễn Văn',
        'full_name'    => 'Nguyễn Văn D',
        'email'        => 'teacher4@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $teacher2 = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000005',
        'username'     => 'teacher_test_5',
        'first_name'   => 'E',
        'last_name'    => 'Nguyễn Văn',
        'full_name'    => 'Nguyễn Văn E',
        'email'        => 'teacher5@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000008',
        'name'             => 'Luyện Thi IELTS C1 Test 3',
        'total_sessions'   => 10,
        'duration_minutes' => 90,
        'tuition_fee'      => 4000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000004',
        'name'         => 'Lớp IELTS C1 - Test 3',
        'max_students' => 25,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $service = app(ClassScheduleServiceInterface::class);

    $schedule = $service->createSchedule([
        'class_id'         => $class->id,
        'subject_id'       => $subject->id,
        'teacher_id'       => $teacher1->id,
        'start_date'       => '2026-09-01',
        'end_date'         => null,
        'weekly_schedules' => [
            ['weekday' => 1, 'start_time' => '18:00', 'end_time' => '20:00'],
        ],
        'exclude_vietnam_holidays' => true,
        'status'                   => 'active',
    ], $admin);

    $classSubject      = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    $initialSessionIds = ClassSession::where('class_subject_id', $classSubject->id)->pluck('id')->toArray();
    expect(count($initialSessionIds))->toBe(10);

    // Update ONLY teacher_id
    $service->updateSchedule($schedule->id, [
        'teacher_id'       => $teacher2->id,
        'start_date'       => '2026-09-01',
        'weekly_schedules' => [
            ['weekday' => 1, 'start_time' => '18:00', 'end_time' => '20:00'],
        ],
        'status' => 'active',
    ], $admin);

    $afterSessionIds = ClassSession::where('class_subject_id', $classSubject->id)->pluck('id')->toArray();
    // Same session records, not deleted and recreated
    expect($afterSessionIds)->toEqual($initialSessionIds);

    // But teacher_id on sessions is updated to teacher2
    $teacherIds = ClassSession::where('class_subject_id', $classSubject->id)->pluck('teacher_id')->unique()->toArray();
    expect($teacherIds)->toEqual([$teacher2->id]);
});
