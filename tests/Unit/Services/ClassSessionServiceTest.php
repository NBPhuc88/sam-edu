<?php

use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\Session\ClassSessionService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(ClassSessionService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test SessionService',
        'status' => 'active',
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Session Test',
        'status'    => 1,
    ]);
    $this->subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'S' . random_int(1000000, 9999999),
        'name'      => 'Subject Session Test',
    ]);
    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_sess_test',
        'first_name'   => 'Teacher',
        'last_name'    => 'Sess',
        'full_name'    => 'Teacher Sess Test',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => 'active',
    ]);
    $this->room = Room::create([
        'center_id' => $this->center->id,
        'name'      => 'Room Sess Test',
        'code'      => 'R' . random_int(1000000, 9999999),
    ]);

    $this->classSubject = ClassSubject::create([
        'class_id'   => $this->schoolClass->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'status'     => 'active',
    ]);

    $this->session = ClassSession::create([
        'class_subject_id' => $this->classSubject->id,
        'teacher_id'       => $this->teacher->id,
        'room_id'          => $this->room->id,
        'session_date'     => now()->addDays(5)->toDateString(),
        'start_time'       => '08:00:00',
        'end_time'         => '10:00:00',
        'status'           => 'scheduled',
    ]);
});

test('updateOrRescheduleSession updates session time and records reschedule log', function () {
    $newDate = now()->addDays(6)->toDateString();

    $updated = $this->service->updateOrRescheduleSession($this->session->id, [
        'session_date' => $newDate,
        'start_time'   => '09:00:00',
        'end_time'     => '11:00:00',
        'reason'       => 'Giáo viên xin đổi lịch',
    ]);

    $updatedDate = is_object($updated->session_date) ? $updated->session_date->format('Y-m-d') : (string) $updated->session_date;

    expect($updatedDate)->toBe($newDate);
    $this->assertDatabaseHas('session_reschedules', [
        'session_id' => $this->session->id,
        'reason'     => 'Giáo viên xin đổi lịch',
    ]);
});

test('autoUpdateSessionStatuses updates past/present session statuses correctly', function () {
    $result = $this->service->autoUpdateSessionStatuses();

    expect($result)->toHaveKeys(['in_progress', 'completed', 'unattended']);
});
