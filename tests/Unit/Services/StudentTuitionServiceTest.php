<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use App\Services\Tuition\StudentTuitionService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(StudentTuitionService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test TuitionService',
        'status' => 'active',
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_tuition_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Tuition',
        'password'   => Hash::make('password123'),
        'role'       => 'super_admin',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Tuition Test',
        'status'    => 1,
    ]);
    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_tuition',
        'first_name'   => 'Student',
        'last_name'    => 'Tuition',
        'full_name'    => 'Student Tuition Test',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);
});

test('createTuition creates tuition record with initial payment', function () {
    $data = [
        'center_id'              => $this->center->id,
        'student_id'             => $this->student->id,
        'class_id'               => $this->schoolClass->id,
        'title'                  => 'Hoc phi Thang 9',
        'total_amount'           => 3000000,
        'initial_payment_amount' => 1000000,
        'initial_payment_method' => 'cash',
    ];

    $tuition = $this->service->createTuition($data, $this->superAdmin);

    expect($tuition)->toBeInstanceOf(StudentTuition::class)
        ->and((float) $tuition->total_amount)->toBe(3000000.0)
        ->and((float) $tuition->paid_amount)->toBe(1000000.0)
        ->and((float) $tuition->remaining_amount)->toBe(2000000.0)
        ->and($tuition->status)->toBe('partial');
});

test('recordPayment adds installment payment and marks status completed when fully paid', function () {
    $tuition = StudentTuition::create([
        'center_id'        => $this->center->id,
        'student_id'       => $this->student->id,
        'class_id'         => $this->schoolClass->id,
        'title'            => 'Hoc phi Dot 2',
        'total_amount'     => 2000000,
        'paid_amount'      => 0,
        'remaining_amount' => 2000000,
        'status'           => 'pending',
    ]);

    $payment = $this->service->recordPayment($tuition->id, [
        'amount'         => 2000000,
        'payment_method' => 'bank_transfer',
    ], $this->superAdmin);

    $freshTuition = $tuition->fresh();

    expect((float) $freshTuition->paid_amount)->toBe(2000000.0)
        ->and((float) $freshTuition->remaining_amount)->toBe(0.0)
        ->and($freshTuition->status)->toBe('completed');
});

test('deleteTuition soft deletes tuition record', function () {
    $tuition = StudentTuition::create([
        'center_id'        => $this->center->id,
        'student_id'       => $this->student->id,
        'class_id'         => $this->schoolClass->id,
        'title'            => 'Hoc phi To Delete',
        'total_amount'     => 1000000,
        'paid_amount'      => 0,
        'remaining_amount' => 1000000,
        'status'           => 'pending',
    ]);

    $result = $this->service->deleteTuition($tuition->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('student_tuitions', ['id' => $tuition->id]);
});
