<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('soft deleted student preserves tuition records and is displayed in tuition management', function () {
    $center = Center::create([
        'code'   => 'CTR000000001',
        'name'   => 'Trung Tâm Test',
        'email'  => 'centertest@test.com',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_tui_del',
        'full_name'  => 'Super Admin Test',
        'email'      => 'superadmin_tui@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000098',
    ]);

    $student = Student::create([
        'username'     => 'student_tui_test',
        'first_name'   => 'Học Sinh',
        'last_name'    => 'Nợ Học Phí',
        'full_name'    => 'Nợ Học Phí Học Sinh',
        'email'        => 'student_tui@test.com',
        'password'     => 'password123',
        'student_code' => 'HS000000010',
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS010',
        'name'      => 'Lớp 10A10',
        'status'    => 1,
    ]);

    $tuition = StudentTuition::create([
        'center_id'        => $center->id,
        'student_id'       => $student->id,
        'class_id'         => $class->id,
        'title'            => 'Học phí Tháng 9',
        'total_amount'     => 1500000,
        'paid_amount'      => 500000,
        'remaining_amount' => 1000000,
        'status'           => 'partial',
        'due_date'         => '2026-09-15',
    ]);

    // 1. Xóa học sinh
    $response = $this->actingAs($superAdmin, 'admin')
        ->delete(route('students.destroy', $student->id));

    $response->assertRedirect();
    expect(Student::find($student->id))->toBeNull();
    expect(Student::withTrashed()->find($student->id))->not->toBeNull();

    // 2. Học phí KHÔNG bị xóa
    $tuition->refresh();
    expect($tuition->exists)->toBeTrue();
    expect($tuition->student)->not->toBeNull();
    expect($tuition->student->full_name)->toBe('Nợ Học Phí Học Sinh');
    expect($tuition->student->deleted_at)->not->toBeNull();

    // 3. Quản lý học phí vẫn tải được học sinh đã xóa mềm
    $tuitionPage = $this->actingAs($superAdmin, 'admin')
        ->get(route('tuitions.index', ['search' => 'Nợ Học Phí']));

    $tuitionPage->assertOk();
});
