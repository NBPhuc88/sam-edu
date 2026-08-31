<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Class\SchoolClassServiceInterface;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

beforeEach(function () {
    $this->center = Center::create([
        'code'         => 'CTR' . random_int(1000000, 9999999),
        'name'         => 'Test Center Class Constraints',
        'status'       => Constant::STATUS_ACTIVE,
        'max_classes'  => 2,
        'max_students' => 10,
    ]);

    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_cls_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $this->branchAdmin = Admin::create([
        'username'   => 'branch_admin_cls_' . random_int(1000, 9999),
        'full_name'  => 'Branch Admin',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->branchAdmin->centers()->attach($this->center->id);

    $this->classService = app(SchoolClassServiceInterface::class);
});

test('cannot add students to an inactive, completed, or closed class', function () {
    $inactiveClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Inactive Class',
        'status'    => Constant::CLASS_STATUS_INACTIVE,
    ]);

    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_test_' . random_int(1000, 9999),
        'first_name'   => 'Test',
        'last_name'    => 'Student',
        'full_name'    => 'Test Student',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    expect(fn () => $this->classService->addStudentsToClass($inactiveClass->id, [$student->id], $this->branchAdmin))
        ->toThrow(AccessDeniedHttpException::class);
});

test('only active students can be added to an active class', function () {
    $activeClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Active Class',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);

    $graduatedStudent = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'grad_std_' . random_int(1000, 9999),
        'first_name'   => 'Grad',
        'last_name'    => 'Student',
        'full_name'    => 'Grad Student',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_GRADUATED,
    ]);

    $addedCount = $this->classService->addStudentsToClass($activeClass->id, [$graduatedStudent->id], $this->branchAdmin);
    expect($addedCount)->toBe(0);
    expect($activeClass->students()->count())->toBe(0);
});

test('regular admin cannot change status of completed or closed class but super admin can', function () {
    $completedClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Completed Class',
        'status'    => Constant::CLASS_STATUS_COMPLETED,
    ]);

    // Regular admin tries to re-open -> Denied
    expect(fn () => $this->classService->updateClass($completedClass->id, [
        'status' => Constant::CLASS_STATUS_ACTIVE,
    ], $this->branchAdmin))->toThrow(AccessDeniedHttpException::class);

    // Super Admin re-opens -> Allowed
    $updated = $this->classService->updateClass($completedClass->id, [
        'status' => Constant::CLASS_STATUS_ACTIVE,
    ], $this->superAdmin);

    expect((int) $updated->status)->toBe(Constant::CLASS_STATUS_ACTIVE);
});
