<?php

use App\Enums\Constant;
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
use App\Services\Attendance\AttendanceServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->center = Center::create([
        'name'       => 'Trung Tâm Test Status',
        'code'       => 'CTR_STATUS_01',
        'status'     => Constant::STATUS_ACTIVE,
        'expires_at' => now()->addYear(),
    ]);

    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_cmd',
        'full_name'  => 'Super Admin Command',
        'email'      => 'admin_cmd@example.com',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM_CMD_001',
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_cmd',
        'first_name'   => 'C',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên C',
        'email'        => 'teacher_cmd@example.com',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'T_CMD_001',
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_cmd',
        'first_name'   => 'D',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh D',
        'email'        => 'student_cmd@example.com',
        'password'     => Hash::make('password123'),
        'student_code' => 'S_CMD_001',
        'status'       => 1,
    ]);

    $this->subject = Subject::create([
        'center_id'        => $this->center->id,
        'name'             => 'Vật Lý 10',
        'code'             => 'PHYS_CMD',
        'total_sessions'   => 10,
        'duration_minutes' => 90,
        'tuition_fee'      => 1000000,
        'status'           => Constant::STATUS_ACTIVE,
    ]);

    $this->room = Room::create([
        'center_id' => $this->center->id,
        'name'      => 'Phòng Lab 01',
        'code'      => 'R_CMD_01',
        'capacity'  => 30,
    ]);

    $this->class = SchoolClass::create([
        'center_id'    => $this->center->id,
        'name'         => 'Lớp Lý Nâng Cao',
        'code'         => 'CLS_PHYS_01',
        'max_capacity' => 30,
        'start_date'   => now()->subMonths(1)->toDateString(),
        'end_date'     => now()->addMonths(2)->toDateString(),
        'status'       => 1,
    ]);

    $this->classSubject = ClassSubject::create([
        'class_id'   => $this->class->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
    ]);
});

test('command sessions:update-status updates running sessions to in_progress, ended sessions with attendance to completed, and ended without attendance to unattended', function () {
    // Freeze time at 10:00 AM today
    Carbon::setTestNow(Carbon::parse('2026-08-25 10:00:00'));

    // 1. Session currently ongoing (09:30 - 11:00) -> should become in_progress
    $ongoingSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => '2026-08-25',
        'start_time'       => '09:30:00',
        'end_time'         => '11:00:00',
        'status'           => Constant::SESSION_STATUS_SCHEDULED,
    ]);

    // 2. Session ended in the past today without attendance (08:00 - 09:30) -> should become unattended (5)
    $pastUnattendedSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => '2026-08-25',
        'start_time'       => '08:00:00',
        'end_time'         => '09:30:00',
        'status'           => Constant::SESSION_STATUS_SCHEDULED,
    ]);

    // 3. Session ended in the past today with attendance -> should become completed
    $pastAttendedSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => '2026-08-25',
        'start_time'       => '07:30:00',
        'end_time'         => '09:00:00',
        'status'           => Constant::SESSION_STATUS_SCHEDULED,
    ]);
    Attendance::create([
        'session_id' => $pastAttendedSession->id,
        'student_id' => $this->student->id,
        'status'     => Constant::ATTENDANCE_STATUS_PRESENT,
        'marked_at'  => now(),
    ]);

    // 4. Session in future today (14:00 - 15:30) -> should remain scheduled
    $futureSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => '2026-08-25',
        'start_time'       => '14:00:00',
        'end_time'         => '15:30:00',
        'status'           => Constant::SESSION_STATUS_SCHEDULED,
    ]);

    // Run artisan command
    $this->artisan('sessions:update-status')->assertSuccessful();

    // Verify statuses
    expect($ongoingSession->fresh()->status)->toBe(Constant::SESSION_STATUS_IN_PROGRESS);
    expect($pastUnattendedSession->fresh()->status)->toBe(Constant::SESSION_STATUS_UNATTENDED);
    expect($pastAttendedSession->fresh()->status)->toBe(Constant::SESSION_STATUS_COMPLETED);
    expect($futureSession->fresh()->status)->toBe(Constant::SESSION_STATUS_SCHEDULED);

    Carbon::setTestNow(); // Reset mocked time
});

test('saving attendance on unattended session changes status to completed, and resetting sets it back to unattended', function () {
    Carbon::setTestNow(Carbon::parse('2026-08-25 15:00:00'));

    $pastSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => '2026-08-25',
        'start_time'       => '08:00:00',
        'end_time'         => '09:30:00',
        'status'           => Constant::SESSION_STATUS_UNATTENDED,
    ]);

    $attendanceService = app(AttendanceServiceInterface::class);

    // Save attendance
    $attendanceService->saveAttendance(
        $pastSession->id,
        [
            ['student_id' => $this->student->id, 'status' => Constant::ATTENDANCE_STATUS_PRESENT, 'note' => 'Có mặt'],
        ],
        $this->superAdmin
    );

    expect($pastSession->fresh()->status)->toBe(Constant::SESSION_STATUS_COMPLETED);
    expect(Attendance::where('session_id', $pastSession->id)->count())->toBe(1);

    // Reset attendance
    $attendanceService->resetAttendance($pastSession->id, $this->superAdmin);

    expect($pastSession->fresh()->status)->toBe(Constant::SESSION_STATUS_UNATTENDED);
    expect(Attendance::where('session_id', $pastSession->id)->count())->toBe(0);

    Carbon::setTestNow();
});

test('saving attendance before session start throws ValidationException', function () {
    Carbon::setTestNow(Carbon::parse('2026-08-25 08:00:00'));

    $futureSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => '2026-08-25',
        'start_time'       => '14:00:00',
        'end_time'         => '15:30:00',
        'status'           => Constant::SESSION_STATUS_SCHEDULED,
    ]);

    $attendanceService = app(AttendanceServiceInterface::class);

    expect(function () use ($attendanceService, $futureSession) {
        $attendanceService->saveAttendance(
            $futureSession->id,
            [
                ['student_id' => $this->student->id, 'status' => Constant::ATTENDANCE_STATUS_PRESENT, 'note' => 'Có mặt'],
            ],
            $this->superAdmin
        );
    })->toThrow(\Illuminate\Validation\ValidationException::class);

    Carbon::setTestNow();
});
