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

    /**
     * @param  int                         $studentId
     * @param  ?int                        $classId
     * @return Collection<int, ExamResult>
     */
    public function getTranscriptResults(int $studentId, ?int $classId = null): Collection
    {
        $query = ExamResult::query()
            ->with([
                'exam:id,title,subject_id,max_score',
                'exam.subject:id,name,code',
                'classExam.schoolClass:id,name,code',
            ])
            ->where('student_id', $studentId);

        if ($classId) {
            $query->whereHas('classExam', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            });
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * @param  array<string, mixed> $attributes
     * @param  array<string, mixed> $values
     * @return ExamResult
     */
    public function updateOrCreate(array $attributes, array $values = []): ExamResult
    {
        return ExamResult::updateOrCreate($attributes, $values);
    }
}
