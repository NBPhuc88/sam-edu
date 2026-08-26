<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\OnlineExam\OnlineExamService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(OnlineExamService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test OnlineExam',
        'status' => 'active',
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_online_exam_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin OnlineExam',
        'password'   => Hash::make('password123'),
        'role'       => 'super_admin',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Online Exam',
        'status'    => 1,
    ]);
    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_online_exam',
        'first_name'   => 'Student',
        'last_name'    => 'Online',
        'full_name'    => 'Student Online Exam',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $this->schoolClass->students()->attach($this->student->id, [
        'enrolled_at' => now(),
        'status'      => 'active',
    ]);

    $this->exam = Exam::create([
        'center_id' => $this->center->id,
        'code'      => 'EX' . random_int(1000000, 9999999),
        'name'      => 'De Thi Trac Nghiem Online',
        'max_score' => 10.0,
    ]);
    $this->section = ExamSection::create([
        'exam_id'     => $this->exam->id,
        'title'       => 'Phan 1',
        'order_index' => 1,
    ]);
    $this->q1 = ExamQuestion::create([
        'exam_id'        => $this->exam->id,
        'section_id'     => $this->section->id,
        'title'          => 'Cau 1',
        'content'        => 'Content 1',
        'question_type'  => 'single_choice',
        'score'          => 10.0,
        'correct_answer' => 'A',
    ]);

    $this->classExam = ClassExam::create([
        'code'        => 'CE' . random_int(1000000, 9999999),
        'access_code' => '654321',
        'class_id'    => $this->schoolClass->id,
        'exam_id'     => $this->exam->id,
        'title'       => 'Ky Thi Online Lop 10',
        'exam_date'   => now()->toDateString(),
    ]);
});

test('startExamAttempt creates in_progress submission for student', function () {
    $submission = $this->service->startExamAttempt($this->classExam->id, $this->student);

    expect($submission->status)->toBe('in_progress')
        ->and($submission->student_id)->toBe($this->student->id)
        ->and($submission->class_exam_id)->toBe($this->classExam->id);
});

test('autoSaveProgress saves draft answers to cache', function () {
    $submission = $this->service->startExamAttempt($this->classExam->id, $this->student);

    $answers = [$this->q1->id => 'A'];
    $saved   = $this->service->autoSaveProgress($submission->id, $answers, $this->student);

    expect($saved)->toBeTrue();
    expect(Cache::get("exam_draft:submission:{$submission->id}"))->toBe($answers);
});

test('submitExamAttempt grades exam and sets status to submitted', function () {
    $submission = $this->service->startExamAttempt($this->classExam->id, $this->student);

    $answers   = [$this->q1->id => 'A'];
    $submitted = $this->service->submitExamAttempt($submission->id, $answers, $this->student);

    expect($submitted->status)->toBe('submitted')
        ->and((float) $submitted->score)->toBe(10.0)
        ->and($submitted->total_correct)->toBe(1);
});
