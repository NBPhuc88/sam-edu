<?php

use App\Enums\EntityStatus;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\Session\ClassSessionServiceInterface;

beforeEach(function () {
    $this->center = Center::create([
        'code'   => 'CTR_TEACHER_CONF',
        'name'   => 'Trung Tâm Test Giáo Viên',
        'email'  => 'teacher_center@test.com',
        'phone'  => '0901234567',
        'status' => 'active',
    ]);

    $this->admin = Admin::create([
        'username'   => 'admin_teacher_conf',
        'full_name'  => 'Admin Teacher Conf',
        'email'      => 'admin_tconf@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM_TCONF_001',
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV_SHARED_001',
        'username'     => 'teacher_shared_1',
        'first_name'   => 'Nam',
        'last_name'    => 'Hoàng Văn',
        'full_name'    => 'Hoàng Văn Nam',
        'email'        => 'hoangvannam@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $this->classA = SchoolClass::create([
        'center_id'    => $this->center->id,
        'code'         => 'CLS_TA_001',
        'name'         => 'Lớp 10A1',
        'max_students' => 30,
        'status'       => EntityStatus::ACTIVE,
    ]);

    $this->classB = SchoolClass::create([
        'center_id'    => $this->center->id,
        'code'         => 'CLS_TB_001',
        'name'         => 'Lớp 10A2',
        'max_students' => 30,
        'status'       => EntityStatus::ACTIVE,
    ]);

    $this->subjectMath = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'SUB_T_MATH',
        'name'             => 'Toán 10',
        'total_sessions'   => 20,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    $this->subjectPhysics = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'SUB_T_PHYS',
        'name'             => 'Vật Lý 10',
        'total_sessions'   => 20,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    // Assign teacher to Class A (Math) and Class B (Physics)
    $this->csClassAMath = ClassSubject::create([
        'class_id'   => $this->classA->id,
        'subject_id' => $this->subjectMath->id,
        'teacher_id' => $this->teacher->id,
        'start_date' => '2026-09-01',
        'end_date'   => '2026-11-30',
        'status'     => 'active',
    ]);

    $this->csClassBPhysics = ClassSubject::create([
        'class_id'   => $this->classB->id,
        'subject_id' => $this->subjectPhysics->id,
        'teacher_id' => $this->teacher->id,
        'start_date' => '2026-09-01',
        'end_date'   => '2026-11-30',
        'status'     => 'active',
    ]);
});

test('blocks creating schedule when weekly time slot overlaps with another class taught by same teacher', function () {
    // 1. Create schedule for Teacher at Class A (Math): Thứ 2 (1) and Thứ 4 (3) at 18:00 - 20:00
    $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->classA->id,
        'subject_id'    => $this->subjectMath->id,
        'teacher_id'    => $this->teacher->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['18:00', '20:00']],
            '3' => [['18:00', '20:00']],
        ],
    ])->assertRedirect('/schedules');

    // 2. Try creating schedule for same Teacher at Class B (Physics) overlapping on Thứ 2 (1) at 19:00 - 21:00
    $response = $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->classB->id,
        'subject_id'    => $this->subjectPhysics->id,
        'teacher_id'    => $this->teacher->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['19:00', '21:00']],
            '5' => [['18:00', '20:00']],
        ],
    ]);

    $response->assertSessionHasErrors(['teacher_id']);
});

test('allows creating schedule for same teacher when weekly time slots or days do not overlap', function () {
    // 1. Create schedule for Class A: Thứ 2 (1) at 18:00 - 20:00
    $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->classA->id,
        'subject_id'    => $this->subjectMath->id,
        'teacher_id'    => $this->teacher->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['18:00', '20:00']],
        ],
    ])->assertRedirect('/schedules');

    // 2. Create schedule for Class B: Thứ 2 (1) at 08:00 - 10:00 and Thứ 3 (2) at 18:00 - 20:00
    $response = $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->classB->id,
        'subject_id'    => $this->subjectPhysics->id,
        'teacher_id'    => $this->teacher->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['08:00', '10:00']],
            '2' => [['18:00', '20:00']],
        ],
    ]);

    $response->assertRedirect('/schedules');
    $response->assertSessionHasNoErrors();
});

test('allows updating own schedule without triggering teacher self-conflict', function () {
    // 1. Create schedule for Class A
    $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->classA->id,
        'subject_id'    => $this->subjectMath->id,
        'teacher_id'    => $this->teacher->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['18:00', '20:00']],
            '3' => [['18:00', '20:00']],
        ],
    ]);

    $scheduleA = $this->csClassAMath->fresh()->classSchedules->first();

    // 2. Update Class A schedule
    $response = $this->actingAs($this->admin, 'admin')->put('/schedules/' . $scheduleA->id, [
        'teacher_id'    => $this->teacher->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['18:00', '20:00']],
            '3' => [['18:30', '20:30']],
        ],
    ]);

    $response->assertRedirect('/schedules');
    $response->assertSessionHasNoErrors();
});

test('blocks rescheduling a session when teacher already has another session at the same time in another class', function () {
    // 1. Teacher teaches Class A session on 2026-09-07 (Thứ 2) from 18:00 - 20:00
    $sessionClassA = ClassSession::create([
        'class_id'         => $this->classA->id,
        'class_subject_id' => $this->csClassAMath->id,
        'teacher_id'       => $this->teacher->id,
        'session_date'     => '2026-09-07',
        'start_time'       => '18:00',
        'end_time'         => '20:00',
        'status'           => 'scheduled',
    ]);

    // 2. Teacher teaches Class B session on 2026-09-08 (Thứ 3) from 18:00 - 20:00
    $sessionClassB = ClassSession::create([
        'class_id'         => $this->classB->id,
        'class_subject_id' => $this->csClassBPhysics->id,
        'teacher_id'       => $this->teacher->id,
        'session_date'     => '2026-09-08',
        'start_time'       => '18:00',
        'end_time'         => '20:00',
        'status'           => 'scheduled',
    ]);

    // 3. Try to reschedule Class B session to 2026-09-07 from 19:00 - 21:00 (overlapping teacher's Class A session)
    $service = app(ClassSessionServiceInterface::class);

    expect(function () use ($service, $sessionClassB) {
        $service->updateOrRescheduleSession($sessionClassB, [
            'session_date' => '2026-09-07',
            'start_time'   => '19:00',
            'end_time'     => '21:00',
            'reason'       => 'Dời lịch dạy',
        ]);
    })->toThrow(\Illuminate\Validation\ValidationException::class);
});
