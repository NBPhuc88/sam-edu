<?php

use App\Models\Center;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\ClassSubject;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated users cannot access grading routes', function () {
    $response = $this->get(route('grading.index'));
    $response->assertRedirect(route('login'));
});

test('teacher can view grading index and filter by class', function () {
    $center = Center::create([
        'code'   => 'CTR000000091',
        'name'   => 'Trung Tâm Test 1',
        'email'  => 'center1@test.com',
        'phone'  => '0901234567',
        'status' => 'active',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000091',
        'username'     => 'teacher_test_1',
        'first_name'   => 'A',
        'last_name'    => 'Nguyễn',
        'full_name'    => 'Nguyễn Văn A',
        'email'        => 'teacher1@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000091',
        'name'             => 'Tiếng Anh Giao Tiếp',
        'total_sessions'   => 30,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000091',
        'name'         => 'Lớp Giao Tiếp 01',
        'max_students' => 20,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    $exam = Exam::create([
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000091',
        'name'             => 'Đề Thi Giữa Kỳ',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'published',
    ]);

    $classExam = ClassExam::create([
        'code'                  => 'CE000000091',
        'access_code'           => '123456',
        'class_id'              => $class->id,
        'exam_id'               => $exam->id,
        'title'                 => 'Kiểm Tra 15 Phút',
        'exam_date'             => now()->format('Y-m-d'),
        'duration_minutes'      => 15,
        'max_score'             => 10,
        'status'                => 'ongoing',
        'created_by_teacher_id' => $teacher->id,
    ]);

    $student = Student::create([
        'center_id'    => $center->id,
        'student_code' => 'HS000000091',
        'username'     => 'student_test_1',
        'first_name'   => 'B',
        'last_name'    => 'Trần',
        'full_name'    => 'Trần Văn B',
        'email'        => 'student1@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $submission = ClassExamSubmission::create([
        'class_exam_id'           => $classExam->id,
        'student_id'              => $student->id,
        'attempt_number'          => 1,
        'started_at'              => now()->subMinutes(10),
        'submitted_at'            => now(),
        'duration_seconds_used'   => 600,
        'score'                   => 0,
        'total_correct'           => 0,
        'total_questions'         => 1,
        'status'                  => 'submitted',
        'is_graded'               => false,
        'requires_manual_grading' => true,
        'answers'                 => [],
        'grading_details'         => [],
    ]);

    $response = $this->actingAs($teacher, 'teacher')->get(route('grading.index', ['class_id' => $class->id]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Teacher/Grading/Index'));
});

test('teacher can grade essay and audio submission successfully', function () {
    $center = Center::create([
        'code'   => 'CTR000000092',
        'name'   => 'Trung Tâm Test 2',
        'email'  => 'center2@test.com',
        'phone'  => '0901234568',
        'status' => 'active',
    ]);

    $teacher = Teacher::create([
        'center_id'    => $center->id,
        'teacher_code' => 'GV000000092',
        'username'     => 'teacher_test_2',
        'first_name'   => 'C',
        'last_name'    => 'Lê',
        'full_name'    => 'Lê Văn C',
        'email'        => 'teacher2@test.com',
        'password'     => 'password123',
        'status'       => 'active',
    ]);

    $subject = Subject::create([
        'center_id'        => $center->id,
        'code'             => 'S000000092',
        'name'             => 'Tiếng Anh Học Thuật',
        'total_sessions'   => 30,
        'duration_minutes' => 90,
        'tuition_fee'      => 3000000,
        'status'           => 'active',
    ]);

    $class = SchoolClass::create([
        'center_id'    => $center->id,
        'code'         => 'C000000092',
        'name'         => 'Lớp Học Thuật 02',
        'max_students' => 20,
        'status'       => \App\Enums\EntityStatus::ACTIVE,
    ]);

    ClassSubject::create([
        'class_id'   => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status'     => 'active',
    ]);

    $exam = Exam::create([
        'center_id'        => $center->id,
        'subject_id'       => $subject->id,
        'code'             => 'EX000000092',
        'name'             => 'Đề Thi Viết & Nói',
        'duration_minutes' => 45,
        'max_score'        => 10,
        'status'           => 'published',
    ]);

    $section = ExamSection::create([
        'exam_id' => $exam->id,
        'title'   => 'Phần Viết & Nói',
        'skill'   => 'writing',
    ]);

    $essayQuestion = ExamQuestion::create([
        'exam_id'       => $exam->id,
        'section_id'    => $section->id,
        'question_type' => 'essay',
        'content'       => 'Viết đoạn văn ngắn mô tả kỳ nghỉ hè.',
        'score'         => 5.0,
    ]);

    $audioQuestion = ExamQuestion::create([
        'exam_id'       => $exam->id,
        'section_id'    => $section->id,
        'question_type' => 'audio_record',
        'content'       => 'Ghi âm phát âm đoạn văn mẫu.',
        'score'         => 5.0,
    ]);

    $classExam = ClassExam::create([
        'code'                  => 'CE000000092',
        'access_code'           => '654321',
        'class_id'              => $class->id,
        'exam_id'               => $exam->id,
        'title'                 => 'Kiểm Tra Tự Luận',
        'exam_date'             => now()->format('Y-m-d'),
        'duration_minutes'      => 30,
        'max_score'             => 10,
        'status'                => 'ongoing',
        'created_by_teacher_id' => $teacher->id,
    ]);

    $student = Student::create([
        'center_id'    => $center->id,
        'student_code' => 'HS000000092',
        'username'     => 'student_test_2',
        'first_name'   => 'D',
        'last_name'    => 'Phạm',
        'full_name'    => 'Phạm Văn D',
        'email'        => 'student2@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $submission = ClassExamSubmission::create([
        'class_exam_id'           => $classExam->id,
        'student_id'              => $student->id,
        'attempt_number'          => 1,
        'started_at'              => now()->subMinutes(20),
        'submitted_at'            => now(),
        'duration_seconds_used'   => 1200,
        'score'                   => 0,
        'total_correct'           => 0,
        'total_questions'         => 2,
        'status'                  => 'submitted',
        'is_graded'               => false,
        'requires_manual_grading' => true,
        'answers'                 => [
            $essayQuestion->id => 'Bài viết tiếng Anh về kỳ nghỉ tại Đà Nẵng rất vui vẻ.',
            $audioQuestion->id => 'exam/recording_sample.webm',
        ],
        'grading_details' => [],
    ]);

    // Teacher opens grading show page
    $showResponse = $this->actingAs($teacher, 'teacher')->get(route('grading.show', $submission->id));
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page->component('Teacher/Grading/Show'));

    // Teacher grades the submission
    $gradeResponse = $this->actingAs($teacher, 'teacher')->post(route('grading.grade', $submission->id), [
        'question_grades' => [
            $essayQuestion->id => [
                'score_earned' => 4.5,
                'comment'      => 'Bài viết tốt, chú ý chia thì quá khứ.',
            ],
            $audioQuestion->id => [
                'score_earned' => 4.0,
                'comment'      => 'Phát âm rõ ràng, cần luyện thêm ngữ điệu.',
            ],
        ],
        'teacher_feedback' => 'Học sinh tiến bộ nhiều, hoàn thành tốt phần thi!',
    ]);

    $gradeResponse->assertRedirect(route('grading.index', [
        'class_id'      => $class->id,
        'class_exam_id' => $classExam->id,
    ]));

    $submission->refresh();

    expect($submission->is_graded)->toBeTrue()
        ->and((float) $submission->score)->toBe(8.5)
        ->and($submission->graded_by_teacher_id)->toBe($teacher->id)
        ->and($submission->teacher_feedback)->toBe('Học sinh tiến bộ nhiều, hoàn thành tốt phần thi!')
        ->and($submission->grading_details[$essayQuestion->id]['score_earned'])->toBe(4.5)
        ->and($submission->grading_details[$essayQuestion->id]['teacher_comment'])->toBe('Bài viết tốt, chú ý chia thì quá khứ.');
});
