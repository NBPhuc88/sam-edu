<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Subject;
use App\Services\Subject\SubjectService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(SubjectService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test SubjectService',
        'status' => Constant::STATUS_ACTIVE,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_subj_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Subj',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
});

test('createSubject auto-generates subject code S0000001 when code is empty', function () {
    $data = [
        'name'             => 'Toan Lop 10',
        'center_id'        => $this->center->id,
        'total_sessions'   => 24,
        'duration_minutes' => 90,
        'tuition_fee'      => 1500000,
    ];

    $subject = $this->service->createSubject($data, $this->superAdmin);

    expect($subject)->toBeInstanceOf(Subject::class)
        ->and($subject->code)->toBe('S0000001')
        ->and($subject->name)->toBe('Toan Lop 10')
        ->and($subject->total_sessions)->toBe(24);
});

test('updateSubject updates subject fee and duration', function () {
    $subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'S' . random_int(1000000, 9999999),
        'name'      => 'Ly Lop 11',
    ]);

    $updated = $this->service->updateSubject($subject->id, [
        'name'        => 'Ly Lop 11 Nâng Cao',
        'tuition_fee' => 2000000,
    ], $this->superAdmin);

    expect($updated->name)->toBe('Ly Lop 11 Nâng Cao')
        ->and((float) $updated->tuition_fee)->toBe(2000000.0);
});

test('deleteSubject deletes subject successfully', function () {
    $subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'S' . random_int(1000000, 9999999),
        'name'      => 'Hoa Lop 12',
    ]);

    $result = $this->service->deleteSubject($subject->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('subjects', ['id' => $subject->id]);
});
