<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSubject;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
    Artisan::call('db:seed', ['--class' => 'PermissionSeeder']);

    $this->center = Center::create([
        'code'                 => 'CTR000000001',
        'name'                 => 'Trung Tâm Test Alpha',
        'status'               => Constant::CENTER_STATUS_ACTIVE,
        'subscription_plan_id' => 1,
        'plan_type'            => Constant::PLAN_TYPE_PREMIUM,
        'expires_at'           => Carbon::now()->addMonths(6),
    ]);

    $this->admin = Admin::create([
        'admin_code' => 'ADM000000001',
        'username'   => 'admin_test',
        'email'      => 'admin@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test',
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::ADMIN_STATUS_ACTIVE,
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
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $this->subject = Subject::create([
        'center_id' => $this->center->id,
        'code'      => 'SUB000000001',
        'name'      => 'Toán Lớp 10 Nâng Cao',
        'status'    => Constant::SUBJECT_STATUS_ACTIVE,
    ]);

    $this->class1 = SchoolClass::create([
        'center_id'    => $this->center->id,
        'teacher_id'   => $this->teacher->id,
        'subject_id'   => $this->subject->id,
        'code'         => 'C000000001',
        'name'         => 'Lớp Toán 10A1',
        'max_capacity' => 30,
        'status'       => Constant::CLASS_STATUS_ACTIVE,
    ]);

    $this->class2 = SchoolClass::create([
        'center_id'    => $this->center->id,
        'teacher_id'   => $this->teacher->id,
        'subject_id'   => $this->subject->id,
        'code'         => 'C000000002',
        'name'         => 'Lớp Toán 10A2',
        'max_capacity' => 30,
        'status'       => Constant::CLASS_STATUS_ACTIVE,
    ]);
});

test('admin can create student with initial class enrollment', function () {
    $response = $this->actingAs($this->admin, 'admin')->post(route('students.store'), [
        'center_id'      => $this->center->id,
        'full_name'      => 'Nguyễn Văn Học Sinh',
        'username'       => 'hocsinh01',
        'password'       => '12345678',
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
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
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);
    $student->classes()->attach($this->class1->id, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_ACTIVE]);

    $response = $this->actingAs($this->admin, 'admin')->patch(route('students.update', $student->id), [
        'center_id'      => $this->center->id,
        'student_code'   => $student->student_code,
        'full_name'      => 'Lê Văn An Đã Đổi Tên',
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
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
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
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
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
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
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
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
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
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

test('teacher can view student list of class they teach', function () {
    // Grant classes.students permission to teacher role
    $permission = Permission::where('code', 'classes.students')->first();

    if ($permission) {
        RolePermission::create([
            'role'          => Constant::ROLE_TEACHER,
            'permission_id' => $permission->id,
        ]);
        Cache::forget('permissions_role_teacher');
    }

    // Create class subject for teacher
    ClassSubject::create([
        'class_id'   => $this->class1->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'status'     => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    $response = $this->actingAs($this->teacher, 'teacher')
        ->get(route('classes.students.index', ['classId' => $this->class1->id]));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('Admin/Classes/Students')
            ->has('schoolClass')
            ->has('students')
            ->where('isTeacher', true)
    );
});

test('assignClasses creates tuition only when create_tuition is true', function () {
    $this->class1->update(['total_tuition_fee' => 1500000]);

    $student = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000010',
        'first_name'     => 'Tuition',
        'last_name'      => 'Test',
        'full_name'      => 'Tuition Test 1',
        'username'       => 'tuitiontest1',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    // 1. When create_tuition is 0/false -> No tuition created
    $this->actingAs($this->admin, 'admin')->post(
        route('students.assign-classes', $student->id),
        [
            'class_ids'      => [$this->class1->id],
            'create_tuition' => 0,
        ]
    )->assertSessionHas('success');

    expect(StudentTuition::where('student_id', $student->id)->where('class_id', $this->class1->id)->exists())->toBeFalse();

    // 2. When student is assigned to new class with create_tuition is 1/true -> Tuition created
    $this->class2->update(['total_tuition_fee' => 2000000]);
    $this->actingAs($this->admin, 'admin')->post(
        route('students.assign-classes', $student->id),
        [
            'class_ids'      => [$this->class1->id, $this->class2->id],
            'create_tuition' => 1,
        ]
    )->assertSessionHas('success');

    $tuition = StudentTuition::where('student_id', $student->id)->where('class_id', $this->class2->id)->first();
    expect($tuition)->not->toBeNull();
    expect((float) $tuition->total_amount)->toEqual(2000000.0);
});

test('addStudents creates tuition only when create_tuition is true', function () {
    $this->class1->update(['total_tuition_fee' => 1200000]);

    $studentNoTuition = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000011',
        'first_name'     => 'No',
        'last_name'      => 'Tuition',
        'full_name'      => 'No Tuition',
        'username'       => 'notuition',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $studentWithTuition = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000012',
        'first_name'     => 'With',
        'last_name'      => 'Tuition',
        'full_name'      => 'With Tuition',
        'username'       => 'withtuition',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    // 1. Without tuition
    $this->actingAs($this->admin, 'admin')->post(
        route('classes.students.add', $this->class1->id),
        [
            'student_ids'    => [$studentNoTuition->id],
            'create_tuition' => 0,
        ]
    )->assertSessionHas('success');

    expect(StudentTuition::where('student_id', $studentNoTuition->id)->where('class_id', $this->class1->id)->exists())->toBeFalse();

    // 2. With tuition
    $this->actingAs($this->admin, 'admin')->post(
        route('classes.students.add', $this->class1->id),
        [
            'student_ids'    => [$studentWithTuition->id],
            'create_tuition' => 1,
        ]
    )->assertSessionHas('success');

    $tuition = StudentTuition::where('student_id', $studentWithTuition->id)->where('class_id', $this->class1->id)->first();
    expect($tuition)->not->toBeNull();
    expect((float) $tuition->total_amount)->toEqual(1200000.0);
});

test('bulkAssign creates tuition only when create_tuition is true', function () {
    $this->class1->update(['total_tuition_fee' => 1800000]);

    $student = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000013',
        'first_name'     => 'Bulk',
        'last_name'      => 'Tuition',
        'full_name'      => 'Bulk Tuition',
        'username'       => 'bulktuition',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $this->actingAs($this->admin, 'admin')->post(
        route('students.bulk-assign-classes'),
        [
            'class_id'       => $this->class1->id,
            'student_ids'    => [$student->id],
            'create_tuition' => 1,
        ]
    )->assertSessionHas('success');

    $tuition = StudentTuition::where('student_id', $student->id)->where('class_id', $this->class1->id)->first();
    expect($tuition)->not->toBeNull();
    expect((float) $tuition->total_amount)->toEqual(1800000.0);
});

test('assignClasses creates tuition only for selected tuition_class_ids', function () {
    $this->class1->update(['total_tuition_fee' => 1000000]);
    $this->class2->update(['total_tuition_fee' => 2000000]);

    $student = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000014',
        'first_name'     => 'Selective',
        'last_name'      => 'Class',
        'full_name'      => 'Selective Class',
        'username'       => 'selectiveclass',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $this->actingAs($this->admin, 'admin')->post(
        route('students.assign-classes', $student->id),
        [
            'class_ids'         => [$this->class1->id, $this->class2->id],
            'create_tuition'    => 1,
            'tuition_class_ids' => [$this->class1->id], // Only class 1
        ]
    )->assertSessionHas('success');

    expect(StudentTuition::where('student_id', $student->id)->where('class_id', $this->class1->id)->exists())->toBeTrue();
    expect(StudentTuition::where('student_id', $student->id)->where('class_id', $this->class2->id)->exists())->toBeFalse();
});

test('addStudents creates tuition only for selected tuition_student_ids', function () {
    $this->class1->update(['total_tuition_fee' => 1500000]);

    $student1 = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000015',
        'first_name'     => 'Sel1',
        'last_name'      => 'Student',
        'full_name'      => 'Sel1 Student',
        'username'       => 'selstudent1',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $student2 = Student::create([
        'center_id'      => $this->center->id,
        'student_code'   => 'STD000000016',
        'first_name'     => 'Sel2',
        'last_name'      => 'Student',
        'full_name'      => 'Sel2 Student',
        'username'       => 'selstudent2',
        'password'       => Hash::make('12345678'),
        'admission_date' => Carbon::now()->toDateString(),
        'status'         => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $this->actingAs($this->admin, 'admin')->post(
        route('classes.students.add', $this->class1->id),
        [
            'student_ids'         => [$student1->id, $student2->id],
            'create_tuition'      => 1,
            'tuition_student_ids' => [$student1->id], // Only student 1
        ]
    )->assertSessionHas('success');

    expect(StudentTuition::where('student_id', $student1->id)->where('class_id', $this->class1->id)->exists())->toBeTrue();
    expect(StudentTuition::where('student_id', $student2->id)->where('class_id', $this->class1->id)->exists())->toBeFalse();
});
