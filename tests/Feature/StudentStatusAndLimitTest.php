<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Services\Student\StudentServiceInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

beforeEach(function () {
    $this->center = Center::create([
        'code'         => 'CTR' . random_int(1000000, 9999999),
        'name'         => 'Test Center Student Constraints',
        'status'       => Constant::STATUS_ACTIVE,
        'max_students' => 2,
    ]);

    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_std_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $this->branchAdmin = Admin::create([
        'username'   => 'branch_admin_std_' . random_int(1000, 9999),
        'full_name'  => 'Branch Admin',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->branchAdmin->centers()->attach($this->center->id);

    $this->studentService = app(StudentServiceInterface::class);
});

test('cannot create new student when active + inactive students reach center max_students limit', function () {
    // 1 Active student
    Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_active_' . random_int(1000, 9999),
        'first_name'   => 'Active',
        'last_name'    => 'Student',
        'full_name'    => 'Active Student',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    // 1 Inactive (paused) student => Total active + inactive = 2 (reaches max_students = 2)
    Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_inactive_' . random_int(1000, 9999),
        'first_name'   => 'Inactive',
        'last_name'    => 'Student',
        'full_name'    => 'Inactive Student',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_INACTIVE,
    ]);

    // Attempt to create a 3rd student
    $data = [
        'center_id' => $this->center->id,
        'full_name' => 'Third Student',
        'status'    => Constant::STUDENT_STATUS_ACTIVE,
    ];

    expect(fn () => $this->studentService->createStudent($data, $this->branchAdmin))
        ->toThrow(ValidationException::class);
});

test('regular admin cannot change status of graduated student but super admin can', function () {
    $graduated = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'grad_std_' . random_int(1000, 9999),
        'first_name'   => 'Graduated',
        'last_name'    => 'Student',
        'full_name'    => 'Graduated Student',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_GRADUATED,
    ]);

    // Regular admin tries to change to active -> Denied
    expect(fn () => $this->studentService->updateStudent($graduated->id, [
        'status' => Constant::STUDENT_STATUS_ACTIVE,
    ], $this->branchAdmin))->toThrow(AccessDeniedHttpException::class);

    // Regular admin tries to change to inactive -> Denied
    expect(fn () => $this->studentService->updateStudent($graduated->id, [
        'status' => Constant::STUDENT_STATUS_INACTIVE,
    ], $this->branchAdmin))->toThrow(AccessDeniedHttpException::class);

    // Super Admin changes to active -> Allowed
    $updated = $this->studentService->updateStudent($graduated->id, [
        'status' => Constant::STUDENT_STATUS_ACTIVE,
    ], $this->superAdmin);

    expect((int) $updated->status)->toBe(Constant::STUDENT_STATUS_ACTIVE);
});

test('regular admin can freely change status between active and inactive or graduate an active student', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'regular_std_' . random_int(1000, 9999),
        'first_name'   => 'Regular',
        'last_name'    => 'Student',
        'full_name'    => 'Regular Student',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    // Change from active (1) to inactive (2)
    $updated1 = $this->studentService->updateStudent($student->id, [
        'status' => Constant::STUDENT_STATUS_INACTIVE,
    ], $this->branchAdmin);
    expect((int) $updated1->status)->toBe(Constant::STUDENT_STATUS_INACTIVE);

    // Change from inactive (2) back to active (1)
    $updated2 = $this->studentService->updateStudent($student->id, [
        'status' => Constant::STUDENT_STATUS_ACTIVE,
    ], $this->branchAdmin);
    expect((int) $updated2->status)->toBe(Constant::STUDENT_STATUS_ACTIVE);

    // Graduate an active student (1 -> 3)
    $updated3 = $this->studentService->updateStudent($student->id, [
        'status' => Constant::STUDENT_STATUS_GRADUATED,
    ], $this->branchAdmin);
    expect((int) $updated3->status)->toBe(Constant::STUDENT_STATUS_GRADUATED);
});

test('inactive or graduated student cannot login while active student can login', function () {
    $authService = app(\App\Services\Auth\AuthServiceInterface::class);

    $activeStudent = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_auth_active_' . random_int(1000, 9999),
        'first_name'   => 'Auth',
        'last_name'    => 'Active',
        'full_name'    => 'Auth Active',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $inactiveStudent = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_auth_inact_' . random_int(1000, 9999),
        'first_name'   => 'Auth',
        'last_name'    => 'Inactive',
        'full_name'    => 'Auth Inactive',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_INACTIVE,
    ]);

    $graduatedStudent = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_auth_grad_' . random_int(1000, 9999),
        'first_name'   => 'Auth',
        'last_name'    => 'Graduated',
        'full_name'    => 'Auth Graduated',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_GRADUATED,
    ]);

    // Active student login succeeds
    $resActive = $authService->authenticate('student', $activeStudent->username, 'password123');
    expect($resActive['success'])->toBeTrue();

    // Inactive student login fails
    $resInactive = $authService->authenticate('student', $inactiveStudent->username, 'password123');
    expect($resInactive['success'])->toBeFalse();
    expect($resInactive['error'])->toContain('nghỉ học');

    // Graduated student login fails
    $resGrad = $authService->authenticate('student', $graduatedStudent->username, 'password123');
    expect($resGrad['success'])->toBeFalse();
    expect($resGrad['error'])->toContain('tốt nghiệp');
});
