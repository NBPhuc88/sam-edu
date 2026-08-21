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
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'start_date' => '2026-09-01',
        'end_date'   => null,
        'weeks'      => [
            '1' => [['18:00', '20:00']],
            '3' => [['18:00', '20:00']],
            '5' => [['18:00', '20:00']],
        ],
        'off_days' => [
            ['date' => '2026-09-02', 'start_time' => null, 'end_time' => null],
        ],
        'status' => 'active',
    ];

    $schedule = $service->createSchedule($data, $admin);

    expect($schedule)->toBeInstanceOf(ClassSchedule::class)
        ->and($schedule->weeks)->toHaveKey('1')
        ->and($schedule->off_days)->toHaveCount(1);

    $classSubject = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    expect($classSubject)->not->toBeNull()
        ->and($classSubject->start_date->format('Y-m-d'))->toBe('2026-09-01')
        ->and($classSubject->end_date)->not->toBeNull();

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
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'start_date' => '2026-09-01',
        'end_date'   => null,
        'weeks'      => [
            '1' => [['18:00', '20:00']],
        ],
        'status' => 'active',
    ], $admin);

    $classSubject = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    expect(ClassSession::where('class_subject_id', $classSubject->id)->count())->toBe(60);

    // Update with 2 days per week (Tuesday and Thursday)
    $updatedSchedule = $service->updateSchedule($schedule->id, [
        'teacher_id' => $teacher->id,
        'start_date' => '2026-09-01',
        'end_date'   => null,
        'weeks'      => [
            '2' => [['18:00', '20:00']],
            '4' => [['18:00', '20:00']],
        ],
        'status' => 'active',
    ], $admin);

    expect($updatedSchedule)->toBeInstanceOf(ClassSchedule::class);

    $newSessionsCount = ClassSession::where('class_subject_id', $classSubject->id)->count();
    expect($newSessionsCount)->toBe(60);
});

test('handles 2 slots on the same day and partial off-day properly', function () {
    $center = Center::create([
        'code'   => 'CTR000000005',
        'name'   => 'Trung Tâm Test Multi Slot',
        'email'  => 'center5@test.com',
        'phone'  => '0901234571',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_6',
        'full_name'  => 'Super Admin Test 6',
        'email'      => 'superadmin6@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000006',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000006',
        'username'     => 'teacher_test_6',
        'first_name'   => 'F',
        'last_name'    => 'Nguyễn Văn',
        'full_name'    => 'Nguyễn Văn F',
        'email'        => 'teacher6@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000010',
        'name'             => 'Khóa Học Cấp Tốc 2 Ca/Ngày',
        'total_sessions'   => 4,
        'duration_minutes' => 90,
        'tuition_fee'      => 4000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000006',
        'name'         => 'Lớp Cấp Tốc - Test',
        'max_students' => 25,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $service = app(ClassScheduleServiceInterface::class);

    // Bắt đầu ngày Thứ 2 (2026-09-07). Ngày này có 2 ca: 08:00-10:00 và 18:00-20:00.
    // Chỉ nghỉ ca sáng (08:00), ca chiều vẫn học.
    $schedule = $service->createSchedule([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'start_date' => '2026-09-07',
        'end_date'   => null,
        'weeks'      => [
            '1' => [['08:00', '10:00'], ['18:00', '20:00']],
        ],
        'off_days' => [
            ['date' => '2026-09-07', 'start_time' => '08:00', 'end_time' => '10:00'],
        ],
        'status' => 'active',
    ], $admin);

    $classSubject = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    $sessions     = ClassSession::where('class_subject_id', $classSubject->id)->orderBy('session_date')->orderBy('start_time')->get();

    expect($sessions)->toHaveCount(4);

    // Ngày 2026-09-07 chỉ có 1 ca chiều (18:00)
    $sessionsOn0907 = $sessions->filter(fn ($s) => $s->session_date->format('Y-m-d') === '2026-09-07');
    expect($sessionsOn0907)->toHaveCount(1)
        ->and($sessionsOn0907->first()->start_time)->toStartWith('18:00');
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
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher1->id,
        'start_date' => '2026-09-01',
        'end_date'   => null,
        'weeks'      => [
            '1' => [['18:00', '20:00']],
        ],
        'status' => 'active',
    ], $admin);

    $classSubject    = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    $firstSessionIds = ClassSession::where('class_subject_id', $classSubject->id)->pluck('id')->toArray();

    // Update teacher only
    $service->updateSchedule($schedule->id, [
        'teacher_id' => $teacher2->id,
        'start_date' => '2026-09-01',
        'weeks'      => [
            '1' => [['18:00', '20:00']],
        ],
        'status' => 'active',
    ], $admin);

    $afterSessionIds = ClassSession::where('class_subject_id', $classSubject->id)->pluck('id')->toArray();

    // The session IDs should remain unchanged because date/weeks didn't change
    expect($afterSessionIds)->toEqual($firstSessionIds);

    // The teacher on scheduled sessions should be updated
    $sampleSession = ClassSession::where('class_subject_id', $classSubject->id)->first();
    expect($sampleSession->teacher_id)->toBe($teacher2->id);
});

test('updates schedule: keeps past sessions, diff-syncs future sessions (keeps matching, deletes obsolete, creates missing)', function () {
    $center = Center::create([
        'code'   => 'CTR000000009',
        'name'   => 'Trung Tâm Test Diff Sync',
        'email'  => 'diffsync@test.com',
        'phone'  => '0901234599',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_diff_1',
        'full_name'  => 'Super Admin Diff',
        'email'      => 'diff1@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000009',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000009',
        'username'     => 'teacher_diff_1',
        'first_name'   => 'Diff',
        'last_name'    => 'Nguyễn',
        'full_name'    => 'Nguyễn Diff',
        'email'        => 'teacherdiff@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000099',
        'name'             => 'Môn Học 10 Buổi Diff Test',
        'total_sessions'   => 10,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000099',
        'name'         => 'Lớp Diff Test',
        'max_students' => 20,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $service = app(ClassScheduleServiceInterface::class);

    // 1. Tạo lịch ban đầu (bắt đầu trong quá khứ 2026-08-01, học T2 và T4)
    $schedule = $service->createSchedule([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'start_date' => '2026-08-01',
        'end_date'   => null,
        'weeks'      => [
            '1' => [['18:00', '20:00']], // Thứ 2
            '3' => [['18:00', '20:00']], // Thứ 4
        ],
        'status' => 'active',
    ], $admin);

    $classSubject = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    expect(ClassSession::where('class_subject_id', $classSubject->id)->count())->toBe(10);

    // Đánh dấu 3 buổi đầu tiên thành "completed" (quá khứ)
    $first3Sessions = ClassSession::where('class_subject_id', $classSubject->id)
        ->orderBy('session_date')
        ->orderBy('start_time')
        ->take(3)
        ->get();

    foreach ($first3Sessions as $s) {
        $s->update(['status' => 'completed']);
    }

    $pastIds = $first3Sessions->pluck('id')->toArray();

    // Giả sử có một ca tương lai vào Thứ 2 (ví dụ trùng lịch)
    $futureMonSession = ClassSession::where('class_subject_id', $classSubject->id)
        ->where('status', 'scheduled')
        ->whereRaw("strftime('%w', session_date) = '1'") // Thứ 2 (SQLite %w: 0=Sun, 1=Mon)
        ->first();

    $futureMonId = $futureMonSession?->id;

    // 2. Cập nhật lịch: Bây giờ học Thứ 2 (giữ lại các buổi T2 tương lai) và Thứ 6 (thay cho Thứ 4)
    $service->updateSchedule($schedule->id, [
        'teacher_id' => $teacher->id,
        'start_date' => '2026-08-01',
        'end_date'   => null,
        'weeks'      => [
            '1' => [['18:00', '20:00']], // Thứ 2 (vẫn giữ)
            '5' => [['18:00', '20:00']], // Thứ 6 (mới, thay cho Thứ 4)
        ],
        'status' => 'active',
    ], $admin);

    // 3. Kiểm tra kết quả:
    // A. Tổng số buổi toàn môn vẫn là 10 (3 buổi completed trong quá khứ + 7 buổi tương lai)
    $allSessions = ClassSession::where('class_subject_id', $classSubject->id)->get();
    expect($allSessions)->toHaveCount(10);

    // B. 3 buổi quá khứ (completed) vẫn giữ nguyên 100% ID
    $currentPastIds = ClassSession::where('class_subject_id', $classSubject->id)
        ->where('status', 'completed')
        ->pluck('id')
        ->toArray();
    expect($currentPastIds)->toEqual($pastIds);

    // C. Ca Thứ 2 tương lai nào trùng lịch được giữ nguyên ID
    if ($futureMonId) {
        $stillExists = ClassSession::where('id', $futureMonId)->exists();
        expect($stillExists)->toBeTrue();
    }

    // D. Không còn ca Thứ 4 nào trong tương lai (session_date >= today)
    $wedFutureCount = ClassSession::where('class_subject_id', $classSubject->id)
        ->where('session_date', '>=', now()->toDateString())
        ->where('status', 'scheduled')
        ->whereRaw("strftime('%w', session_date) = '3'") // Thứ 4
        ->count();
    expect($wedFutureCount)->toBe(0);

    // E. Có các ca Thứ 6 mới được tạo trong tương lai (session_date >= today)
    $friFutureCount = ClassSession::where('class_subject_id', $classSubject->id)
        ->where('session_date', '>=', now()->toDateString())
        ->where('status', 'scheduled')
        ->whereRaw("strftime('%w', session_date) = '5'") // Thứ 6
        ->count();
    expect($friFutureCount)->toBeGreaterThan(0);
});

test('generates exactly total_sessions when extra_days (makeup days) are added', function () {
    $center = Center::create([
        'code'   => 'CTR000000099',
        'name'   => 'Trung Tâm Test Extra Day',
        'email'  => 'center99@test.com',
        'phone'  => '0901234599',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_99',
        'full_name'  => 'Super Admin Test 99',
        'email'      => 'superadmin99@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000099',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000099',
        'username'     => 'teacher_test_99',
        'first_name'   => 'Extra',
        'last_name'    => 'Teacher',
        'full_name'    => 'Teacher Extra',
        'email'        => 'teacher99@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000099',
        'name'             => 'Môn Học 60 Buổi',
        'total_sessions'   => 60,
        'duration_minutes' => 90,
        'tuition_fee'      => 4000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000099',
        'name'         => 'Lớp Test Extra 60 Buổi',
        'max_students' => 25,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $service = app(ClassScheduleServiceInterface::class);

    $schedule = $service->createSchedule([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'start_date' => '2026-09-01',
        'end_date'   => null,
        'weeks'      => [
            '1' => [['18:00', '20:00']],
            '3' => [['18:00', '20:00']],
            '5' => [['18:00', '20:00']],
        ],
        'extra_days' => [
            ['date' => '2026-09-06', 'start_time' => '08:00', 'end_time' => '10:00'], // Chủ nhật học bù
        ],
        'status' => 'active',
    ], $admin);

    $classSubject = ClassSubject::where('class_id', $class->id)->where('subject_id', $subject->id)->first();
    $totalCount   = ClassSession::where('class_subject_id', $classSubject->id)->count();

    // Phải sinh đúng 60 buổi, không được thành 61 buổi
    expect($totalCount)->toBe(60);

    // Có chứa buổi học bù vào 2026-09-06
    $makeupSession = ClassSession::where('class_subject_id', $classSubject->id)
        ->where('session_date', '2026-09-06')
        ->first();
    expect($makeupSession)->not->toBeNull()
        ->and($makeupSession->topic)->toBe('Buổi học bổ sung / bù');
});

test('repositories correctly retrieve schedules and sessions with updated schema', function () {
    $center = Center::create([
        'code'   => 'CTR000000088',
        'name'   => 'Trung Tâm Test Repo',
        'email'  => 'center88@test.com',
        'phone'  => '0901234588',
        'status' => 'active',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000088',
        'username'     => 'teacher_test_88',
        'first_name'   => 'Repo',
        'last_name'    => 'Teacher',
        'full_name'    => 'Teacher Repo',
        'email'        => 'teacher88@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000088',
        'name'             => 'Môn Học Test Repo',
        'total_sessions'   => 10,
        'duration_minutes' => 90,
        'tuition_fee'      => 1000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000088',
        'name'         => 'Lớp Test Repo',
        'max_students' => 20,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $admin = Admin::create([
        'username'   => 'superadmin_test_88',
        'full_name'  => 'Super Admin Test 88',
        'email'      => 'superadmin88@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000088',
    ]);

    $service = app(ClassScheduleServiceInterface::class);

    $schedule = $service->createSchedule([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'start_date' => '2026-09-01',
        'weeks'      => [
            '2' => [['18:00', '19:30'], ['19:30', '21:00']],
            '4' => [['18:00', '19:30']],
        ],
        'status' => 'active',
    ], $admin);

    $firstSession = ClassSession::where('class_schedule_id', $schedule->id)->first();
    expect($firstSession)->not->toBeNull();

    // 1. Test ClassSessionRepository::findWithDetails
    $sessionRepo  = app(\App\Repositories\Session\ClassSessionRepositoryInterface::class);
    $foundSession = $sessionRepo->findWithDetails($firstSession->id);
    expect($foundSession)->not->toBeNull()
        ->and($foundSession->classSchedule)->not->toBeNull()
        ->and($foundSession->classSchedule->weeks)->toHaveKey('2');

    // 2. Test SchoolClassRepository::getClassWeeklySchedules
    $classRepo   = app(\App\Repositories\Class\SchoolClassRepositoryInterface::class);
    $classWeekly = $classRepo->getClassWeeklySchedules($class->id);
    expect($classWeekly)->toHaveCount(3); // 2 slots on Tuesday + 1 slot on Thursday
    expect($classWeekly->first()->weekday)->toBe(2);

    // 3. Test TeacherRepository::getTeacherWeeklySchedules
    $teacherRepo   = app(\App\Repositories\Teacher\TeacherRepositoryInterface::class);
    $teacherWeekly = $teacherRepo->getTeacherWeeklySchedules($teacher->id);
    expect($teacherWeekly)->toHaveCount(3);
    expect($teacherWeekly->first()->weekday)->toBe(2);
});
