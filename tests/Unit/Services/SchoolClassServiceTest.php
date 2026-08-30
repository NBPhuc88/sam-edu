<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Class\SchoolClassService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->service = app(SchoolClassService::class);
    $this->center  = Center::create([
        'code'        => 'CTR' . random_int(1000000, 9999999),
        'name'        => 'Center Test SchoolClassService',
        'status'      => Constant::STATUS_ACTIVE,
        'max_classes' => 5,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_cls_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Cls',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
});

test('createClass auto-generates class code C0000001 when code is empty', function () {
    $data = [
        'name'         => 'Lop 10A1',
        'center_id'    => $this->center->id,
        'max_students' => 30,
        'status'       => 1,
    ];

    $schoolClass = $this->service->createClass($data, $this->superAdmin);

    expect($schoolClass)->toBeInstanceOf(SchoolClass::class)
        ->and($schoolClass->code)->toBe('C0000001')
        ->and($schoolClass->name)->toBe('Lop 10A1');

    $statusVal = is_object($schoolClass->status) ? $schoolClass->status->value : (int) $schoolClass->status;
    expect((int) $statusVal)->toBe(1);
});

test('createClass throws exception when max_classes limit is reached', function () {
    $limitedCenter = Center::create([
        'code'        => 'CTR' . random_int(1000000, 9999999),
        'name'        => 'Limited Center Class',
        'status'      => Constant::STATUS_ACTIVE,
        'max_classes' => 1,
    ]);

    SchoolClass::create([
        'center_id' => $limitedCenter->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Existing',
        'status'    => 1,
    ]);

    $data = [
        'name'      => 'Lop 10A2',
        'center_id' => $limitedCenter->id,
        'status'    => 1,
    ];

    expect(fn () => $this->service->createClass($data, $this->superAdmin))
        ->toThrow(ValidationException::class, 'đã đạt tối đa');
});

test('updateClass cascades status changes to isolated students in the class', function () {
    $schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Cascade Status',
        'status'    => 1,
    ]);

    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_cascade',
        'first_name'   => 'Std',
        'last_name'    => 'Cascade',
        'full_name'    => 'Std Cascade',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $schoolClass->students()->attach($student->id, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_ACTIVE]);

    // Pause class -> should set isolated student to inactive
    $this->service->updateClass($schoolClass->id, ['status' => Constant::CLASS_STATUS_INACTIVE], $this->superAdmin);

    $studentStatusVal = is_object($student->fresh()->status) ? $student->fresh()->status->value : (int) $student->fresh()->status;
    expect((int) $studentStatusVal)->toBe(Constant::STUDENT_STATUS_INACTIVE);
});

test('addStudentsToClass attaches valid center students', function () {
    $schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Add Students',
        'status'    => 1,
    ]);
    $student1 = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_add_1',
        'first_name'   => 'Std',
        'last_name'    => 'Add 1',
        'full_name'    => 'Std Add 1',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);
    $student2 = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_add_2',
        'first_name'   => 'Std',
        'last_name'    => 'Add 2',
        'full_name'    => 'Std Add 2',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $attachedCount = $this->service->addStudentsToClass($schoolClass->id, [$student1->id, $student2->id], $this->superAdmin);

    expect($attachedCount)->toBe(2);
    expect($schoolClass->students()->count())->toBe(2);
});

test('deleteClass soft deletes school class successfully', function () {
    $schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop To Delete',
        'status'    => 1,
    ]);

    $result = $this->service->deleteClass($schoolClass->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('classes', ['id' => $schoolClass->id]);
});
