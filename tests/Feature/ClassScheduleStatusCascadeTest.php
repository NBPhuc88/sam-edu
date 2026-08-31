<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassStudent;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Repositories\Student\StudentRepository;
use App\Repositories\Teacher\TeacherRepository;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);

    $this->center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm Test Cascade',
        'email'  => 'cascade_center@test.com',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_cascade',
        'full_name'  => 'Super Admin Cascade',
        'email'      => 'admin_cascade@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::ADMIN_STATUS_ACTIVE,
        'admin_code' => 'ADM000000099',
    ]);

    $this->teacher = Teacher::create([
        'username'     => 'teacher_cascade',
        'first_name'   => 'Giáo Viên',
        'last_name'    => 'Cascade',
        'full_name'    => 'Giáo Viên Cascade',
        'email'        => 'teacher_cascade@test.com',
        'password'     => 'password123',
        'teacher_code' => 'GV000000099',
        'center_id'    => $this->center->id,
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $this->student = Student::create([
        'username'     => 'student_cascade',
        'first_name'   => 'Học Sinh',
        'last_name'    => 'Cascade',
        'full_name'    => 'Học Sinh Cascade',
        'email'        => 'student_cascade@test.com',
        'password'     => 'password123',
        'student_code' => 'HS000000099',
        'center_id'    => $this->center->id,
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $this->subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'SUB099',
        'name'      => 'Toán 10 Cascade',
        'status'    => Constant::SUBJECT_STATUS_ACTIVE,
    ]);
});

function createClassWithSchedulesAndSessions(Center $center, Teacher $teacher, Student $student, Subject $subject): array
{
    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS_' . uniqid(),
        'name'      => 'Lớp Test Cascade',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);

    ClassStudent::create([
        'class_id'    => $class->id,
        'student_id'  => $student->id,
        'status'      => Constant::CLASS_STUDENT_STATUS_ACTIVE,
        'enrolled_at' => now()->toDateString(),
    ]);

    $classSubject = ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'start_date' => now()->toDateString(),
        'status'     => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    $schedule = ClassSchedule::create([
        'class_subject_id' => $classSubject->id,
        'weeks'            => ['1' => [['08:00', '10:00']]],
        'status'           => Constant::SCHEDULE_STATUS_ACTIVE,
    ]);

    $scheduledSession = ClassSession::create([
        'class_subject_id'  => $classSubject->id,
        'class_schedule_id' => $schedule->id,
        'teacher_id'        => $teacher->id,
        'session_date'      => now()->addDays(2)->toDateString(),
        'start_time'        => '08:00',
        'end_time'          => '10:00',
        'status'            => Constant::SESSION_STATUS_SCHEDULED,
    ]);

    $completedSession = ClassSession::create([
        'class_subject_id'  => $classSubject->id,
        'class_schedule_id' => $schedule->id,
        'teacher_id'        => $teacher->id,
        'session_date'      => now()->subDays(2)->toDateString(),
        'start_time'        => '08:00',
        'end_time'          => '10:00',
        'status'            => Constant::SESSION_STATUS_COMPLETED,
    ]);

    return [$class, $classSubject, $schedule, $scheduledSession, $completedSession];
}

test('updating class status to inactive pauses schedules and cancels scheduled sessions', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('classes.update', $class->id), [
            'center_id' => $this->center->id,
            'name'      => $class->name,
            'status'    => Constant::CLASS_STATUS_INACTIVE,
        ]);

    $response->assertRedirect();

    $schedule->refresh();
    $scheduledSession->refresh();
    $completedSession->refresh();
    $classSubject->refresh();

    // 1. Schedule should be inactive (đã dừng)
    expect($schedule->status)->toBe(Constant::SCHEDULE_STATUS_INACTIVE);

    // 2. Scheduled session should be cancelled (đã hủy)
    expect($scheduledSession->status)->toBe(Constant::SESSION_STATUS_CANCELLED);

    // 3. Completed session should NOT be affected
    expect($completedSession->status)->toBe(Constant::SESSION_STATUS_COMPLETED);

    // 4. ClassSubject should be inactive
    expect($classSubject->status)->toBe(Constant::CLASS_SUBJECT_STATUS_INACTIVE);
});

test('updating class status to completed pauses schedules, cancels scheduled sessions, and completes class subjects', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('classes.update', $class->id), [
            'center_id' => $this->center->id,
            'name'      => $class->name,
            'status'    => Constant::CLASS_STATUS_COMPLETED,
        ]);

    $response->assertRedirect();

    $schedule->refresh();
    $scheduledSession->refresh();
    $completedSession->refresh();
    $classSubject->refresh();

    expect($schedule->status)->toBe(Constant::SCHEDULE_STATUS_INACTIVE);
    expect($scheduledSession->status)->toBe(Constant::SESSION_STATUS_CANCELLED);
    expect($completedSession->status)->toBe(Constant::SESSION_STATUS_COMPLETED);
    expect($classSubject->status)->toBe(Constant::CLASS_SUBJECT_STATUS_COMPLETED);
});

test('updating class status to closed pauses schedules and cancels scheduled sessions', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('classes.update', $class->id), [
            'center_id' => $this->center->id,
            'name'      => $class->name,
            'status'    => Constant::CLASS_STATUS_CLOSED,
        ]);

    $response->assertRedirect();

    $schedule->refresh();
    $scheduledSession->refresh();
    $completedSession->refresh();

    expect($schedule->status)->toBe(Constant::SCHEDULE_STATUS_INACTIVE);
    expect($scheduledSession->status)->toBe(Constant::SESSION_STATUS_CANCELLED);
    expect($completedSession->status)->toBe(Constant::SESSION_STATUS_COMPLETED);
});

test('deleting class pauses schedules and permanently deletes future sessions', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    $response = $this->actingAs($this->superAdmin, 'admin')
        ->delete(route('classes.destroy', $class->id));

    $response->assertRedirect();

    $schedule->refresh();
    $completedSession->refresh();

    expect(SchoolClass::find($class->id))->toBeNull();
    expect($schedule->status)->toBe(Constant::SCHEDULE_STATUS_INACTIVE);
    // Future scheduled session must be deleted permanently
    expect(ClassSession::find($scheduledSession->id))->toBeNull();
    // Past completed session is retained
    expect($completedSession->status)->toBe(Constant::SESSION_STATUS_COMPLETED);
});

test('cancelled sessions are excluded from teacher and student schedule queries', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    // Cancel the session
    $scheduledSession->update(['status' => Constant::SESSION_STATUS_CANCELLED]);

    $teacherRepo = app(TeacherRepository::class);
    $studentRepo = app(StudentRepository::class);

    $startDate = now()->subDays(5)->toDateString();
    $endDate   = now()->addDays(5)->toDateString();

    // 1. Teacher session list should NOT contain cancelled session
    $teacherSessions = $teacherRepo->getTeacherSessionsBetweenDates($this->teacher->id, $startDate, $endDate);
    expect($teacherSessions->pluck('id')->toArray())->not->toContain($scheduledSession->id);
    expect($teacherSessions->pluck('id')->toArray())->toContain($completedSession->id);

    // 2. Student session list should NOT contain cancelled session
    $studentSessions = $studentRepo->getStudentSessionsBetweenDates($this->student->id, $startDate, $endDate);
    expect($studentSessions->pluck('id')->toArray())->not->toContain($scheduledSession->id);
    expect($studentSessions->pluck('id')->toArray())->toContain($completedSession->id);
});

test('class edit page provides futureSessionsCount prop', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    $response = $this->actingAs($this->superAdmin, 'admin')
        ->get(route('classes.edit', $class->id));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Admin/Classes/Edit')
        ->has('futureSessionsCount')
        ->where('futureSessionsCount', 1)
    );
});

test('updating schedule status to inactive cancels future scheduled sessions', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('schedules.update', $schedule->id), [
            'teacher_id' => $this->teacher->id,
            'start_date' => now()->toDateString(),
            'status'     => Constant::SCHEDULE_STATUS_INACTIVE,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $schedule->refresh();
    $scheduledSession->refresh();
    $completedSession->refresh();

    expect($schedule->status)->toBe(Constant::SCHEDULE_STATUS_INACTIVE);
    expect($scheduledSession->status)->toBe(Constant::SESSION_STATUS_CANCELLED);
    expect($completedSession->status)->toBe(Constant::SESSION_STATUS_COMPLETED);
});

test('updating schedule status from inactive to active regenerates future sessions when class is active', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    // Set schedule to inactive first
    $schedule->update(['status' => Constant::SCHEDULE_STATUS_INACTIVE]);
    $scheduledSession->update(['status' => Constant::SESSION_STATUS_CANCELLED]);

    // Now update schedule back to active
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('schedules.update', $schedule->id), [
            'teacher_id' => $this->teacher->id,
            'start_date' => now()->toDateString(),
            'weeks'      => ['1' => [['08:00', '10:00']]],
            'status'     => Constant::SCHEDULE_STATUS_ACTIVE,
        ]);

    $response->assertRedirect();

    $schedule->refresh();
    expect($schedule->status)->toBe(Constant::SCHEDULE_STATUS_ACTIVE);

    // Check that scheduled sessions are generated/restored
    $futureActiveSessionsCount = ClassSession::where('class_subject_id', $classSubject->id)
        ->where('session_date', '>=', now()->toDateString())
        ->where('status', Constant::SESSION_STATUS_SCHEDULED)
        ->count();

    expect($futureActiveSessionsCount)->toBeGreaterThan(0);
});

test('cannot update schedule status if class is not active', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    // Set class to inactive
    $class->update(['status' => Constant::CLASS_STATUS_INACTIVE]);

    // Try to update schedule status
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('schedules.update', $schedule->id), [
            'teacher_id' => $this->teacher->id,
            'start_date' => now()->toDateString(),
            'status'     => Constant::SCHEDULE_STATUS_INACTIVE,
        ]);

    $response->assertSessionHasErrors('status');
});

test('cancelled sessions are not counted towards schedule sessions count or past sessions', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    // Cancel the scheduled session
    $scheduledSession->update(['status' => Constant::SESSION_STATUS_CANCELLED]);

    $scheduleRepo = app(\App\Repositories\Schedule\ClassScheduleRepository::class);
    $sessionRepo  = app(\App\Repositories\Session\ClassSessionRepository::class);

    // 1. Check scheduleRepo find withCount classSessions excludes cancelled sessions
    $foundSchedule = $scheduleRepo->find($schedule->id);
    expect($foundSchedule->class_sessions_count)->toBe(1); // Only the completed session
    expect($foundSchedule->classSubject->class_sessions_count)->toBe(1);

    // 2. Check getPastSessionsCursor excludes cancelled sessions
    $pastCursor     = $sessionRepo->getPastSessionsCursor($classSubject->id, now()->addDays(10)->toDateString());
    $pastSessionIds = [];

    foreach ($pastCursor as $s) {
        $pastSessionIds[] = $s->id;
    }
    expect($pastSessionIds)->not->toContain($scheduledSession->id);
    expect($pastSessionIds)->toContain($completedSession->id);

    // 3. Check schedules.sessions API excludes cancelled sessions
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->get(route('schedules.sessions', $schedule->id));

    $response->assertOk();
    $sessionIdsInJson = collect($response->json('sessions'))->pluck('id')->toArray();
    expect($sessionIdsInJson)->not->toContain($scheduledSession->id);
    expect($sessionIdsInJson)->toContain($completedSession->id);
});

test('cannot update or reschedule a cancelled session', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    // Cancel the session
    $scheduledSession->update(['status' => Constant::SESSION_STATUS_CANCELLED]);

    // Try to update/reschedule the cancelled session
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('sessions.update', $scheduledSession->id), [
            'session_date' => now()->addDays(2)->toDateString(),
            'start_time'   => '09:00',
            'end_time'     => '11:00',
            'note'         => 'Cập nhật ghi chú cho ca học đã hủy',
        ]);

    $response->assertSessionHasErrors('session');
});

test('past cancelled sessions remain cancelled when schedule is updated or reactivated', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    // Create a past cancelled session
    $pastCancelledSession = \App\Models\ClassSession::create([
        'class_subject_id'  => $classSubject->id,
        'class_schedule_id' => $schedule->id,
        'teacher_id'        => $this->teacher->id,
        'room_id'           => null,
        'session_date'      => now()->subDays(5)->toDateString(),
        'start_time'        => '08:00:00',
        'end_time'          => '10:00:00',
        'status'            => Constant::SESSION_STATUS_CANCELLED,
        'topic'             => 'Ca hoc qua khu da huy',
    ]);

    // Update schedule
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->patch(route('schedules.update', $schedule->id), [
            'teacher_id' => $this->teacher->id,
            'start_date' => now()->toDateString(),
            'weeks'      => [
                ['day_of_week' => (int) now()->dayOfWeekIso, 'start_time' => '08:00', 'end_time' => '10:00'],
            ],
            'status' => Constant::SCHEDULE_STATUS_ACTIVE,
        ]);

    $response->assertSessionHasNoErrors();
    $pastCancelledSession->refresh();

    // Verify it remains CANCELLED and is not converted to SCHEDULED
    expect($pastCancelledSession->status)->toBe(Constant::SESSION_STATUS_CANCELLED);
});

test('cannot create duplicate active schedule for the same class and subject', function () {
    [$class, $classSubject, $schedule, $scheduledSession, $completedSession] = createClassWithSchedulesAndSessions(
        $this->center,
        $this->teacher,
        $this->student,
        $this->subject
    );

    // Schedule already exists and is active for this class and subject
    expect($schedule->status)->toBe(Constant::SCHEDULE_STATUS_ACTIVE);

    // Try to create another schedule for the same class and subject
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->post(route('schedules.store'), [
            'class_id'   => $class->id,
            'subject_id' => $this->subject->id,
            'teacher_id' => $this->teacher->id,
            'start_date' => now()->toDateString(),
            'weeks'      => [
                ['day_of_week' => (int) now()->dayOfWeekIso, 'start_time' => '14:00', 'end_time' => '16:00'],
            ],
            'status' => Constant::SCHEDULE_STATUS_ACTIVE,
        ]);

    $response->assertSessionHasErrors('subject_id');
});
