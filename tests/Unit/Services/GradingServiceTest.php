<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Grading\GradingService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(GradingService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test GradingService',
        'status' => Constant::STATUS_ACTIVE,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_grading_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Grading',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Grading Test',
        'status'    => 1,
    ]);
    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_grading',
        'first_name'   => 'Student',
        'last_name'    => 'Grading',
        'full_name'    => 'Student Grading Test',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);
});

test('createOfflineExamWithScores creates offline exam, class exam and student submission scores', function () {
    $subject = \App\Models\Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'S' . random_int(1000000, 9999999),
        'name'      => 'Toan 10 Offline',
    ]);

    $data = [
        'class_id'   => $this->schoolClass->id,
        'subject_id' => $subject->id,
        'title'      => 'Bai Kiem Tra Giay 15 Phut',
        'exam_date'  => now()->toDateString(),
        'max_score'  => 10.0,
        'scores'     => [
            [
                'student_id' => $this->student->id,
                'score'      => 9.0,
                'comment'    => 'Lam bai rat tot',
            ],
        ],
    ];

    $classExam = $this->service->createOfflineExamWithScores($data, null, $this->superAdmin);

    expect($classExam)->toBeInstanceOf(ClassExam::class)
        ->and($classExam->title)->toBe('Bai Kiem Tra Giay 15 Phut');

    $this->assertDatabaseHas('class_exam_submissions', [
        'class_exam_id' => $classExam->id,
        'student_id'    => $this->student->id,
        'score'         => 9.0,
    ]);
});
