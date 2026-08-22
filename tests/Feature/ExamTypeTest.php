<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ExamType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('super admin can view exam types list', function () {
    $admin = Admin::create([
        'username'   => 'super_admin_type_test',
        'full_name'  => 'Super Admin',
        'email'      => 'admin_type_test@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000099',
    ]);

    $center = Center::create([
        'code'   => 'CTR000000099',
        'name'   => 'Trung Tâm Type Test',
        'email'  => 'center99@test.com',
        'phone'  => '0901234599',
        'status' => 'active',
    ]);

    ExamType::create([
        'center_id'   => $center->id,
        'code'        => 'TEST_TYPE_1',
        'name'        => 'Kiểm Tra Đầu Giờ',
        'description' => 'Mô tả bài kiểm tra',
        'status'      => 'active',
    ]);

    $response = $this->actingAs($admin, 'admin')->get(route('exam-types.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/ExamTypes/Index')
        ->has('examTypes.data', 1)
    );
});

test('super admin can create system-wide and center-specific exam types', function () {
    $admin = Admin::create([
        'username'   => 'super_admin_create_test',
        'full_name'  => 'Super Admin Create',
        'email'      => 'admin_create_test@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000098',
    ]);

    $center = Center::create([
        'code'   => 'CTR000000098',
        'name'   => 'Trung Tâm Create Test',
        'email'  => 'center98@test.com',
        'phone'  => '0901234598',
        'status' => 'active',
    ]);

    // Create system-wide exam type (center_id is null)
    $response = $this->actingAs($admin, 'admin')->post(route('exam-types.store'), [
        'center_id'   => null,
        'name'        => 'Loại Đề Thi Mẫu Toàn Hệ Thống',
        'code'        => 'SYS_EXAM_1',
        'description' => 'Mô tả loại đề',
        'status'      => 'active',
    ]);

    $response->assertRedirect(route('exam-types.index'));
    $this->assertDatabaseHas('exam_types', [
        'center_id' => null,
        'code'      => 'SYS_EXAM_1',
        'name'      => 'Loại Đề Thi Mẫu Toàn Hệ Thống',
    ]);

    // Create center-specific exam type
    $responseCenter = $this->actingAs($admin, 'admin')->post(route('exam-types.store'), [
        'center_id'   => $center->id,
        'name'        => 'Loại Đề Thi Riêng Của Trung Tâm',
        'code'        => 'CTR_EXAM_1',
        'description' => 'Mô tả loại đề trung tâm',
        'status'      => 'active',
    ]);

    $responseCenter->assertRedirect(route('exam-types.index'));
    $this->assertDatabaseHas('exam_types', [
        'center_id' => $center->id,
        'code'      => 'CTR_EXAM_1',
    ]);
});

test('sub-admin can only create exam types for their assigned center', function () {
    $center = Center::create([
        'code'   => 'CTR000000097',
        'name'   => 'Trung Tâm Sub Admin Test',
        'email'  => 'center97@test.com',
        'phone'  => '0901234597',
        'status' => 'active',
    ]);

    $admin = Admin::create([
        'username'   => 'sub_admin_type_test',
        'full_name'  => 'Sub Admin Type Test',
        'email'      => 'subadmin_type@test.com',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000097',
    ]);
    $admin->centers()->attach($center->id);

    $response = $this->actingAs($admin, 'admin')->post(route('exam-types.store'), [
        'name'        => 'Đề Thi Riêng Của Chi Nhánh',
        'description' => 'Mô tả',
        'status'      => 'active',
    ]);

    $response->assertRedirect(route('exam-types.index'));
    $this->assertDatabaseHas('exam_types', [
        'center_id' => $center->id,
        'name'      => 'Đề Thi Riêng Của Chi Nhánh',
    ]);
});

test('admin can update and delete exam type', function () {
    $admin = Admin::create([
        'username'   => 'super_admin_del_test',
        'full_name'  => 'Super Admin Del',
        'email'      => 'admin_del_test@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000096',
    ]);

    $examType = ExamType::create([
        'center_id' => null,
        'code'      => 'UPDATE_TEST',
        'name'      => 'Tên Ban Đầu',
        'status'    => 'active',
    ]);

    $response = $this->actingAs($admin, 'admin')->patch(route('exam-types.update', $examType->id), [
        'name'        => 'Tên Đã Cập Nhật',
        'description' => 'Mô tả mới',
        'status'      => 'inactive',
    ]);

    $response->assertRedirect(route('exam-types.index'));
    $examType->refresh();
    expect($examType->name)->toBe('Tên Đã Cập Nhật')
        ->and($examType->status)->toBe('inactive');

    // Delete
    $delResponse = $this->actingAs($admin, 'admin')->delete(route('exam-types.destroy', $examType->id));
    $delResponse->assertRedirect(route('exam-types.index'));
    $this->assertSoftDeleted('exam_types', ['id' => $examType->id]);
});
