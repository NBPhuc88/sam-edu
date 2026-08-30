<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use App\Models\Subject;
use App\Models\Teacher;
use App\Repositories\Tuition\StudentTuitionRepository;
use App\Services\Class\SchoolClassService;

beforeEach(function () {
    $this->center = Center::create([
        'code'   => 'CTR0000001',
        'name'   => 'Trung tâm Kiểm thử Học phí',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $this->superAdmin = Admin::create([
        'username'   => 'super_tuition_admin',
        'full_name'  => 'Super Admin Tuition',
        'email'      => 'admin_tuition@test.com',
        'password'   => bcrypt('12345678'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM0000001',
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV0000001',
        'username'     => 'teacher_tuition',
        'first_name'   => 'Toán',
        'last_name'    => 'Giáo viên',
        'full_name'    => 'Giáo viên Toán',
        'email'        => 'gv_tuition@test.com',
        'password'     => bcrypt('12345678'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $this->subject1 = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'MH0000001',
        'name'             => 'Toán Nâng Cao',
        'tuition_fee'      => 1500000,
        'total_sessions'   => 12,
        'duration_minutes' => 90,
        'status'           => Constant::SUBJECT_STATUS_ACTIVE,
    ]);

    $this->subject2 = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'MH0000002',
        'name'             => 'Vật Lý 12',
        'tuition_fee'      => 2000000,
        'total_sessions'   => 10,
        'duration_minutes' => 90,
        'status'           => Constant::SUBJECT_STATUS_ACTIVE,
    ]);

    $this->student1 = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS0000001',
        'username'     => 'hs_tuition_1',
        'first_name'   => '1',
        'last_name'    => 'Nguyễn Văn Học Sinh',
        'full_name'    => 'Nguyễn Văn Học Sinh 1',
        'email'        => 'hs1@test.com',
        'password'     => bcrypt('12345678'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $this->student2 = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS0000002',
        'username'     => 'hs_tuition_2',
        'first_name'   => '2',
        'last_name'    => 'Trần Thị Học Sinh',
        'full_name'    => 'Trần Thị Học Sinh 2',
        'email'        => 'hs2@test.com',
        'password'     => bcrypt('12345678'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);
});

test('tạo lớp học lưu đúng số tiền học phí cho từng môn học', function () {
    $this->actingAs($this->superAdmin, 'admin');

    $response = $this->post(route('classes.store'), [
        'center_id'    => $this->center->id,
        'name'         => 'Lớp 12A1 Chuyên Toán Lý',
        'code'         => 'L12A1',
        'max_students' => 30,
        'status'       => Constant::CLASS_STATUS_ACTIVE,
        'subjects'     => [
            [
                'subject_id'  => $this->subject1->id,
                'teacher_id'  => $this->teacher->id,
                'tuition_fee' => 1500000,
            ],
            [
                'subject_id'  => $this->subject2->id,
                'teacher_id'  => $this->teacher->id,
                'tuition_fee' => 2500000, // Đã chỉnh sửa từ 2.000.000 lên 2.500.000
            ],
        ],
    ]);

    $response->assertRedirect(route('classes.index'));

    $class = SchoolClass::where('code', 'L12A1')->first();
    expect($class)->not->toBeNull();
    expect($class->classSubjects)->toHaveCount(2);

    $mathSubject    = $class->classSubjects->where('subject_id', $this->subject1->id)->first();
    $physicsSubject = $class->classSubjects->where('subject_id', $this->subject2->id)->first();

    expect((float) $mathSubject->tuition_fee)->toEqual(1500000.0);
    expect((float) $physicsSubject->tuition_fee)->toEqual(2500000.0);
    expect((float) $class->fresh()->total_tuition_fee)->toEqual(4000000.0);
    expect((float) $class->total_tuition_fee)->toEqual(4000000.0);
});

test('khi thêm học sinh vào lớp hệ thống tự động tạo hồ sơ học phí bằng tổng tiền các môn', function () {
    $this->actingAs($this->superAdmin, 'admin');

    $class = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'L12A2',
        'name'      => 'Lớp 12A2',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);

    $class->classSubjects()->create([
        'subject_id'  => $this->subject1->id,
        'teacher_id'  => $this->teacher->id,
        'tuition_fee' => 1500000,
        'status'      => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    $class->classSubjects()->create([
        'subject_id'  => $this->subject2->id,
        'teacher_id'  => $this->teacher->id,
        'tuition_fee' => 1800000,
        'status'      => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    /** @var SchoolClassService $classService */
    $classService = app(SchoolClassService::class);
    $added        = $classService->addStudentsToClass($class->id, [$this->student1->id, $this->student2->id], $this->superAdmin);

    expect($added)->toBe(2);

    // Kiểm tra bản ghi student_tuitions tự động sinh
    $tuition1 = StudentTuition::where('student_id', $this->student1->id)->where('class_id', $class->id)->first();
    $tuition2 = StudentTuition::where('student_id', $this->student2->id)->where('class_id', $class->id)->first();

    expect($tuition1)->not->toBeNull();
    expect((float) $tuition1->total_amount)->toEqual(3300000.0);
    expect((float) $tuition1->remaining_amount)->toEqual(3300000.0);
    expect((int) $tuition1->status)->toEqual(Constant::TUITION_STATUS_PENDING);

    expect($tuition2)->not->toBeNull();
    expect((float) $tuition2->total_amount)->toEqual(3300000.0);
});

test('danh sách học phí gom nhóm theo học sinh khi không filter lớp và tách biệt khi filter lớp', function () {
    // Tạo 2 lớp với 2 mức học phí khác nhau
    $classA = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'LOPA',
        'name'      => 'Lớp A',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);
    $classA->classSubjects()->create([
        'subject_id'  => $this->subject1->id,
        'teacher_id'  => $this->teacher->id,
        'tuition_fee' => 1000000,
        'status'      => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    $classB = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'LOPB',
        'name'      => 'Lớp B',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);
    $classB->classSubjects()->create([
        'subject_id'  => $this->subject2->id,
        'teacher_id'  => $this->teacher->id,
        'tuition_fee' => 2000000,
        'status'      => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
    ]);

    // Gán student1 vào cả 2 lớp (Tổng = 3.000.000)
    /** @var SchoolClassService $classService */
    $classService = app(SchoolClassService::class);
    $classService->addStudentsToClass($classA->id, [$this->student1->id], $this->superAdmin);
    $classService->addStudentsToClass($classB->id, [$this->student1->id], $this->superAdmin);

    /** @var StudentTuitionRepository $tuitionRepo */
    $tuitionRepo = app(StudentTuitionRepository::class);

    // 1. Khi không filter lớp: Tổng tiền = 3.000.000 và có danh sách 2 lớp
    $paginatorNoFilter = $tuitionRepo->paginate(null, [$this->center->id], null, null, null, 15, 1);
    $itemsNoFilter     = $paginatorNoFilter->items();

    $studentItem = collect($itemsNoFilter)->where('student_id', $this->student1->id)->first();
    expect($studentItem)->not->toBeNull();
    expect((float) $studentItem->total_amount)->toEqual(3000000.0);
    expect($studentItem->classes)->toHaveCount(2);

    // 2. Khi filter theo lớp A: Chỉ có 1.000.000 và class là Lớp A
    $paginatorClassA = $tuitionRepo->paginate(null, [$this->center->id], $classA->id, null, null, 15, 1);
    $itemsClassA     = $paginatorClassA->items();

    $studentItemA = collect($itemsClassA)->where('student_id', $this->student1->id)->first();
    expect($studentItemA)->not->toBeNull();
    expect((float) $studentItemA->total_amount)->toEqual(1000000.0);
    expect($studentItemA->classes)->toHaveCount(1);
    expect($studentItemA->classes[0]['code'])->toEqual('LOPA');
});
