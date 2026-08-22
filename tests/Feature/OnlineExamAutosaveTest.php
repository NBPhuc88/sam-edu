<?php

use App\Models\Center;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\ClassStudent;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('student can autosave progress during exam', function () {
    $center = Center::create([
        'code'   => 'CTR000000088',
        'name'   => 'Trung Tâm Test Autosave',
        'email'  => 'autosave@test.com',
        'phone'  => '0901234568',
        'status' => 'active',
    ]);

    $student = Student::create([
        'center_id'    => $center->id,
        'student_code' => 'HS000000088',
        'username'     => 'student_autosave_1',
        'first_name'   => 'C',
        'last_name'    => 'Lê',
        'full_name'    => 'Lê Văn C',
        'email'        => 'student_autosave1@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000088',
        'name'             => 'Tiếng Trung',
        'total_sessions'   => 30,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000088',
        'name'         => 'Lớp HSK 01',
        'max_students' => 20,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    ClassStudent::create([
        'class_id'    => $class->id,
        'student_id'  => $student->id,
        'enrolled_at' => now()->toDateString(),
        'status'      => 'active',
    ]);

    $exam = Exam::create([
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000088',
        'name'             => 'Đề Thi Autosave',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'published',
    ]);

    $classExam = ClassExam::create([
        'code'             => 'CE000000088',
        'access_code'      => '654321',
        'class_id'         => $class->id,
        'exam_id'          => $exam->id,
        'title'            => 'Kiểm Tra Autosave',
        'exam_date'        => now()->format('Y-m-d'),
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'ongoing',
    ]);

    $submission = ClassExamSubmission::create([
        'class_exam_id'         => $classExam->id,
        'student_id'            => $student->id,
        'attempt_number'        => 1,
        'started_at'            => now(),
        'submitted_at'          => null,
        'duration_seconds_used' => 0,
        'score'                 => 0,
        'total_correct'         => 0,
        'total_questions'       => 5,
        'status'                => 'in_progress',
        'answers'               => [],
        'grading_details'       => [],
    ]);

    $draftAnswers = [
        '101' => 'B',
        '102' => ['A', 'C'],
        '103' => 'Đáp án tự luận của học sinh',
    ];

    $response = $this->actingAs($student, 'student')
        ->postJson(route('online-exam.autosave', [
            'id'           => $classExam->id,
            'submissionId' => $submission->id,
        ]), [
            'answers' => $draftAnswers,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $submission->refresh();
    expect($submission->answers)->toEqual($draftAnswers);
});

test('student cannot autosave on another students submission', function () {
    $center = Center::create([
        'code'   => 'CTR000000089',
        'name'   => 'Trung Tâm Test 2',
        'email'  => 'autosave2@test.com',
        'phone'  => '0901234569',
        'status' => 'active',
    ]);

    $student1 = Student::create([
        'center_id'    => $center->id,
        'student_code' => 'HS000000089',
        'username'     => 'student_autosave_2',
        'first_name'   => 'D',
        'last_name'    => 'Vũ',
        'full_name'    => 'Vũ Văn D',
        'email'        => 'student_autosave2@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $student2 = Student::create([
        'center_id'    => $center->id,
        'student_code' => 'HS000000090',
        'username'     => 'student_autosave_3',
        'first_name'   => 'E',
        'last_name'    => 'Đỗ',
        'full_name'    => 'Đỗ Văn E',
        'email'        => 'student_autosave3@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000089',
        'name'             => 'Tiếng Trung 2',
        'total_sessions'   => 30,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000089',
        'name'         => 'Lớp HSK 02',
        'max_students' => 20,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    $exam = Exam::create([
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000089',
        'name'             => 'Đề Thi Autosave 2',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'published',
    ]);

    $classExam = ClassExam::create([
        'code'             => 'CE000000089',
        'access_code'      => '999888',
        'class_id'         => $class->id,
        'exam_id'          => $exam->id,
        'title'            => 'Kiểm Tra Autosave 2',
        'exam_date'        => now()->format('Y-m-d'),
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'ongoing',
    ]);

    $submission = ClassExamSubmission::create([
        'class_exam_id'         => $classExam->id,
        'student_id'            => $student1->id,
        'attempt_number'        => 1,
        'started_at'            => now(),
        'submitted_at'          => null,
        'duration_seconds_used' => 0,
        'score'                 => 0,
        'total_correct'         => 0,
        'total_questions'       => 5,
        'status'                => 'in_progress',
        'answers'               => [],
        'grading_details'       => [],
    ]);

    // Student 2 tries to autosave Student 1's submission
    $response = $this->actingAs($student2, 'student')
        ->postJson(route('online-exam.autosave', [
            'id'           => $classExam->id,
            'submissionId' => $submission->id,
        ]), [
            'answers' => ['101' => 'Hack'],
        ]);

    $response->assertStatus(422);
});
