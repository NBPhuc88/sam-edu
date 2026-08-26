<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
    Artisan::call('db:seed', ['--class' => 'PermissionSeeder']);
});

test('basic plan center can access exams, class exams, and grading', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-BASIC-EXAM',
        'name'              => 'Trung tâm Test Basic Exam',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-B01',
        'username'   => 'admin_test_basic_exam',
        'email'      => 'admin.basic.exam@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Basic Exam',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    // Truy cập kho đề thi -> Cho phép (200 OK)
    $examsResponse = $this->actingAs($admin, 'admin')->get(route('exams.index'));
    $examsResponse->assertOk();

    // Truy cập kỳ thi lớp học -> Cho phép (200 OK)
    $classExamsResponse = $this->actingAs($admin, 'admin')->get(route('class-exams.index'));
    $classExamsResponse->assertOk();

    // Truy cập chấm bài thi -> Cho phép (200 OK)
    $gradingResponse = $this->actingAs($admin, 'admin')->get(route('grading.index'));
    $gradingResponse->assertOk();
});

test('basic plan center is blocked from online exam, practice exam, and csv export for all user types', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-BASIC-BLOCK',
        'name'              => 'Trung tâm Test Basic Block',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-B02',
        'username'   => 'admin_test_basic_block',
        'email'      => 'admin.basic.block@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Basic Block',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV-TEST-B01',
        'username'     => 'teacher_test_basic',
        'email'        => 'teacher.basic@test.com',
        'password'     => Hash::make('password'),
        'first_name'   => 'Giáo viên',
        'last_name'    => 'Test',
        'full_name'    => 'Giáo viên Test Basic',
        'status'       => 'active',
    ]);

    $student = Student::create([
        'center_id'    => $center->id,
        'student_code' => 'HS-TEST-B01',
        'username'     => 'student_test_basic',
        'email'        => 'student.basic@test.com',
        'password'     => Hash::make('password'),
        'first_name'   => 'Học sinh',
        'last_name'    => 'Test',
        'full_name'    => 'Học sinh Test Basic',
        'status'       => 1,
    ]);

    // Admin: Bị chặn phòng thi trực tuyến & thi thử & xuất CSV
    $this->actingAs($admin, 'admin')->get(route('online-exam.enter'))->assertStatus(403);
    $this->actingAs($admin, 'admin')->get(route('practice-exams.index'))->assertStatus(403);
    $this->actingAs($admin, 'admin')->get(route('teachers.export'))->assertStatus(403);

    // Giáo viên: Bị chặn phòng thi trực tuyến & thi thử
    $this->actingAs($teacher, 'teacher')->get(route('online-exam.enter'))->assertStatus(403);
    $this->actingAs($teacher, 'teacher')->get(route('practice-exams.index'))->assertStatus(403);

    // Học sinh: Bị chặn phòng thi trực tuyến & thi thử
    $this->actingAs($student, 'student')->get(route('online-exam.enter'))->assertStatus(403);
    $this->actingAs($student, 'student')->get(route('practice-exams.index'))->assertStatus(403);
});

test('advanced plan center can access exams, online exam, and practice exams', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-ADV',
        'name'              => 'Trung tâm Test Advanced',
        'status'            => 'active',
        'subscription_plan' => 'advanced_20',
        'plan_type'         => 'advanced',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-02',
        'username'   => 'admin_test_adv',
        'email'      => 'admin.adv@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Adv',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    $this->actingAs($admin, 'admin')->get(route('exams.index'))->assertOk();
    $this->actingAs($admin, 'admin')->get(route('online-exam.enter'))->assertOk();
    $this->actingAs($admin, 'admin')->get(route('practice-exams.index'))->assertOk();
    $this->actingAs($admin, 'admin')->get(route('teachers.export'))->assertOk();
});

test('trial center has access to full features', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-TRIAL',
        'name'              => 'Trung tâm Test Trial',
        'status'            => 'active',
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addDays(20),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-03',
        'username'   => 'admin_test_trial',
        'email'      => 'admin.trial@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Trial',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    $response = $this->actingAs($admin, 'admin')->get(route('exams.index'));
    $response->assertOk();
});

test('expired center is completely blocked', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-EXP',
        'name'              => 'Trung tâm Test Expired',
        'status'            => 'active',
        'subscription_plan' => 'advanced_20',
        'plan_type'         => 'advanced',
        'expires_at'        => Carbon::now()->subDay(),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-04',
        'username'   => 'admin_test_exp',
        'email'      => 'admin.exp@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Exp',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    $response = $this->actingAs($admin, 'admin')->get(route('teachers.index'));
    $response->assertStatus(403);
});

test('holiday management is restricted to super admin only', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-HOLIDAY',
        'name'              => 'Trung tâm Test Holiday',
        'status'            => 'active',
        'subscription_plan' => 'advanced_20',
        'plan_type'         => 'advanced',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $subAdmin = Admin::create([
        'admin_code' => 'ADM-TEST-SUB',
        'username'   => 'admin_test_sub',
        'email'      => 'admin.sub@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Phụ',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $subAdmin->centers()->sync([$center->id]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-HOLIDAY',
        'username'   => 'super_admin_holiday',
        'email'      => 'super.holiday@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Holiday',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    // Admin phụ không có quyền truy cập Ngày lễ (bị chặn bởi AutoCheckPermission ẩn trang với mã 404)
    $responseSub = $this->actingAs($subAdmin, 'admin')->get(route('holidays.index'));
    $responseSub->assertStatus(404);

    // Super Admin truy cập Ngày lễ bình thường
    $responseSuper = $this->actingAs($superAdmin, 'admin')->get(route('holidays.index'));
    $responseSuper->assertOk();
});
