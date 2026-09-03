<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\Student;
use App\Services\Transcript\StudentTranscriptService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(StudentTranscriptService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test StudentTranscript',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);
    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_transcript',
        'first_name'   => 'Student',
        'last_name'    => 'Transcript',
        'full_name'    => 'Student Transcript Test',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);
});

test('resolveStudent returns student model by given ID', function () {
    $found = $this->service->resolveStudent($this->student->id);

    expect($found->id)->toBe($this->student->id);
});

test('getTranscriptPrintData formats student GPA and summary metrics', function () {
    $data = $this->service->getTranscriptPrintData($this->student);

    expect($data['student']->id)->toBe($this->student->id)
        ->and($data)->toHaveKeys(['gpa', 'academicRanking', 'passRate', 'results', 'summary']);
});
