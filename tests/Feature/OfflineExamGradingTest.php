<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\ClassSubject;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubscriptionPlan;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed essential plans
    $this->planAdvanced = SubscriptionPlan::create([
        'code'             => 'advanced_test',
        'name'             => 'Gói Nâng Cao Test',
        'plan_type'        => 'advanced',
        'allowed_features' => ['grading', 'chat', 'export_csv', 'exams', 'class-exams'],
        'status'           => 'active',
    ]);

    $this->planBasic = SubscriptionPlan::create([
        'code'             => 'basic_test',
        'name'             => 'Gói Cơ Bản Test',
        'plan_type'        => 'basic',
        'allowed_features' => ['export_csv', 'exams', 'class-exams'], // No 'grading', no 'chat'
        'status'           => 'active',
    ]);

    $this->center = Center::create([
        'code'              => 'CTR000000081',
        'name'              => 'Trung Tâm Nâng Cao',
        'email'             => 'center_adv@test.com',
        'phone'             => '0901111222',
        'subscription_plan' => 'advanced_test',
        'plan_type'         => 'advanced',
        'expires_at'        => now()->addYear(),
        'status'            => 'active',
    ]);

    $this->basicCenter = Center::create([
        'code'              => 'CTR000000082',
        'name'              => 'Trung Tâm Cơ Bản',
        'email'             => 'center_basic@test.com',
        'phone'             => '0902222333',
        'subscription_plan' => 'basic_test',
        'plan_type'         => 'basic',
        'expires_at'        => now()->addYear(),
        'status'            => 'active',
    ]);
});

test('unauthenticated users cannot access offline grading create route', function () {
    $response = $this->get(route('grading.offline.create'));
    $response->assertRedirect(route('login'));
});

test('super admin can access offline grading create and store offline exam with scores', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_test',
        'admin_code' => 'ADM000000081',
        'full_name'  => 'Super Admin',
        'email'      => 'superadmin@test.com',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'S000000081',
        'name'             => 'Toán 10',
        'total_sessions'   => 20,
        'duration_minutes' => 90,
        'tuition_fee'      => 1000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $this->center->id,
        'code'         => 'C000000081',
        'name'         => 'Lớp 10A1',
        'max_students' => 30,
        'status'       => 1,
    ]);

    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV000000089',
        'username'     => 'teacher_test_sa',
        'first_name'   => 'T',
        'last_name'    => 'Nguyễn',
        'full_name'    => 'Nguyễn Teacher',
        'email'        => 'teachersa@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    $student1 = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000081',
        'username'     => 'student_offline_1',
        'first_name'   => 'Bình',
        'last_name'    => 'Nguyễn',
        'full_name'    => 'Nguyễn Bình',
        'email'        => 'binh@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $student2 = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000082',
        'username'     => 'student_offline_2',
        'first_name'   => 'Cường',
        'last_name'    => 'Trần',
        'full_name'    => 'Trần Cường',
        'email'        => 'cuong@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $class->students()->attach([
        $student1->id => ['enrolled_at' => now(), 'status' => 'active'],
        $student2->id => ['enrolled_at' => now(), 'status' => 'active'],
    ]);

    // Super Admin visits create page
    $response = $this->actingAs($superAdmin, 'admin')->get(route('grading.offline.create'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Teacher/Grading/OfflineCreate'));

    // Super Admin submits offline scores
    $postData = [
        'class_id'    => $class->id,
        'subject_id'  => $subject->id,
        'title'       => 'Kiểm tra 15 phút Số 1',
        'exam_date'   => now()->format('Y-m-d'),
        'max_score'   => 10,
        'pass_score'  => 5,
        'description' => 'Kiểm tra giấy trên lớp',
        'scores'      => [
            [
                'student_id' => $student1->id,
                'score'      => 8.5,
                'comment'    => 'Làm bài rất tốt!',
            ],
            [
                'student_id' => $student2->id,
                'score'      => 4.0,
                'comment'    => 'Cần ôn lại phần hàm số.',
            ],
        ],
    ];

    $storeResponse = $this->actingAs($superAdmin, 'admin')->post(route('grading.offline.store'), $postData);
    $storeResponse->assertRedirect();

    // Verify Exam was created with auto generated code format EX000000001
    $exam = Exam::where('class_id', $class->id)->first();
    expect($exam)->not->toBeNull()
        ->and($exam->code)->toMatch('/^EX\d{9}$/')
        ->and($exam->name)->toBe('Kiểm tra 15 phút Số 1')
        ->and((float) $exam->max_score)->toBe(10.0);

    // Verify ClassExam
    $classExam = ClassExam::where('exam_id', $exam->id)->first();
    expect($classExam)->not->toBeNull()
        ->and($classExam->status)->toBe('completed');

    // Verify Submissions
    $sub1 = ClassExamSubmission::where('class_exam_id', $classExam->id)->where('student_id', $student1->id)->first();
    expect($sub1)->not->toBeNull()
        ->and((float) $sub1->score)->toBe(8.5)
        ->and($sub1->status)->toBe('passed')
        ->and($sub1->is_graded)->toBeTrue()
        ->and($sub1->teacher_feedback)->toBe('Làm bài rất tốt!');

    $sub2 = ClassExamSubmission::where('class_exam_id', $classExam->id)->where('student_id', $student2->id)->first();
    expect($sub2)->not->toBeNull()
        ->and((float) $sub2->score)->toBe(4.0)
        ->and($sub2->status)->toBe('failed')
        ->and($sub2->is_graded)->toBeTrue()
        ->and($sub2->teacher_feedback)->toBe('Cần ôn lại phần hàm số.');

    // Verify ExamResult synchronization
    $res1 = ExamResult::where('exam_id', $exam->id)->where('student_id', $student1->id)->first();
    expect($res1)->not->toBeNull()
        ->and((float) $res1->score)->toBe(8.5)
        ->and($res1->grade)->toBe('Xuất sắc');
});

test('teacher can only create offline exam for assigned class and subject', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV000000081',
        'username'     => 'teacher_offline_1',
        'first_name'   => 'Dung',
        'last_name'    => 'Lê',
        'full_name'    => 'Lê Dung',
        'email'        => 'dung@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject1 = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'S000000082',
        'name'             => 'Văn 10',
        'total_sessions'   => 20,
        'duration_minutes' => 90,
        'tuition_fee'      => 1000000,
        'status'           => 'active',
    ]);

    $subject2 = Subject::create([
        'center_id'        => $this->center->id,
        'code'             => 'S000000083',
        'name'             => 'Sử 10',
        'total_sessions'   => 20,
        'duration_minutes' => 90,
        'tuition_fee'      => 1000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $this->center->id,
        'code'         => 'C000000082',
        'name'         => 'Lớp 10A2',
        'max_students' => 30,
        'status'       => 1,
    ]);

    // Assign teacher to subject 1 only
    ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject1->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    $student = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000083',
        'username'     => 'student_offline_3',
        'first_name'   => 'Hoa',
        'last_name'    => 'Vũ',
        'full_name'    => 'Vũ Hoa',
        'email'        => 'hoa@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $class->students()->attach([
        $student->id => ['enrolled_at' => now(), 'status' => 'active'],
    ]);

    // Teacher tries to create offline exam for unassigned subject2 -> forbidden 403
    $invalidPostData = [
        'class_id'   => $class->id,
        'subject_id' => $subject2->id,
        'title'      => 'Kiểm tra Sử 15 phút',
        'exam_date'  => now()->format('Y-m-d'),
        'max_score'  => 10,
        'pass_score' => 5,
        'scores'     => [
            [
                'student_id' => $student->id,
                'score'      => 9.0,
            ],
        ],
    ];

    $failedResponse = $this->actingAs($teacher, 'teacher')->post(route('grading.offline.store'), $invalidPostData);
    $failedResponse->assertForbidden();

    // Teacher creates offline exam for assigned subject1 -> success
    $validPostData = [
        'class_id'   => $class->id,
        'subject_id' => $subject1->id,
        'title'      => 'Kiểm tra Văn 15 phút',
        'exam_date'  => now()->format('Y-m-d'),
        'max_score'  => 10,
        'pass_score' => 5,
        'scores'     => [
            [
                'student_id' => $student->id,
                'score'      => 9.0,
                'comment'    => 'Bài viết sâu sắc.',
            ],
        ],
    ];

    $successResponse = $this->actingAs($teacher, 'teacher')->post(route('grading.offline.store'), $validPostData);
    $successResponse->assertRedirect();
});

test('user from basic plan center is redirected to UpgradePlan for chat and grading', function () {
    $teacherBasic = Teacher::create([
        'center_id'    => $this->basicCenter->id,
        'teacher_code' => 'GV000000084',
        'username'     => 'teacher_basic_1',
        'first_name'   => 'Giang',
        'last_name'    => 'Đỗ',
        'full_name'    => 'Đỗ Giang',
        'email'        => 'giang@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    // Accessing /grading/offline/create on basic plan
    $gradingResponse = $this->actingAs($teacherBasic, 'teacher')->get(route('grading.offline.create'));
    $gradingResponse->assertForbidden();
    $gradingResponse->assertInertia(fn ($page) => $page->component('UpgradePlan'));

    // Accessing /chats on basic plan
    $chatResponse = $this->actingAs($teacherBasic, 'teacher')->get(route('chats.index'));
    $chatResponse->assertForbidden();
    $chatResponse->assertInertia(fn ($page) => $page->component('UpgradePlan'));
});
