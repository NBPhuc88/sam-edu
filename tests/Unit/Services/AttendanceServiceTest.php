<?php

use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\Attendance\AttendanceService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->service = app(AttendanceService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test AttendanceService',
        'status' => 'active',
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Attendance Test',
        'status'    => 1,
    ]);
    $this->subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'S' . random_int(1000000, 9999999),
        'name'      => 'Subject Att Test',
    ]);
    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_att_test',
        'first_name'   => 'Teacher',
        'last_name'    => 'Att',
        'full_name'    => 'Teacher Att Test',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => 'active',
    ]);
    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_att_test',
        'first_name'   => 'Student',
        'last_name'    => 'Att',
        'full_name'    => 'Student Att Test',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $this->schoolClass->students()->attach($this->student->id, ['enrolled_at' => now()]);

    $this->classSubject = ClassSubject::create([
        'class_id'   => $this->schoolClass->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'status'     => 'active',
    ]);

    $this->session = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'session_date'     => now()->subDays(1)->toDateString(),
        'start_time'       => '08:00:00',
        'end_time'         => '10:00:00',
        'status'           => 'scheduled',
    ]);
});

test('saveAttendance saves attendance status and marks session completed', function () {
    $attendances = [
        [
            'student_id' => $this->student->id,
            'status'     => 'present',
            'note'       => 'Di hoc dung gio',
        ],
    ];

    $result = $this->service->saveAttendance($this->session->id, $attendances, $this->teacher);

    expect($result)->toBeTrue();
    expect($this->session->fresh()->status)->toBe('completed');
    $this->assertDatabaseHas('attendances', [
        'session_id' => $this->session->id,
        'student_id' => $this->student->id,
        'status'     => 'present',
    ]);
});

test('saveAttendance throws validation exception when marking attendance before session start time', function () {
    $futureSession = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'session_date'     => now()->addDays(5)->toDateString(),
        'start_time'       => '08:00:00',
        'end_time'         => '10:00:00',
        'status'           => 'scheduled',
    ]);

    expect(fn () => $this->service->saveAttendance($futureSession->id, [], $this->teacher))
        ->toThrow(ValidationException::class);
});

test('resetAttendance resets all student attendance records for session', function () {
    $this->service->saveAttendance($this->session->id, [
        ['student_id' => $this->student->id, 'status' => 'present'],
    ], $this->teacher);

    $resetResult = $this->service->resetAttendance($this->session->id, $this->teacher);

    expect($resetResult)->toBeTrue();
    $this->assertDatabaseMissing('attendances', [
        'session_id' => $this->session->id,
    ]);
});
