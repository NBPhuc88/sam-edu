<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ExamType;
use App\Services\ExamType\ExamTypeService;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

beforeEach(function () {
    $this->service = app(ExamTypeService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test ExamTypeService',
        'status' => 'active',
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_etype_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin ExamType',
        'password'   => Hash::make('password123'),
        'role'       => 'super_admin',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
});

test('createExamType creates new exam type successfully', function () {
    $data = [
        'name'      => 'Thi Giua Ky',
        'center_id' => $this->center->id,
    ];

    $examType = $this->service->createExamType($data, $this->superAdmin);

    expect($examType)->toBeInstanceOf(ExamType::class)
        ->and($examType->name)->toBe('Thi Giua Ky')
        ->and($examType->status)->toBe('active');
});

test('findExamType throws NotFoundHttpException for non-existent exam type', function () {
    expect(fn () => $this->service->findExamType(999999, $this->superAdmin))
        ->toThrow(NotFoundHttpException::class);
});

test('updateExamType updates exam type name and status', function () {
    $examType = ExamType::create([
        'center_id' => $this->center->id,
        'code'      => 'ET' . random_int(1000000, 9999999),
        'name'      => 'Thi Cuoi Ky Old',
        'status'    => 'active',
    ]);

    $updated = $this->service->updateExamType($examType->id, [
        'name'   => 'Thi Cuoi Ky New',
        'status' => 'inactive',
    ], $this->superAdmin);

    expect($updated->name)->toBe('Thi Cuoi Ky New')
        ->and($updated->status)->toBe('inactive');
});

test('deleteExamType soft deletes exam type', function () {
    $examType = ExamType::create([
        'center_id' => $this->center->id,
        'code'      => 'ET' . random_int(1000000, 9999999),
        'name'      => 'ExamType To Delete',
    ]);

    $result = $this->service->deleteExamType($examType->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('exam_types', ['id' => $examType->id]);
});
