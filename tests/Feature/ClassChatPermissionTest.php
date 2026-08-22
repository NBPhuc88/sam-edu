<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('sub-admin cannot access chat of a class in a different center', function () {
    $centerA = Center::create([
        'code'   => 'CTR000000010',
        'name'   => 'Trung Tâm A',
        'status' => 'active',
    ]);

    $centerB = Center::create([
        'code'   => 'CTR000000020',
        'name'   => 'Trung Tâm B',
        'status' => 'active',
    ]);

    $adminA = Admin::create([
        'username'   => 'admin_center_a',
        'full_name'  => 'Admin Center A',
        'email'      => 'admin_a@test.com',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000010',
    ]);
    $adminA->centers()->attach($centerA->id);

    $classB = SchoolClass::create([
        'center_id' => $centerB->id,
        'code'      => 'CLS000000020',
        'name'      => 'Lớp Thuộc Trung Tâm B',
        'status'    => 1,
    ]);

    // Admin A tries to access Class B's chat URL
    $response = $this->actingAs($adminA, 'admin')->get(route('classes.chat.index', $classB->id));
    $response->assertForbidden();

    // Admin A tries to get messages of Class B
    $responseMessages = $this->actingAs($adminA, 'admin')->get(route('classes.chat.messages', $classB->id));
    $responseMessages->assertForbidden();

    // Admin A tries to send message in Class B
    $responseSend = $this->actingAs($adminA, 'admin')->post(route('classes.chat.send', $classB->id), [
        'message' => 'Test hack chat',
    ]);
    $responseSend->assertForbidden();

    // Admin A tries to access students list of Class B
    $responseStudents = $this->actingAs($adminA, 'admin')->get(route('classes.students.index', $classB->id));
    $responseStudents->assertNotFound();
});

test('sub-admin can access chat of a class in their assigned center', function () {
    $centerA = Center::create([
        'code'   => 'CTR000000011',
        'name'   => 'Trung Tâm A',
        'status' => 'active',
    ]);

    $adminA = Admin::create([
        'username'   => 'admin_center_a_ok',
        'full_name'  => 'Admin Center A OK',
        'email'      => 'admin_a_ok@test.com',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000011',
    ]);
    $adminA->centers()->attach($centerA->id);

    $classA = SchoolClass::create([
        'center_id' => $centerA->id,
        'code'      => 'CLS000000011',
        'name'      => 'Lớp Thuộc Trung Tâm A',
        'status'    => 1,
    ]);

    $response = $this->actingAs($adminA, 'admin')->get(route('classes.chat.index', $classA->id));
    $response->assertOk();
});

test('super admin can access chat of any center', function () {
    $centerB = Center::create([
        'code'   => 'CTR000000022',
        'name'   => 'Trung Tâm B',
        'status' => 'active',
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_chat',
        'full_name'  => 'Super Admin Chat',
        'email'      => 'super_chat@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000022',
    ]);

    $classB = SchoolClass::create([
        'center_id' => $centerB->id,
        'code'      => 'CLS000000022',
        'name'      => 'Lớp Thuộc Trung Tâm B',
        'status'    => 1,
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->get(route('classes.chat.index', $classB->id));
    $response->assertOk();
});
