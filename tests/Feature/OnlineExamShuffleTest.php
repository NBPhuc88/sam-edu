<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\OnlineExam\OnlineExamService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(OnlineExamService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test OnlineExam',
        'status' => Constant::STATUS_ACTIVE,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_online_exam_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin OnlineExam',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Online Exam',
        'status'    => 1,
    ]);
    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_online_exam',
        'first_name'   => 'Student',
        'last_name'    => 'Online',
        'full_name'    => 'Student Online Exam',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $this->schoolClass->students()->attach($this->student->id, [
        'enrolled_at' => now(),
        'status'      => Constant::CLASS_STUDENT_STATUS_ACTIVE,
    ]);

    $this->exam = Exam::create([
        'center_id' => $this->center->id,
        'code'      => 'EX' . random_int(1000000, 9999999),
        'name'      => 'De Thi Trac Nghiem Online',
        'max_score' => 10.0,
    ]);
    $this->section = ExamSection::create([
        'exam_id'     => $this->exam->id,
        'title'       => 'Phan 1',
        'order_index' => 1,
    ]);
    $this->q1 = ExamQuestion::create([
        'exam_id'        => $this->exam->id,
        'section_id'     => $this->section->id,
        'title'          => 'Cau 1',
        'content'        => 'Content 1',
        'question_type'  => Constant::QUESTION_TYPE_SINGLE_CHOICE,
        'score'          => 10.0,
        'correct_answer' => 'A',
    ]);

    $this->classExam = ClassExam::create([
        'code'        => 'CE' . random_int(1000000, 9999999),
        'access_code' => '654321',
        'class_id'    => $this->schoolClass->id,
        'exam_id'     => $this->exam->id,
        'title'       => 'Ky Thi Online Lop 10',
        'exam_date'   => now()->toDateString(),
    ]);
});

test('shuffle settings work per submission and remain stable after reload and cache loss', function () {
    $this->exam->update(['shuffle_questions' => true, 'shuffle_options' => true]);
    $options = array_map(fn (int $i): string => "Option {$i}", range(1, 12));
    $this->q1->update(['options' => $options]);
    ExamQuestion::factory()->count(11)->create([
        'exam_id'        => $this->exam->id, 'section_id' => $this->section->id,
        'options'        => $options, 'question_type' => Constant::QUESTION_TYPE_MULTIPLE_CHOICE,
        'correct_answer' => ['A', 'C'],
    ]);
    $submission    = $this->service->startExamAttempt($this->classExam->id, $this->student);
    $readQuestions = fn () => $this->service->getExamForTaking($this->classExam->id, $this->student)['classExam']->exam->sections->first()->questions;
    $first         = $readQuestions();
    Cache::flush();
    $second = $readQuestions();
    expect($first->pluck('id')->all())->toBe($second->pluck('id')->all())
        ->not->toBe($this->section->questions()->pluck('id')->all());
    expect($first->firstWhere('id', $this->q1->id)->options)->toBe($second->firstWhere('id', $this->q1->id)->options);
    $shuffledOptions = $first->firstWhere('id', $this->q1->id)->options;
    expect(array_column($shuffledOptions, 'id'))->not->toBe(range('A', 'L'));
    expect(collect($shuffledOptions)->firstWhere('id', 'A')['text'])->toBe('Option 1');
    expect($first->first()->toArray())->not->toHaveKey('correct_answer')->not->toHaveKey('explanation');
    $answers = $first->mapWithKeys(fn ($question) => [$question->id => $question->id === $this->q1->id ? 'A' : ['C', 'A']])->all();
    $graded  = $this->service->submitExamAttempt($submission->id, $answers, $this->student);
    expect($graded->total_correct)->toBe(12);
    expect($this->q1->fresh()->options)->toBe($options);
});

test('disabled shuffle preserves original question and option order', function () {
    $this->q1->update(['options' => ['First', 'Second']]);
    $this->service->startExamAttempt($this->classExam->id, $this->student);
    $exam = $this->service->getExamForTaking($this->classExam->id, $this->student)['classExam']->exam;
    expect($exam->sections->first()->questions->pluck('id')->all())->toBe([$this->q1->id])
        ->and($exam->sections->first()->questions->first()->options)->toBe(['First', 'Second']);
});

test('shuffle keeps questions in their sections and leaves structured answers intact', function () {
    $this->exam->update(['shuffle_questions' => true, 'shuffle_options' => true]);
    $other    = ExamSection::create(['exam_id' => $this->exam->id, 'title' => 'Passage 2', 'order_index' => 2]);
    $options  = ['left' => [['id' => '1', 'text' => 'One']], 'right' => [['id' => 'a', 'text' => 'A']]];
    $matching = ExamQuestion::factory()->create(['exam_id' => $this->exam->id, 'section_id' => $other->id, 'question_type' => Constant::QUESTION_TYPE_MATCHING, 'options' => $options]);
    $this->service->startExamAttempt($this->classExam->id, $this->student);
    $sections = $this->service->getExamForTaking($this->classExam->id, $this->student)['classExam']->exam->sections;
    expect($sections->pluck('id')->all())->toBe([$this->section->id, $other->id])
        ->and($sections[0]->questions->pluck('id')->all())->toBe([$this->q1->id])
        ->and($sections[1]->questions->pluck('id')->all())->toBe([$matching->id])
        ->and($sections[1]->questions[0]->options)->toBe($options);
});

test('question and option shuffle switches operate independently', function (bool $questions, bool $options) {
    $this->exam->update(['shuffle_questions' => $questions, 'shuffle_options' => $options]);
    $originalOptions = array_map(fn (int $i): array => ['key' => chr(65 + $i), 'text' => "Choice {$i}"], range(0, 11));
    $this->q1->update(['options' => $originalOptions]);
    ExamQuestion::factory()->count(11)->create(['exam_id' => $this->exam->id, 'section_id' => $this->section->id]);
    $this->service->startExamAttempt($this->classExam->id, $this->student);
    $displayed   = $this->service->getExamForTaking($this->classExam->id, $this->student)['classExam']->exam->sections->first()->questions;
    $originalIds = $this->section->questions()->pluck('id')->all();
    expect($displayed->pluck('id')->all() !== $originalIds)->toBe($questions);
    expect(array_column($displayed->firstWhere('id', $this->q1->id)->options, 'key') !== array_column($originalOptions, 'key'))->toBe($options);
})->with([[true, false], [false, true]]);

test('different students receive independently ordered attempts', function () {
    $this->exam->update(['shuffle_questions' => true, 'shuffle_options' => true]);
    ExamQuestion::factory()->count(11)->create(['exam_id' => $this->exam->id, 'section_id' => $this->section->id]);
    $otherStudent = Student::factory()->create(['center_id' => $this->center->id]);
    $this->schoolClass->students()->attach($otherStudent->id, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_ACTIVE]);
    $this->service->startExamAttempt($this->classExam->id, $this->student);
    $this->service->startExamAttempt($this->classExam->id, $otherStudent);
    $first  = $this->service->getExamForTaking($this->classExam->id, $this->student)['classExam']->exam->sections->first()->questions->pluck('id')->all();
    $second = $this->service->getExamForTaking($this->classExam->id, $otherStudent)['classExam']->exam->sections->first()->questions->pluck('id')->all();
    expect($first)->not->toBe($second);
});
