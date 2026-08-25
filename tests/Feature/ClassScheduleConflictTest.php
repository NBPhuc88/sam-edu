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
        'code'   => 'CTR_TEST_001',
        'name'   => 'Trung Tâm Test Conflict',
        'email'  => 'conflict_center@test.com',
        'phone'  => '0901234567',
        'status' => 'active',
    ]);

    $this->admin = Admin::create([
        'username'   => 'admin_conflict_test',
        'full_name'  => 'Admin Conflict Test',
        'email'      => 'admin_conflict@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM_CONF_001',
    ]);

    $this->teacher1 = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV_CONF_001',
        'username'     => 'teacher_conf_1',
        'first_name'   => 'A',
        'last_name'    => 'Nguyễn Văn',
        'full_name'    => 'Nguyễn Văn A',
        'email'        => 'teacher_conf1@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $this->teacher2 = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV_CONF_002',
        'username'     => 'teacher_conf_2',
        'first_name'   => 'B',
        'last_name'    => 'Trần Thị',
        'full_name'    => 'Trần Thị B',
        'email'        => 'teacher_conf2@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $this->class = SchoolClass::create([
        'center_id'    => $this->center->id,
        'code'         => 'CLS_CONF_001',
        'name'         => 'Lớp 10A1 Đa Môn',
        'max_students' => 30,
        'status'       => EntityStatus::ACTIVE,
    ]);

    $this->subjectMath = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'SUB_MATH_01',
        'name'             => 'Toán 10 Nâng Cao',
        'total_sessions'   => 20,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    $this->subjectPhysics = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'SUB_PHYS_01',
        'name'             => 'Vật Lý 10',
        'total_sessions'   => 20,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    // Assign subjects to class
    $this->csMath = ClassSubject::create([
        'class_id'   => $this->class->id,
        'subject_id' => $this->subjectMath->id,
        'teacher_id' => $this->teacher1->id,
        'start_date' => '2026-09-01',
        'end_date'   => '2026-11-30',
        'status'     => 'active',
    ]);

    $this->csPhysics = ClassSubject::create([
        'class_id'   => $this->class->id,
        'subject_id' => $this->subjectPhysics->id,
        'teacher_id' => $this->teacher2->id,
        'start_date' => '2026-09-01',
        'end_date'   => '2026-11-30',
        'status'     => 'active',
    ]);
});

test('blocks creating schedule for subject when weekly time slot overlaps with existing subject in same class', function () {
    // 1. Create schedule for Math: Thứ 2 (1) and Thứ 4 (3) at 18:00 - 20:00
    $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->class->id,
        'subject_id'    => $this->subjectMath->id,
        'teacher_id'    => $this->teacher1->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['18:00', '20:00']],
            '3' => [['18:00', '20:00']],
        ],
    ])->assertRedirect('/schedules');

    // 2. Try creating schedule for Physics on Thứ 2 (1) overlapping 19:00 - 21:00
    $response = $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->class->id,
        'subject_id'    => $this->subjectPhysics->id,
        'teacher_id'    => $this->teacher2->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['19:00', '21:00']],
            '5' => [['18:00', '20:00']],
        ],
    ]);

    $response->assertSessionHasErrors(['weeks']);
});

test('allows creating schedule for subject with different weekly time slots or days in same class', function () {
    // 1. Create schedule for Math: Thứ 2 (1) at 18:00 - 20:00
    $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->class->id,
        'subject_id'    => $this->subjectMath->id,
        'teacher_id'    => $this->teacher1->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['18:00', '20:00']],
        ],
    ])->assertRedirect('/schedules');

    // 2. Create schedule for Physics: Thứ 2 (1) at 08:00 - 10:00 (non-overlapping) and Thứ 3 (2) at 18:00 - 20:00
    $response = $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->class->id,
        'subject_id'    => $this->subjectPhysics->id,
        'teacher_id'    => $this->teacher2->id,
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

test('allows updating own schedule without triggering self-conflict', function () {
    // 1. Create schedule for Math
    $this->actingAs($this->admin, 'admin')->post('/schedules', [
        'class_id'      => $this->class->id,
        'subject_id'    => $this->subjectMath->id,
        'teacher_id'    => $this->teacher1->id,
        'start_date'    => '2026-09-01',
        'auto_holidays' => false,
        'weeks'         => [
            '1' => [['18:00', '20:00']],
            '3' => [['18:00', '20:00']],
        ],
    ]);

    $scheduleMath = $this->csMath->fresh()->classSchedules->first();

    // 2. Update Math schedule
    $response = $this->actingAs($this->admin, 'admin')->put('/schedules/' . $scheduleMath->id, [
        'teacher_id'    => $this->teacher1->id,
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

test('blocks rescheduling a session when it conflicts with another subject session in the same class', function () {
    // 1. Setup Math session on 2026-09-07 (Thứ 2) from 18:00 - 20:00
    $sessionMath = ClassSession::create([
        'class_id'         => $this->class->id,
        'class_subject_id' => $this->csMath->id,
        'teacher_id'       => $this->teacher1->id,
        'session_date'     => '2026-09-07',
        'start_time'       => '18:00',
        'end_time'         => '20:00',
        'status'           => 'scheduled',
    ]);

    // 2. Setup Physics session on 2026-09-08 (Thứ 3) from 18:00 - 20:00
    $sessionPhysics = ClassSession::create([
        'class_id'         => $this->class->id,
        'class_subject_id' => $this->csPhysics->id,
        'teacher_id'       => $this->teacher2->id,
        'session_date'     => '2026-09-08',
        'start_time'       => '18:00',
        'end_time'         => '20:00',
        'status'           => 'scheduled',
    ]);

    // 3. Try to reschedule Physics session to 2026-09-07 from 19:00 - 21:00 (overlapping Math session)
    $service = app(ClassSessionServiceInterface::class);

    expect(function () use ($service, $sessionPhysics) {
        $service->updateOrRescheduleSession($sessionPhysics, [
            'session_date' => '2026-09-07',
            'start_time'   => '19:00',
            'end_time'     => '21:00',
            'reason'       => 'Dời lịch',
        ]);
    })->toThrow(\Illuminate\Validation\ValidationException::class);
});
