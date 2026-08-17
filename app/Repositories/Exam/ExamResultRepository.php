<?php

namespace App\Repositories\Exam;

use App\Models\ExamResult;
use Illuminate\Database\Eloquent\Collection;

class ExamResultRepository implements ExamResultRepositoryInterface
{
    /**
     * @param  int                         $studentId
     * @return Collection<int, ExamResult>
     */
    public function getStudentExamResults(int $studentId): Collection
    {
        return ExamResult::with(['exam.subject', 'exam.schoolClass'])
            ->where('student_id', $studentId)
            ->latest()
            ->get();
    }
}
