<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Services\ClassExam\ClassExamService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    $this->service = app(ClassExamService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test ClassExamService',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_cexam_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin ClassExam',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop ClassExam Test',
        'status'    => 1,
    ]);
    $this->exam = Exam::create([
        'center_id' => $this->center->id,
        'code'      => 'EX' . random_int(1000000, 9999999),
        'name'      => 'De Thi ClassExam Test',
        'max_score' => 10.0,
    ]);
});

test('createClassExam auto-generates exam code and access code', function () {
    $data = [
        'class_id'  => $this->schoolClass->id,
        'exam_id'   => $this->exam->id,
        'title'     => 'Kiem Tra Thu Lop 10',
        'exam_date' => now()->addDays(2)->toDateString(),
    ];

    $classExam = $this->service->createClassExam($data, $this->superAdmin);

    expect($classExam)->toBeInstanceOf(ClassExam::class)
        ->and($classExam->title)->toBe('Kiem Tra Thu Lop 10')
        ->and($classExam->access_code)->toHaveLength(6);
});

test('autoUpdateClassExamStatuses updates expired class exams to completed', function () {
    $result = $this->service->autoUpdateClassExamStatuses();

    expect($result)->toHaveKeys(['ongoing', 'completed']);
});

test('deleteClassExam deletes class exam record', function () {
    $classExam = ClassExam::create([
        'code'        => 'CE' . random_int(1000000, 9999999),
        'access_code' => '123456',
        'class_id'    => $this->schoolClass->id,
        'exam_id'     => $this->exam->id,
        'title'       => 'ClassExam To Delete',
        'exam_date'   => now()->toDateString(),
    ]);

    $result = $this->service->deleteClassExam($classExam->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('class_exams', ['id' => $classExam->id]);
});
