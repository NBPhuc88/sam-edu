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
}
