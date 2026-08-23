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
        return ExamResult::query()
            ->select(
                'id',
                'exam_id',
                'student_id',
                'score',
                'grade',
                'comment',
                'created_at'
            )
            ->with([
                'exam:id,name,code,subject_id,class_id,max_score,exam_date',
                'exam.subject:id,name,code',
                'exam.schoolClass:id,name,code',
            ])
            ->where('student_id', $studentId)
            ->latest()
            ->get();
    }
}
