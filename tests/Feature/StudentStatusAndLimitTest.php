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

test('regular admin can freely change status between active, paused, dropped or complete an active student', function () {
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

    // Change from active (1) to paused (2)
    $updated1 = $this->studentService->updateStudent($student->id, [
        'status' => Constant::STUDENT_STATUS_PAUSED,
    ], $this->branchAdmin);
    expect((int) $updated1->status)->toBe(Constant::STUDENT_STATUS_PAUSED);

    // Change from paused (2) to dropped (4)
    $updated2 = $this->studentService->updateStudent($student->id, [
        'status' => Constant::STUDENT_STATUS_DROPPED,
    ], $this->branchAdmin);
    expect((int) $updated2->status)->toBe(Constant::STUDENT_STATUS_DROPPED);

    // Change from dropped (4) back to active (1)
    $updated3 = $this->studentService->updateStudent($student->id, [
        'status' => Constant::STUDENT_STATUS_ACTIVE,
    ], $this->branchAdmin);
    expect((int) $updated3->status)->toBe(Constant::STUDENT_STATUS_ACTIVE);

    // Complete an active student (1 -> 3)
    $updated4 = $this->studentService->updateStudent($student->id, [
        'status' => Constant::STUDENT_STATUS_COMPLETED,
    ], $this->branchAdmin);
    expect((int) $updated4->status)->toBe(Constant::STUDENT_STATUS_COMPLETED);
});

test('paused, dropped or completed student cannot login while active student can login', function () {
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

    $pausedStudent = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_auth_paused_' . random_int(1000, 9999),
        'first_name'   => 'Auth',
        'last_name'    => 'Paused',
        'full_name'    => 'Auth Paused',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_PAUSED,
    ]);

    $completedStudent = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_auth_comp_' . random_int(1000, 9999),
        'first_name'   => 'Auth',
        'last_name'    => 'Completed',
        'full_name'    => 'Auth Completed',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_COMPLETED,
    ]);

    $droppedStudent = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_auth_drop_' . random_int(1000, 9999),
        'first_name'   => 'Auth',
        'last_name'    => 'Dropped',
        'full_name'    => 'Auth Dropped',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_DROPPED,
    ]);

    // Active student login succeeds
    $resActive = $authService->authenticate('student', $activeStudent->username, 'password123');
    expect($resActive['success'])->toBeTrue();

    // Paused student login fails
    $resPaused = $authService->authenticate('student', $pausedStudent->username, 'password123');
    expect($resPaused['success'])->toBeFalse();
    expect($resPaused['error'])->toContain('tạm dừng');

    // Completed student login fails
    $resComp = $authService->authenticate('student', $completedStudent->username, 'password123');
    expect($resComp['success'])->toBeFalse();
    expect($resComp['error'])->toContain('hoàn thành');

    // Dropped student login fails
    $resDrop = $authService->authenticate('student', $droppedStudent->username, 'password123');
    expect($resDrop['success'])->toBeFalse();
    expect($resDrop['error'])->toContain('nghỉ học');
});
