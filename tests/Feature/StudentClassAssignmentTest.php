<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
    Artisan::call('db:seed', ['--class' => 'PermissionSeeder']);

    $this->center = Center::create([
        'code'              => 'CTR000000001',
        'name'              => 'Trung Tâm Test Alpha',
        'status'            => 'active',
        'subscription_plan' => 'advanced',
        'plan_type'         => 'advanced',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $this->admin = Admin::create([
        'admin_code' => 'ADM000000001',
        'username'   => 'admin_test',
        'email'      => 'admin@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $this->admin->centers()->attach($this->center->id);

    $this->teacher = Teacher::create([
        'teacher_code' => 'T000000001',
        'username'     => 'teacher_test',
        'email'        => 'teacher@test.com',
        'password'     => Hash::make('password'),
        'first_name'   => 'Test',
        'last_name'    => 'Giáo Viên',
        'full_name'    => 'Giáo Viên Test',
        'center_id'    => $this->center->id,
        'status'       => 'active',
    ]);

    $this->subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'SUB000000001',
        'name'      => 'Toán Lớp 10 Nâng Cao',
        'status'    => 'active',
    ]);

    $this->class1 = SchoolClass::create([
        'center_id'    => $this->center->id,
        'teacher_id'   => $this->teacher->id,
        'subject_id'   => $this->subject->id,
        'code'         => 'C000000001',
        'name'         => 'Lớp Toán 10A1',
        'max_capacity' => 30,
        'status'       => 1,
    ]);

    $this->class2 = SchoolClass::create([
        'center_id'    => $this->center->id,
        'teacher_id'   => $this->teacher->id,
        'subject_id'   => $this->subject->id,
        'code'         => 'C000000002',
        'name'         => 'Lớp Toán 10A2',
        'max_capacity' => 30,
        'status'       => 1,
    ]);
});

test('admin can create student with initial class enrollment', function () {
    $response = $this->actingAs($this->admin, 'admin')->post(route('students.store'), [
        'center_id'      => $this->center->id,
        'full_name'      => 'Nguyễn Văn Học Sinh',
        'username'       => 'hocsinh01',
        'password'       => '12345678',
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => 'active',
        'class_ids'      => [$this->class1->id, $this->class2->id],
    ]);

    $response->assertRedirect(route('students.index'));

    $student = Student::where('username', 'hocsinh01')->first();
    expect($student)->not->toBeNull();
    expect($student->classes)->toHaveCount(2);
    expect($student->classes->pluck('id')->all())->toContain($this->class1->id, $this->class2->id);
});

test('admin can update student classes', function () {
    $student = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000001',
        'first_name'     => 'An',
        'last_name'      => 'Lê Văn',
        'full_name'      => 'Lê Văn An',
        'username'       => 'levanan',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => 1,
    ]);
    $student->classes()->attach($this->class1->id, ['enrolled_at' => now(), 'status' => 'active']);

    $response = $this->actingAs($this->admin, 'admin')->patch(route('students.update', $student->id), [
        'center_id'      => $this->center->id,
        'student_code'   => $student->student_code,
        'full_name'      => 'Lê Văn An Đã Đổi Tên',
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => 'active',
        'class_ids'      => [$this->class2->id],
    ]);

    $response->assertRedirect(route('students.index'));

    $student->refresh();
    expect($student->classes)->toHaveCount(1);
    expect($student->classes->first()->id)->toBe($this->class2->id);
});

test('admin can assign multiple classes to a single student via assignClasses endpoint', function () {
    $student = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000002',
        'first_name'     => 'Bình',
        'last_name'      => 'Trần Thị',
        'full_name'      => 'Trần Thị Bình',
        'username'       => 'tranthibinh',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => 1,
    ]);

    $response = $this->actingAs($this->admin, 'admin')->post(
        route('students.assign-classes', $student->id),
        [
            'class_ids' => [$this->class1->id, $this->class2->id],
        ]
    );

    $response->assertSessionHas('success');

    $student->refresh();
    expect($student->classes)->toHaveCount(2);
});

test('admin can bulk assign multiple students to a class', function () {
    $student1 = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000003',
        'first_name'     => '1',
        'last_name'      => 'Học Sinh Bulk',
        'full_name'      => 'Học Sinh Bulk 1',
        'username'       => 'hsbulk1',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => 1,
    ]);

    $student2 = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000004',
        'first_name'     => '2',
        'last_name'      => 'Học Sinh Bulk',
        'full_name'      => 'Học Sinh Bulk 2',
        'username'       => 'hsbulk2',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => 1,
    ]);

    $response = $this->actingAs($this->admin, 'admin')->post(
        route('students.bulk-assign-classes'),
        [
            'student_ids' => [$student1->id, $student2->id],
            'class_id'    => $this->class1->id,
        ]
    );

    $response->assertSessionHas('success');

    expect($student1->classes()->where('classes.id', $this->class1->id)->exists())->toBeTrue();
    expect($student2->classes()->where('classes.id', $this->class1->id)->exists())->toBeTrue();
});

test('admin can add available students to a class from class detail page', function () {
    $student = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000005',
        'first_name'     => 'Thêm Vào Lớp',
        'last_name'      => 'Học Sinh',
        'full_name'      => 'Học Sinh Thêm Vào Lớp',
        'username'       => 'hsthemvaolop',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => 1,
    ]);

    // Check available students json endpoint
    $availableResponse = $this->actingAs($this->admin, 'admin')->getJson(
        route('classes.students.available', $this->class1->id)
    );
    $availableResponse->assertOk();
    $availableResponse->assertJsonFragment(['student_code' => 'STD000000005']);

    // Add student to class
    $addResponse = $this->actingAs($this->admin, 'admin')->post(
        route('classes.students.add', $this->class1->id),
        [
            'student_ids' => [$student->id],
        ]
    );
    $addResponse->assertSessionHas('success');

    expect($student->classes()->where('classes.id', $this->class1->id)->exists())->toBeTrue();

    // Remove student from class
    $removeResponse = $this->actingAs($this->admin, 'admin')->delete(
        route('classes.students.remove', [$this->class1->id, $student->id])
    );
    $removeResponse->assertSessionHas('success');

    expect($student->classes()->where('classes.id', $this->class1->id)->exists())->toBeFalse();
});
