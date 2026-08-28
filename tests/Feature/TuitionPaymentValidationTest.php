<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TuitionPayment;
use Illuminate\Support\Facades\Auth;

beforeEach(function () {
    $this->center = Center::create([
        'code'              => 'CTR000000888',
        'name'              => 'Trung Tâm Học Phí Test',
        'phone'             => '0901234568',
        'email'             => 'tuition_test@gmail.com',
        'address'           => '123 Test Street, TP.HCM',
        'subscription_plan' => 2,
        'plan_type'         => 2,
        'max_classes'       => 10,
        'max_students'      => 50,
        'status'            => Constant::STATUS_ACTIVE,
    ]);

    $this->superAdmin = Admin::create([
        'admin_code' => 'ADM000000088',
        'username'   => 'super_admin_tuition',
        'full_name'  => 'Super Admin Tuition',
        'email'      => 'super_tuition@gmail.com',
        'phone'      => '0901111223',
        'password'   => bcrypt('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV000000088',
        'first_name'   => 'Tuấn',
        'last_name'    => 'Trần',
        'username'     => 'teacher_tuition',
        'full_name'    => 'Trần Tuấn',
        'email'        => 'gv_tuition@gmail.com',
        'phone'        => '0903333445',
        'password'     => bcrypt('password123'),
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $this->subject = Subject::create([
        'center_id'   => $this->center->id,
        'code'        => 'MH000000088',
        'name'        => 'Môn Toán Học Phí',
        'tuition_fee' => 5000000,
        'status'      => Constant::STATUS_ACTIVE,
    ]);

    $this->room = Room::create([
        'center_id' => $this->center->id,
        'code'      => 'R000000088',
        'name'      => 'Phòng Test 101',
        'capacity'  => 30,
    ]);

    $this->schoolClass = SchoolClass::create([
        'center_id'    => $this->center->id,
        'subject_id'   => $this->subject->id,
        'teacher_id'   => $this->teacher->id,
        'room_id'      => $this->room->id,
        'name'         => 'Lớp Toán Cơ Bản',
        'code'         => 'CLS000000088',
        'max_capacity' => 20,
        'status'       => 1,
    ]);

    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'STD000000088',
        'first_name'   => 'Sinh',
        'last_name'    => 'Nguyễn Văn Học',
        'username'     => 'student_tuition',
        'full_name'    => 'Nguyễn Văn Học Sinh',
        'email'        => 'std_tuition@gmail.com',
        'phone'        => '0904444556',
        'password'     => bcrypt('password123'),
        'status'       => 1,
    ]);

    Auth::guard('admin')->setUser($this->superAdmin);
});

test('không cho phép tạo hồ sơ học phí có tiền đợt 1 lớn hơn tổng số tiền học phí', function () {
    $response = $this->actingAs($this->superAdmin, 'admin')->post('/tuitions', [
        'center_id'              => $this->center->id,
        'class_id'               => $this->schoolClass->id,
        'student_id'             => $this->student->id,
        'title'                  => 'Học phí kỳ 1',
        'total_amount'           => 5000000,
        'initial_payment_amount' => 6000000, // Lớn hơn 5.000.000đ
        'initial_payment_date'   => now()->format('Y-m-d'),
        'initial_payment_method' => 'cash',
    ]);

    $response->assertSessionHasErrors('initial_payment_amount');
    expect(StudentTuition::count())->toBe(0);
});

test('cho phép tạo hồ sơ học phí có tiền đợt 1 bằng hoặc nhỏ hơn tổng số tiền học phí', function () {
    $response = $this->actingAs($this->superAdmin, 'admin')->post('/tuitions', [
        'center_id'              => $this->center->id,
        'class_id'               => $this->schoolClass->id,
        'student_id'             => $this->student->id,
        'title'                  => 'Học phí kỳ 1',
        'total_amount'           => 5000000,
        'initial_payment_amount' => 3000000,
        'initial_payment_date'   => now()->format('Y-m-d'),
        'initial_payment_method' => 'bank_transfer',
    ]);

    $response->assertSessionHasNoErrors();
    $tuition = StudentTuition::first();
    expect($tuition)->not->toBeNull()
        ->and((float) $tuition->total_amount)->toBe(5000000.0)
        ->and((float) $tuition->paid_amount)->toBe(3000000.0)
        ->and((float) $tuition->remaining_amount)->toBe(2000000.0)
        ->and($tuition->status)->toBe(Constant::TUITION_STATUS_PARTIAL);
});

test('không cho phép thu đợt mới vượt quá số tiền cần đóng còn lại', function () {
    $tuition = StudentTuition::create([
        'center_id'        => $this->center->id,
        'student_id'       => $this->student->id,
        'class_id'         => $this->schoolClass->id,
        'title'            => 'Học phí kỳ 1',
        'total_amount'     => 5000000,
        'paid_amount'      => 3000000,
        'remaining_amount' => 2000000,
        'status'           => Constant::TUITION_STATUS_PARTIAL,
    ]);

    TuitionPayment::create([
        'student_tuition_id' => $tuition->id,
        'amount'             => 3000000,
        'payment_date'       => now()->format('Y-m-d'),
        'payment_method'     => Constant::PAYMENT_METHOD_BANK_TRANSFER,
    ]);

    // Thử thu 2.500.000đ khi remaining_amount chỉ còn 2.000.000đ
    $response = $this->actingAs($this->superAdmin, 'admin')->post("/tuitions/{$tuition->id}/payments", [
        'amount'         => 2500000,
        'payment_date'   => now()->format('Y-m-d'),
        'payment_method' => 'cash',
    ]);

    $response->assertSessionHasErrors('amount');
    $tuition->refresh();
    expect((float) $tuition->paid_amount)->toBe(3000000.0);
});

test('cho phép thu đợt mới bằng chính xác số tiền còn nợ và chuyển trạng thái completed', function () {
    $tuition = StudentTuition::create([
        'center_id'        => $this->center->id,
        'student_id'       => $this->student->id,
        'class_id'         => $this->schoolClass->id,
        'title'            => 'Học phí kỳ 1',
        'total_amount'     => 5000000,
        'paid_amount'      => 3000000,
        'remaining_amount' => 2000000,
        'status'           => Constant::TUITION_STATUS_PARTIAL,
    ]);

    TuitionPayment::create([
        'student_tuition_id' => $tuition->id,
        'amount'             => 3000000,
        'payment_date'       => now()->format('Y-m-d'),
        'payment_method'     => Constant::PAYMENT_METHOD_BANK_TRANSFER,
    ]);

    // Thu nốt 2.000.000đ
    $response = $this->actingAs($this->superAdmin, 'admin')->post("/tuitions/{$tuition->id}/payments", [
        'amount'         => 2000000,
        'payment_date'   => now()->format('Y-m-d'),
        'payment_method' => 'cash',
    ]);

    $response->assertSessionHasNoErrors();
    $tuition->refresh();
    expect((float) $tuition->paid_amount)->toBe(5000000.0)
        ->and((float) $tuition->remaining_amount)->toBe(0.0)
        ->and($tuition->status)->toBe(Constant::TUITION_STATUS_PAID);
});

test('không cho phép sửa đợt thu khiến tổng tiền thu vượt quá tổng học phí', function () {
    $tuition = StudentTuition::create([
        'center_id'        => $this->center->id,
        'student_id'       => $this->student->id,
        'class_id'         => $this->schoolClass->id,
        'title'            => 'Học phí kỳ 1',
        'total_amount'     => 5000000,
        'paid_amount'      => 4000000,
        'remaining_amount' => 1000000,
        'status'           => Constant::TUITION_STATUS_PARTIAL,
    ]);

    $payment1 = TuitionPayment::create([
        'student_tuition_id' => $tuition->id,
        'amount'             => 2000000,
        'payment_date'       => now()->format('Y-m-d'),
        'payment_method'     => Constant::PAYMENT_METHOD_CASH,
    ]);

    $payment2 = TuitionPayment::create([
        'student_tuition_id' => $tuition->id,
        'amount'             => 2000000,
        'payment_date'       => now()->format('Y-m-d'),
        'payment_method'     => Constant::PAYMENT_METHOD_CASH,
    ]);

    // Sửa payment2 từ 2.000.000đ lên 3.500.000đ (tổng sẽ thành 2.000.000 + 3.500.000 = 5.500.000 > 5.000.000)
    $response = $this->actingAs($this->superAdmin, 'admin')->patch("/tuitions/payments/{$payment2->id}", [
        'amount'         => 3500000,
        'payment_date'   => now()->format('Y-m-d'),
        'payment_method' => 'cash',
    ]);

    $response->assertSessionHasErrors('amount');
    $payment2->refresh();
    expect((float) $payment2->amount)->toBe(2000000.0);
});

test('không cho phép cập nhật tổng học phí nhỏ hơn số tiền đã đóng', function () {
    $tuition = StudentTuition::create([
        'center_id'        => $this->center->id,
        'student_id'       => $this->student->id,
        'class_id'         => $this->schoolClass->id,
        'title'            => 'Học phí kỳ 1',
        'total_amount'     => 5000000,
        'paid_amount'      => 3000000,
        'remaining_amount' => 2000000,
        'status'           => Constant::TUITION_STATUS_PARTIAL,
    ]);

    TuitionPayment::create([
        'student_tuition_id' => $tuition->id,
        'amount'             => 3000000,
        'payment_date'       => now()->format('Y-m-d'),
        'payment_method'     => Constant::PAYMENT_METHOD_BANK_TRANSFER,
    ]);

    // Sửa tổng học phí xuống 2.000.000đ (nhỏ hơn 3.000.000đ đã đóng)
    $response = $this->actingAs($this->superAdmin, 'admin')->patch("/tuitions/{$tuition->id}", [
        'center_id'    => $this->center->id,
        'class_id'     => $this->schoolClass->id,
        'student_id'   => $this->student->id,
        'total_amount' => 2000000,
    ]);

    $response->assertSessionHasErrors('total_amount');
    $tuition->refresh();
    expect((float) $tuition->total_amount)->toBe(5000000.0);
});
