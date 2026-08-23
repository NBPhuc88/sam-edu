<?php

namespace App\Repositories\Exam;

use App\Models\ExamResult;
use Illuminate\Database\Eloquent\Collection;

interface ExamResultRepositoryInterface
{
    /**
     * @param  int                         $studentId
     * @return Collection<int, ExamResult>
     */
    public function getStudentExamResults(int $studentId): Collection;

    /**
     * @param  int                         $studentId
     * @param  ?int                        $classId
     * @return Collection<int, ExamResult>
     */
    public function getTranscriptResults(int $studentId, ?int $classId = null): Collection;

    /**
     * @param  array<string, mixed> $attributes
     * @param  array<string, mixed> $values
     * @return ExamResult
     */
    public function updateOrCreate(array $attributes, array $values = []): ExamResult;
}
