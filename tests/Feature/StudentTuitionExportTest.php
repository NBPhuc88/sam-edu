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
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->center = Center::create([
        'code'         => 'CTR000000999',
        'name'         => 'Trung Tâm Export Test',
        'phone'        => '0901234599',
        'email'        => 'export_test@gmail.com',
        'address'      => '456 Export Street, TP.HCM',
        'plan_type'    => Constant::PLAN_TYPE_STANDARD,
        'max_classes'  => 10,
        'max_students' => 50,
        'status'       => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $this->superAdmin = Admin::create([
        'admin_code' => 'ADM000000099',
        'username'   => 'super_admin_export',
        'full_name'  => 'Super Admin Export',
        'email'      => 'super_export@gmail.com',
        'phone'      => '0901111999',
        'password'   => bcrypt('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::ADMIN_STATUS_ACTIVE,
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV000000099',
        'first_name'   => 'Hải',
        'last_name'    => 'Lê',
        'username'     => 'teacher_export',
        'full_name'    => 'Lê Hải',
        'email'        => 'gv_export@gmail.com',
        'phone'        => '0903333999',
        'password'     => bcrypt('password123'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $this->subject = Subject::create([
        'center_id'   => $this->center->id,
        'code'        => 'MH000000099',
        'name'        => 'Môn Lý Export',
        'tuition_fee' => 3000000,
        'status'      => Constant::SUBJECT_STATUS_ACTIVE,
    ]);

    $this->room = Room::create([
        'center_id' => $this->center->id,
        'code'      => 'R000000099',
        'name'      => 'Phòng 201',
        'capacity'  => 30,
        'status'    => Constant::ROOM_STATUS_ACTIVE,
    ]);

    $this->schoolClass = SchoolClass::create([
        'center_id'    => $this->center->id,
        'teacher_id'   => $this->teacher->id,
        'subject_id'   => $this->subject->id,
        'room_id'      => $this->room->id,
        'code'         => 'LPH000000099',
        'name'         => 'Lớp Vật Lý K9',
        'max_capacity' => 30,
        'start_date'   => '2026-08-01',
        'status'       => Constant::CLASS_STATUS_ACTIVE,
    ]);

    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000099',
        'first_name'   => 'Export',
        'last_name'    => 'Nguyễn Văn',
        'full_name'    => 'Nguyễn Văn Export',
        'username'     => 'student_export',
        'email'        => 'student_export@gmail.com',
        'phone'        => '0988888999',
        'password'     => bcrypt('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $this->admin2 = Admin::create([
        'admin_code' => 'ADM000000098',
        'username'   => 'sub_admin_export_2',
        'full_name'  => 'Admin Thu Tiền Đợt 2',
        'email'      => 'admin2_export@gmail.com',
        'phone'      => '0902222999',
        'password'   => bcrypt('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::ADMIN_STATUS_ACTIVE,
    ]);

    $this->schoolClass2 = SchoolClass::create([
        'center_id'    => $this->center->id,
        'teacher_id'   => $this->teacher->id,
        'subject_id'   => $this->subject->id,
        'room_id'      => $this->room->id,
        'code'         => 'LPH000000098',
        'name'         => 'Lớp Hóa Học K9',
        'max_capacity' => 30,
        'start_date'   => '2026-08-01',
        'status'       => Constant::CLASS_STATUS_ACTIVE,
    ]);

    // Gán học sinh vào 2 lớp
    $this->student->classes()->attach([
        $this->schoolClass->id  => ['status' => Constant::CLASS_STUDENT_STATUS_ACTIVE, 'enrolled_at' => now()],
        $this->schoolClass2->id => ['status' => Constant::CLASS_STUDENT_STATUS_ACTIVE, 'enrolled_at' => now()],
    ]);

    $this->tuition = StudentTuition::create([
        'center_id'        => $this->center->id,
        'student_id'       => $this->student->id,
        'class_id'         => $this->schoolClass->id,
        'title'            => 'Học phí Vật Lý K9 tháng 8',
        'total_amount'     => 3000000,
        'paid_amount'      => 3000000,
        'remaining_amount' => 0,
        'status'           => Constant::TUITION_STATUS_PAID,
        'due_date'         => '2026-08-31',
        'created_by'       => $this->superAdmin->id,
    ]);

    // Ghi nhận 2 đợt thu bởi 2 Admin khác nhau
    TuitionPayment::create([
        'student_tuition_id' => $this->tuition->id,
        'amount'             => 1000000,
        'payment_date'       => '2026-08-10',
        'payment_method'     => Constant::PAYMENT_METHOD_CASH,
        'transaction_code'   => 'TXN001',
        'received_by'        => $this->superAdmin->id,
    ]);

    TuitionPayment::create([
        'student_tuition_id' => $this->tuition->id,
        'amount'             => 2000000,
        'payment_date'       => '2026-08-20',
        'payment_method'     => Constant::PAYMENT_METHOD_BANK_TRANSFER,
        'transaction_code'   => 'TXN002',
        'received_by'        => $this->admin2->id,
    ]);
});

test('SuperAdmin can view tuitions page with chartStats prop', function () {
    $this->actingAs($this->superAdmin, 'admin')
        ->get(route('tuitions.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Tuitions/Index')
            ->has('chartStats')
            ->has('chartStats.status_pie')
            ->has('chartStats.monthly_trend')
        );
});

test('SuperAdmin can download tuitions export xls file with multi-row payments and multi-classes', function () {
    $response = $this->actingAs($this->superAdmin, 'admin')
        ->get(route('tuitions.export', [
            'center_id' => $this->center->id,
            'status'    => Constant::TUITION_STATUS_PAID,
        ]));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/vnd.ms-excel; charset=UTF-8');
    expect($response->headers->get('Content-Disposition'))->toContain('danh_sach_hoc_phi_');
    expect($response->headers->get('Content-Disposition'))->toContain('.xls');

    $content = $response->streamedContent();
    expect($content)->toContain('Nguyễn Văn Export');
    expect($content)->toContain('HS000000099');
    expect($content)->toContain('Đã hoàn thành');

    // Kiểm tra danh sách nhiều lớp học nối bằng dấu phẩy
    expect($content)->toContain('Lớp Vật Lý K9, Lớp Hóa Học K9');

    // Kiểm tra thông tin các đợt thu và từng Admin thu tiền
    expect($content)->toContain('Đợt 1');
    expect($content)->toContain('Super Admin Export'); // Admin thu đợt 1
    expect($content)->toContain('Đợt 2');
    expect($content)->toContain('Admin Thu Tiền Đợt 2'); // Admin thu đợt 2
});
