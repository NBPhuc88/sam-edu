<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Exam;
use App\Services\Exam\ExamService;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

beforeEach(function () {
    $this->service = app(ExamService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test ExamService',
        'status' => 'active',
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_exam_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Exam',
        'password'   => Hash::make('password123'),
        'role'       => 'super_admin',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
});

test('createExam auto-generates exam code when code is empty', function () {
    $data = [
        'center_id'        => $this->center->id,
        'name'             => 'Kiem tra 1 tiet Toan 10',
        'duration_minutes' => 45,
        'max_score'        => 10.0,
        'pass_score'       => 5.0,
    ];

    $exam = $this->service->createExam($data, $this->superAdmin);

    expect($exam)->toBeInstanceOf(Exam::class)
        ->and($exam->code)->toBe('EX0000001')
        ->and($exam->name)->toBe('Kiem tra 1 tiet Toan 10')
        ->and((float) $exam->max_score)->toBe(10.0);
});

test('findExam throws NotFoundHttpException for non-existent exam', function () {
    expect(fn () => $this->service->findExam(999999, $this->superAdmin))
        ->toThrow(NotFoundHttpException::class);
});

test('updateExam updates exam name, duration and score details', function () {
    $exam = Exam::create([
        'center_id'        => $this->center->id,
        'code'             => 'EX' . random_int(1000000, 9999999),
        'name'             => 'De Thi Cu',
        'duration_minutes' => 30,
        'max_score'        => 10.0,
    ]);

    $updated = $this->service->updateExam($exam->id, [
        'name'             => 'De Thi Moi Cap Nhat',
        'duration_minutes' => 60,
    ], $this->superAdmin);

    expect($updated->name)->toBe('De Thi Moi Cap Nhat')
        ->and($updated->duration_minutes)->toBe(60);
});

test('deleteExam soft deletes exam successfully', function () {
    $exam = Exam::create([
        'center_id' => $this->center->id,
        'code'      => 'EX' . random_int(1000000, 9999999),
        'name'      => 'De Thi To Delete',
    ]);

    $result = $this->service->deleteExam($exam->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('exams', ['id' => $exam->id]);
});
