<?php

use App\Models\Center;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Services\Exam\PracticeExamService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

beforeEach(function () {
    $this->service = app(PracticeExamService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test PracticeExamService',
        'status' => 'active',
    ]);
});

test('getPracticeExamDetail throws NotFoundHttpException for non-existent practice exam', function () {
    expect(fn () => $this->service->getPracticeExamDetail(999999))
        ->toThrow(NotFoundHttpException::class);
});

test('gradePracticeExam correctly scores single choice and calculates percentage', function () {
    $exam = Exam::create([
        'center_id' => $this->center->id,
        'code'      => 'EX' . random_int(1000000, 9999999),
        'name'      => 'De Thi Thu Online',
        'max_score' => 10.0,
    ]);

    $section = ExamSection::create([
        'exam_id'     => $exam->id,
        'title'       => 'Phan 1: Trac Nghihem',
        'order_index' => 1,
    ]);

    $q1 = ExamQuestion::create([
        'exam_id'        => $exam->id,
        'section_id'     => $section->id,
        'title'          => 'Cau 1',
        'content'        => 'Cau hoi 1 content',
        'question_type'  => 'single_choice',
        'score'          => 5.0,
        'correct_answer' => 'A',
    ]);

    $q2 = ExamQuestion::create([
        'exam_id'        => $exam->id,
        'section_id'     => $section->id,
        'title'          => 'Cau 2',
        'content'        => 'Cau hoi 2 content',
        'question_type'  => 'single_choice',
        'score'          => 5.0,
        'correct_answer' => 'B',
    ]);

    $userAnswers = [
        $q1->id => 'A',
        $q2->id => 'C',
    ];

    $result = $this->service->gradePracticeExam($exam->id, $userAnswers);

    expect($result['summary']['correct_count'])->toBe(1);
    expect($result['summary']['incorrect_count'])->toBe(1);
    expect((float) $result['summary']['earned_score'])->toBe(5.0);
    expect((float) $result['summary']['percentage'])->toBe(50.0);
    expect($result['summary']['is_passed'])->toBeTrue();
});
