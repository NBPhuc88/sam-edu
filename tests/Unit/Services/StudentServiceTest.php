<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassStudent;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Student\StudentService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    Mail::fake();
    $this->service = app(StudentService::class);
    $this->center  = Center::create([
        'code'         => 'CTR' . random_int(1000000, 9999999),
        'name'         => 'Center Test StudentService',
        'status'       => Constant::STATUS_ACTIVE,
        'max_students' => 100,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_std_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Std',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
});

test('createStudent auto-generates student code when code is empty', function () {
    $data = [
        'full_name' => 'Nguyen Van An',
        'center_id' => $this->center->id,
        'email'     => 'an.nguyen@example.com',
        'username'  => 'an_nguyen',
        'password'  => 'password123',
    ];

    $student = $this->service->createStudent($data, $this->superAdmin);

    expect($student)->toBeInstanceOf(Student::class)
        ->and($student->student_code)->toBe('HS0000001')
        ->and($student->full_name)->toBe('Nguyen Van An');
});

test('createStudent throws exception when max_students limit reached for active students', function () {
    $limitedCenter = Center::create([
        'code'         => 'CTR' . random_int(1000000, 9999999),
        'name'         => 'Limited Center Student',
        'status'       => Constant::STATUS_ACTIVE,
        'max_students' => 1,
    ]);

    Student::create([
        'center_id'    => $limitedCenter->id,
        'username'     => 'active_std_1',
        'first_name'   => 'Std',
        'last_name'    => 'Active 1',
        'full_name'    => 'Active Std 1',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $data = [
        'full_name' => 'Tran Van B',
        'center_id' => $limitedCenter->id,
        'status'    => 1,
    ];

    expect(fn () => $this->service->createStudent($data, $this->superAdmin))
        ->toThrow(ValidationException::class, 'Số học sinh đang theo học và tạm nghỉ');
});

test('updateStudent updates student information and changes status successfully', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'old_std_name',
        'first_name'   => 'Old',
        'last_name'    => 'Name',
        'full_name'    => 'Old Name',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $updated = $this->service->updateStudent($student->id, [
        'full_name'   => 'New Name',
        'status'      => Constant::STUDENT_STATUS_INACTIVE,
        'parent_name' => 'Nguyen Van Parent',
    ], $this->superAdmin);

    expect($updated->full_name)->toBe('New Name')
        ->and($updated->parent_name)->toBe('Nguyen Van Parent');
});

test('updateStudent denies regular admin from changing graduated student status', function () {
    $admin = Admin::create([
        'username'   => 'branch_admin_' . random_int(1000, 9999),
        'full_name'  => 'Branch Admin',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $admin->centers()->attach($this->center->id);

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

    expect(fn () => $this->service->updateStudent($graduatedStudent->id, [
        'status' => Constant::STUDENT_STATUS_ACTIVE,
    ], $admin))->toThrow(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);

    // Super Admin can change it
    $updated = $this->service->updateStudent($graduatedStudent->id, [
        'status' => Constant::STUDENT_STATUS_ACTIVE,
    ], $this->superAdmin);

    expect($updated->status->value ?? (int) $updated->status)->toBe(Constant::STUDENT_STATUS_ACTIVE);
});

test('bulkAssignStudentsToClass assigns valid active students to specified class', function () {
    $class = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Assign Test',
        'status'    => 1,
    ]);
    $student1 = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'assign_std_1',
        'first_name'   => 'Assign',
        'last_name'    => 'Std 1',
        'full_name'    => 'Assign Std 1',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);
    $student2 = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'assign_std_2',
        'first_name'   => 'Assign',
        'last_name'    => 'Std 2',
        'full_name'    => 'Assign Std 2',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $result = $this->service->bulkAssignStudentsToClass($class->id, [$student1->id, $student2->id], $this->superAdmin);

    expect($result['success_count'])->toBe(2);
    expect($class->students()->count())->toBe(2);
});

test('removeStudentFromClass detaches student from class', function () {
    $class = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Detach Test',
        'status'    => 1,
    ]);
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'detach_std',
        'first_name'   => 'Detach',
        'last_name'    => 'Std',
        'full_name'    => 'Detach Std',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);
    $class->students()->attach($student->id, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_ACTIVE]);

    expect($class->students()->count())->toBe(1);

    $this->service->removeStudentFromClass($student->id, $class->id, $this->superAdmin);

    expect($class->students()->count())->toBe(0);
});

test('deleteStudent updates active class_student status to left and sets left_at', function () {
    $class1 = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Test 1',
        'status'    => 1,
    ]);

    $class2 = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Test 2',
        'status'    => 1,
    ]);

    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'delete_std_test',
        'first_name'   => 'Delete',
        'last_name'    => 'Student',
        'full_name'    => 'Delete Student',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    // Attach active to class1
    $class1->students()->attach($student->id, [
        'enrolled_at' => now()->subMonths(2),
        'status'      => Constant::CLASS_STUDENT_STATUS_ACTIVE,
    ]);

    // Attach already completed to class2
    $class2->students()->attach($student->id, [
        'enrolled_at' => now()->subMonths(6),
        'left_at'     => now()->subMonths(1),
        'status'      => Constant::CLASS_STUDENT_STATUS_COMPLETED,
    ]);

    $result = $this->service->deleteStudent($student->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('students', ['id' => $student->id]);

    // Verify class1 enrollment status changed to LEFT (4) and left_at is set
    $cs1 = ClassStudent::where('class_id', $class1->id)->where('student_id', $student->id)->first();
    expect($cs1)->not->toBeNull();
    expect((int) $cs1->status)->toBe(Constant::CLASS_STUDENT_STATUS_LEFT);
    expect($cs1->left_at)->not->toBeNull();

    // Verify class2 enrollment status remains COMPLETED (2)
    $cs2 = ClassStudent::where('class_id', $class2->id)->where('student_id', $student->id)->first();
    expect($cs2)->not->toBeNull();
    expect((int) $cs2->status)->toBe(Constant::CLASS_STUDENT_STATUS_COMPLETED);
});
