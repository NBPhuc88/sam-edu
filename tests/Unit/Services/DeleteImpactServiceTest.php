<?php

use App\Models\Center;
use App\Models\SchoolClass;
use App\Services\Impact\DeleteImpactService;

beforeEach(function () {
    $this->service = app(DeleteImpactService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test DeleteImpactService',
        'status' => 'active',
    ]);
});

test('getImpact returns 404 error when entity does not exist', function () {
    $result = $this->service->getImpact('classes', 999999);

    expect($result['status'])->toBe(404)
        ->and($result['error'])->toBe('Lớp học không tồn tại');
});

test('getImpact returns impact list before deleting class', function () {
    $schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Impact Test',
        'status'    => 1,
    ]);

    $result = $this->service->getImpact('classes', $schoolClass->id);

    expect($result['success'])->toBeTrue()
        ->and($result['title'])->toContain('Lớp học: Lop Impact Test');
});
