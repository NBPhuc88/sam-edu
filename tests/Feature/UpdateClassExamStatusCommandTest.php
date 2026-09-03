<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->center = Center::create([
        'name'       => 'Trung Tâm Test Exam Status',
        'code'       => 'CTR_EXAM_STATUS_01',
        'status'     => Constant::CENTER_STATUS_ACTIVE,
        'expires_at' => now()->addYear(),
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_exam_cmd',
        'first_name'   => 'A',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên A',
        'email'        => 'teacher_exam_cmd@example.com',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'T_EX_CMD_001',
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $this->subject = Subject::create([
        'center_id'        => $this->center->id,
        'name'             => 'Toán 10',
        'code'             => 'MATH_EX_CMD',
        'total_sessions'   => 10,
        'duration_minutes' => 90,
        'tuition_fee'      => 1000000,
        'status'           => Constant::SUBJECT_STATUS_ACTIVE,
    ]);

    $this->class = SchoolClass::create([
        'center_id'    => $this->center->id,
        'name'         => 'Lớp Toán 10A',
        'code'         => 'CLS_MATH_10A',
        'max_capacity' => 30,
        'start_date'   => now()->subMonths(1)->toDateString(),
        'end_date'     => now()->addMonths(2)->toDateString(),
        'status'       => Constant::CLASS_STATUS_ACTIVE,
    ]);

    $this->exam = Exam::create([
        'center_id'             => $this->center->id,
        'subject_id'            => $this->subject->id,
        'name'                  => 'Đề Thi Giữa Kỳ Toán',
        'code'                  => 'EX_MATH_MID',
        'duration_minutes'      => 45,
        'max_score'             => 10,
        'pass_score'            => 5,
        'status'                => Constant::EXAM_STATUS_PUBLISHED,
        'created_by_teacher_id' => $this->teacher->id,
    ]);
});

test('command class-exams:update-status updates scheduled exams to ongoing when within 5 mins of start and completed when past end', function () {
    // Giả lập thời gian hiện tại là 09:00:00 ngày 2026-08-25
    Carbon::setTestNow(Carbon::parse('2026-08-25 09:00:00'));

    // 1. Kỳ thi bắt đầu lúc 09:04:00 (trong vòng 5 phút tới: 09:00 + 5p >= 09:04) -> chuyển sang ongoing
    $examStartingSoon = ClassExam::create([
        'class_id'         => $this->class->id,
        'exam_id'          => $this->exam->id,
        'title'            => 'Kỳ thi sắp diễn ra',
        'exam_date'        => '2026-08-25',
        'start_time'       => '09:04:00',
        'end_time'         => '10:00:00',
        'valid_from'       => '2026-08-25 09:04:00',
        'valid_to'         => '2026-08-25 10:00:00',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => Constant::CLASS_EXAM_STATUS_SCHEDULED,
    ]);

    // 2. Kỳ thi bắt đầu lúc 08:30:00 và kết thúc lúc 09:30:00 (đang trong giờ thi) -> chuyển sang ongoing
    $examCurrentlyRunning = ClassExam::create([
        'class_id'         => $this->class->id,
        'exam_id'          => $this->exam->id,
        'title'            => 'Kỳ thi đang trong giờ',
        'exam_date'        => '2026-08-25',
        'start_time'       => '08:30:00',
        'end_time'         => '09:30:00',
        'valid_from'       => '2026-08-25 08:30:00',
        'valid_to'         => '2026-08-25 09:30:00',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => Constant::CLASS_EXAM_STATUS_SCHEDULED,
    ]);

    // 3. Kỳ thi bắt đầu lúc 14:00:00 (còn xa hơn 5 phút) -> giữ nguyên scheduled
    $examFarFuture = ClassExam::create([
        'class_id'         => $this->class->id,
        'exam_id'          => $this->exam->id,
        'title'            => 'Kỳ thi chiều nay',
        'exam_date'        => '2026-08-25',
        'start_time'       => '14:00:00',
        'end_time'         => '15:00:00',
        'valid_from'       => '2026-08-25 14:00:00',
        'valid_to'         => '2026-08-25 15:00:00',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => Constant::CLASS_EXAM_STATUS_SCHEDULED,
    ]);

    // 4. Kỳ thi đã kết thúc lúc 08:45:00 (valid_to < now 09:00:00) -> chuyển sang completed
    $examPast = ClassExam::create([
        'class_id'         => $this->class->id,
        'exam_id'          => $this->exam->id,
        'title'            => 'Kỳ thi đã qua giờ',
        'exam_date'        => '2026-08-25',
        'start_time'       => '08:00:00',
        'end_time'         => '08:45:00',
        'valid_from'       => '2026-08-25 08:00:00',
        'valid_to'         => '2026-08-25 08:45:00',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => Constant::CLASS_EXAM_STATUS_ONGOING,
    ]);

    // Chạy artisan command
    $this->artisan('class-exams:update-status')->assertSuccessful();

    // Kiểm tra trạng thái sau cập nhật
    expect($examStartingSoon->fresh()->status)->toBe(Constant::CLASS_EXAM_STATUS_ONGOING);
    expect($examCurrentlyRunning->fresh()->status)->toBe(Constant::CLASS_EXAM_STATUS_ONGOING);
    expect($examFarFuture->fresh()->status)->toBe(Constant::CLASS_EXAM_STATUS_SCHEDULED);
    expect($examPast->fresh()->status)->toBe(Constant::CLASS_EXAM_STATUS_COMPLETED);

    Carbon::setTestNow(); // Reset time mock
});
