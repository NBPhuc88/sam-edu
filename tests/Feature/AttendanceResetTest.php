<?php

use App\Models\Admin;
use App\Models\Attendance;
use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->center = Center::create([
        'name'       => 'Trung Tâm Test Attendance',
        'code'       => 'CTR_TEST_ATT',
        'status'     => 'active',
        'expires_at' => now()->addYear(),
    ]);

    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_att',
        'full_name'  => 'Super Admin Attendance',
        'email'      => 'superadmin_att@example.com',
        'password'   => Hash::make('password123'),
        'role'       => 'super_admin',
        'admin_code' => 'ADM_ATT_001',
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_att',
        'first_name'   => 'A',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên A',
        'email'        => 'teacher_att@example.com',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'T_ATT_001',
        'status'       => 'active',
    ]);

    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_att',
        'first_name'   => 'B',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh B',
        'email'        => 'student_att@example.com',
        'password'     => Hash::make('password123'),
        'student_code' => 'S_ATT_001',
        'status'       => 1,
    ]);

    $this->subject = Subject::create([
        'center_id'        => $this->center->id,
        'name'             => 'Toán Nâng Cao',
        'code'             => 'MATH_ATT',
        'total_sessions'   => 10,
        'duration_minutes' => 90,
        'status'           => 'active',
    ]);

    $this->schoolClass = SchoolClass::create([
        'center_id'    => $this->center->id,
        'name'         => 'Lớp 10A1 Test',
        'code'         => 'CLS_10A1_ATT',
        'status'       => 1,
        'max_students' => 30,
        'start_date'   => now()->toDateString(),
        'end_date'     => now()->addMonths(3)->toDateString(),
    ]);

    $this->schoolClass->students()->attach($this->student->id, [
        'status'      => 'active',
        'enrolled_at' => now(),
    ]);

    $this->classSubject = ClassSubject::create([
        'class_id'   => $this->schoolClass->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'status'     => 'active',
    ]);

    $this->room = Room::create([
        'center_id' => $this->center->id,
        'name'      => 'Phòng 101',
        'code'      => 'R101',
        'capacity'  => 30,
    ]);

    $this->session = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => now()->toDateString(),
        'start_time'       => '00:00:00',
        'end_time'         => '23:59:59',
        'status'           => 'scheduled',
    ]);
});

test('admin can save attendance and session status updates to completed', function () {
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->post(route('attendance.save', ['sessionId' => $this->session->id]), [
            'attendances' => [
                [
                    'student_id' => $this->student->id,
                    'status'     => 'present',
                    'note'       => 'Có mặt đầy đủ',
                ],
            ],
        ]);

    $response->assertRedirect();

    expect(Attendance::where('session_id', $this->session->id)->count())->toBe(1);
    expect($this->session->fresh()->status)->toBe('completed');
});

test('admin can reset attendance and session status reverts to scheduled', function () {
    // 1. Mark attendance first
    $this->actingAs($this->superAdmin, 'admin')
        ->post(route('attendance.save', ['sessionId' => $this->session->id]), [
            'attendances' => [
                [
                    'student_id' => $this->student->id,
                    'status'     => 'present',
                    'note'       => 'Điểm danh nhầm buổi',
                ],
            ],
        ]);

    expect(Attendance::where('session_id', $this->session->id)->count())->toBe(1);
    expect($this->session->fresh()->status)->toBe('completed');

    // 2. Reset attendance
    $resetResponse = $this->actingAs($this->superAdmin, 'admin')
        ->post(route('attendance.reset', ['sessionId' => $this->session->id]));

    $resetResponse->assertRedirect();
    $resetResponse->assertSessionHas('success');

    // Verify attendances were deleted and status reverted to scheduled (Chưa dạy)
    expect(Attendance::where('session_id', $this->session->id)->count())->toBe(0);
    expect($this->session->fresh()->status)->toBe('scheduled');
});

test('assigned teacher can reset attendance of their class session', function () {
    // 1. Save attendance
    $this->actingAs($this->teacher, 'teacher')
        ->post(route('attendance.save', ['sessionId' => $this->session->id]), [
            'attendances' => [
                [
                    'student_id' => $this->student->id,
                    'status'     => 'absent',
                    'note'       => 'Vắng',
                ],
            ],
        ]);

    expect($this->session->fresh()->status)->toBe('completed');

    // 2. Teacher resets attendance
    $resetResponse = $this->actingAs($this->teacher, 'teacher')
        ->post(route('attendance.reset', ['sessionId' => $this->session->id]));

    $resetResponse->assertRedirect();
    expect(Attendance::where('session_id', $this->session->id)->count())->toBe(0);
    expect($this->session->fresh()->status)->toBe('scheduled');
});

test('resetting attendance of past session reverts status to unattended', function () {
    $pastSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => now()->subDays(2)->toDateString(),
        'start_time'       => '08:00:00',
        'end_time'         => '09:30:00',
        'status'           => 'completed',
    ]);

    Attendance::create([
        'session_id' => $pastSession->id,
        'student_id' => $this->student->id,
        'status'     => 'present',
    ]);

    $resetResponse = $this->actingAs($this->superAdmin, 'admin')
        ->post(route('attendance.reset', ['sessionId' => $pastSession->id]));

    $resetResponse->assertRedirect();
    expect(Attendance::where('session_id', $pastSession->id)->count())->toBe(0);
    expect($pastSession->fresh()->status)->toBe('unattended');
});
