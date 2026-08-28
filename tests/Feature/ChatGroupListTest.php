<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassChatMessage;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SubscriptionPlanSeeder::class);
    $this->seed(PermissionSeeder::class);
});

test('unauthenticated users are redirected to login when visiting chat groups page', function () {
    $response = $this->get(route('chats.index'));
    $response->assertRedirect(route('login'));
});

test('super admin can view chat groups of all centers and filter by center and class', function () {
    $centerA = Center::create([
        'code'              => 'CTR000000001',
        'name'              => 'Trung Tâm A',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addMonth(),
    ]);

    $centerB = Center::create([
        'code'              => 'CTR000000002',
        'name'              => 'Trung Tâm B',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addMonth(),
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_chats',
        'full_name'  => 'Super Admin Chats',
        'email'      => 'super_chats@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM000000001',
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $classA = SchoolClass::create([
        'center_id' => $centerA->id,
        'code'      => 'CLS000000001',
        'name'      => 'Lớp Toán 10 A',
        'status'    => 1,
    ]);

    $classB = SchoolClass::create([
        'center_id' => $centerB->id,
        'code'      => 'CLS000000002',
        'name'      => 'Lớp Văn 10 B',
        'status'    => 1,
    ]);

    ClassChatMessage::create([
        'class_id'    => $classA->id,
        'sender_type' => 'admin',
        'sender_id'   => $superAdmin->id,
        'sender_name' => 'Super Admin',
        'message'     => 'Chào mừng các bạn đến với lớp Toán',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->get(route('chats.index'));
    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Admin/Chat/Index')
        ->has('chatGroups.data', 2)
        ->where('isSuperAdmin', true)
    );

    // Filter by Center A
    $responseFilterCenter = $this->actingAs($superAdmin, 'admin')->get(route('chats.index', ['center_id' => $centerA->id]));
    $responseFilterCenter->assertOk();
    $responseFilterCenter->assertInertia(
        fn ($page) => $page
        ->has('chatGroups.data', 1)
        ->where('chatGroups.data.0.id', $classA->id)
    );

    // Filter by Class B
    $responseFilterClass = $this->actingAs($superAdmin, 'admin')->get(route('chats.index', ['class_id' => $classB->id]));
    $responseFilterClass->assertOk();
    $responseFilterClass->assertInertia(
        fn ($page) => $page
        ->has('chatGroups.data', 1)
        ->where('chatGroups.data.0.id', $classB->id)
    );
});

test('sub-admin only sees chat groups in their assigned center', function () {
    $centerA = Center::create([
        'code'              => 'CTR000000003',
        'name'              => 'Trung Tâm Alpha',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addMonth(),
    ]);

    $centerB = Center::create([
        'code'              => 'CTR000000004',
        'name'              => 'Trung Tâm Beta',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addMonth(),
    ]);

    $adminA = Admin::create([
        'username'   => 'subadmin_alpha',
        'full_name'  => 'Admin Alpha',
        'email'      => 'admin_alpha@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_ADMIN,
        'admin_code' => 'ADM000000003',
        'status'     => Constant::STATUS_ACTIVE,
    ]);
    $adminA->centers()->attach($centerA->id);

    $classA = SchoolClass::create([
        'center_id' => $centerA->id,
        'code'      => 'CLS000000003',
        'name'      => 'Lớp Anh 10 Alpha',
        'status'    => 1,
    ]);

    $classB = SchoolClass::create([
        'center_id' => $centerB->id,
        'code'      => 'CLS000000004',
        'name'      => 'Lớp Hóa 10 Beta',
        'status'    => 1,
    ]);

    $response = $this->actingAs($adminA, 'admin')->get(route('chats.index'));
    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Admin/Chat/Index')
        ->has('chatGroups.data', 1)
        ->where('chatGroups.data.0.id', $classA->id)
        ->where('isSuperAdmin', false)
    );
});

test('teacher only sees chat groups of classes they teach', function () {
    $center = Center::create([
        'code'              => 'CTR000000005',
        'name'              => 'Trung Tâm Delta',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addMonth(),
    ]);

    $teacher1 = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000001',
        'username'     => 'teacher_one',
        'first_name'   => 'Một',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên Một',
        'email'        => 'teacher_one@test.com',
        'password'     => 'password123',
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $teacher2 = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000002',
        'username'     => 'teacher_two',
        'first_name'   => 'Hai',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên Hai',
        'email'        => 'teacher_two@test.com',
        'password'     => 'password123',
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $subject = Subject::create([
        'center_id' => $center->id,
        'code'      => 'SUB000000001',
        'name'      => 'Môn Lý',
    ]);

    $class1 = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS000000005',
        'name'      => 'Lớp Lý T1',
        'status'    => 1,
    ]);
    $class1->classSubjects()->create([
        'subject_id' => $subject->id,
        'teacher_id' => $teacher1->id,
        'status'     => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    $class2 = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS000000006',
        'name'      => 'Lớp Lý T2',
        'status'    => 1,
    ]);
    $class2->classSubjects()->create([
        'subject_id' => $subject->id,
        'teacher_id' => $teacher2->id,
        'status'     => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    $response = $this->actingAs($teacher1, 'teacher')->get(route('chats.index'));
    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Admin/Chat/Index')
        ->has('chatGroups.data', 1)
        ->where('chatGroups.data.0.id', $class1->id)
    );
});

test('student only sees chat groups of classes they are enrolled in', function () {
    $center = Center::create([
        'code'              => 'CTR000000006',
        'name'              => 'Trung Tâm Omega',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addMonth(),
    ]);

    $student = Student::create([
        'center_id'    => $center->id,
        'student_code' => 'HS000000001',
        'username'     => 'student_one',
        'first_name'   => 'Một',
        'last_name'    => 'Học Sinh',
        'full_name'    => 'Học Sinh Một',
        'email'        => 'student_one@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $classEnrolled = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS000000007',
        'name'      => 'Lớp Học Sinh Tham Gia',
        'status'    => 1,
    ]);
    $classEnrolled->students()->attach($student->id, ['status' => Constant::CLASS_STUDENT_STATUS_ACTIVE, 'enrolled_at' => now()]);

    $classNotEnrolled = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS000000008',
        'name'      => 'Lớp Khác Không Tham Gia',
        'status'    => 1,
    ]);

    $response = $this->actingAs($student, 'student')->get(route('chats.index'));
    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Admin/Chat/Index')
        ->has('chatGroups.data', 1)
        ->where('chatGroups.data.0.id', $classEnrolled->id)
    );
});

test('center without chat plan feature is redirected to UpgradePlan page with 403', function () {
    $centerBasic = Center::create([
        'code'              => 'CTR000000007',
        'name'              => 'Trung Tâm Gói Cơ Bản',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'basic_5', // basic plan without 'chat' in allowed_features
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $adminBasic = Admin::create([
        'username'   => 'admin_basic_plan',
        'full_name'  => 'Admin Basic Plan',
        'email'      => 'admin_basic@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_ADMIN,
        'admin_code' => 'ADM000000007',
        'status'     => Constant::STATUS_ACTIVE,
    ]);
    $adminBasic->centers()->attach($centerBasic->id);

    $response = $this->actingAs($adminBasic, 'admin')->get(route('chats.index'));
    $response->assertForbidden();
    $response->assertInertia(
        fn ($page) => $page
        ->component('UpgradePlan')
        ->where('reason', 'feature_locked')
        ->where('feature', 'chat')
    );
});
