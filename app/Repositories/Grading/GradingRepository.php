<?php

namespace App\Repositories\Grading;

use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class GradingRepository implements GradingRepositoryInterface
{
    public function getClassesForGrading(?Teacher $teacher = null, ?Admin $admin = null): Collection
    {
        $query = SchoolClass::query()->whereIn('status', [1, 2]);

        if ($teacher) {
            $query->where(function (Builder $q) use ($teacher) {
                $q->whereHas('classSubjects', function (Builder $sq) use ($teacher) {
                    $sq->where('teacher_id', $teacher->id);
                })
                ->orWhereHas('classExams', function (Builder $eq) use ($teacher) {
                    $eq->where('created_by_teacher_id', $teacher->id);
                });
            });
        } elseif ($admin && ! $admin->isSuperAdmin()) {
            $centerIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereIn('center_id', $centerIds);
        }

        return $query->with('center:id,name')->orderBy('name')->get(['id', 'center_id', 'code', 'name']);
    }

    public function getClassExamsForGrading(?int $classId = null, ?Teacher $teacher = null, ?Admin $admin = null): Collection
    {
        $query = ClassExam::query();

        if ($classId) {
            $query->where('class_id', $classId);
        }

        if ($teacher) {
            $query->where(function (Builder $q) use ($teacher) {
                $q->where('created_by_teacher_id', $teacher->id)
                    ->orWhereHas('schoolClass.classSubjects', function (Builder $sq) use ($teacher) {
                        $sq->where('teacher_id', $teacher->id);
                    });
            });
        } elseif ($admin && ! $admin->isSuperAdmin()) {
            $centerIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereHas('schoolClass', function (Builder $cq) use ($centerIds) {
                $cq->whereIn('center_id', $centerIds);
            });
        }

        return $query->with(['schoolClass:id,name,code', 'exam:id,name,code'])
            ->orderByDesc('id')
            ->get(['id', 'code', 'class_id', 'exam_id', 'title', 'max_score', 'duration_minutes']);
    }

    public function getPaginatedSubmissions(
        ?int $classId,
        ?int $classExamId,
        ?string $gradedStatus,
        ?string $search,
        int $perPage = 15,
        int $page = 1,
        ?Teacher $teacher = null,
        ?Admin $admin = null
    ): LengthAwarePaginator {
        $query = $this->buildSubmissionQuery($classId, $classExamId, $gradedStatus, $search, $teacher, $admin);

        return $query->with([
            'student:id,full_name,student_code,username,avatar',
            'classExam:id,code,class_id,exam_id,title,max_score,pass_score',
            'classExam.schoolClass:id,name,code',
            'gradedByTeacher:id,full_name,teacher_code',
            'gradedByAdmin:id,full_name,username',
        ])
        ->orderByDesc('id')
        ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getGradingStats(
        ?int $classId,
        ?int $classExamId,
        ?Teacher $teacher = null,
        ?Admin $admin = null
    ): array {
        $baseQuery = $this->buildSubmissionQuery($classId, $classExamId, null, null, $teacher, $admin);

        $totalSubmissions = (clone $baseQuery)->count();
        $gradedCount      = (clone $baseQuery)->where('is_graded', true)->count();
        $pendingCount     = (clone $baseQuery)->where('is_graded', false)->count();
        $averageScore     = (clone $baseQuery)->where('is_graded', true)->whereNotNull('score')->avg('score') ?? 0.0;

        return [
            'total_submissions' => $totalSubmissions,
            'graded_count'      => $gradedCount,
            'pending_count'     => $pendingCount,
            'average_score'     => round((float) $averageScore, 2),
        ];
    }

    public function findSubmissionWithDetails(int $id): ?ClassExamSubmission
    {
        return ClassExamSubmission::query()
            ->with([
                'student:id,full_name,student_code,username,email,phone,avatar',
                'classExam.exam.sections.questions',
                'classExam.schoolClass:id,name,code,center_id',
                'classExam.schoolClass.center:id,name',
                'gradedByTeacher:id,full_name,teacher_code',
                'gradedByAdmin:id,full_name,username',
            ])
            ->find($id);
    }

    public function updateSubmissionGrading(ClassExamSubmission $submission, array $data): ClassExamSubmission
    {
        $submission->update($data);

        return $submission->fresh(['student', 'classExam', 'gradedByTeacher', 'gradedByAdmin']);
    }

    protected function buildSubmissionQuery(
        ?int $classId,
        ?int $classExamId,
        ?string $gradedStatus,
        ?string $search,
        ?Teacher $teacher = null,
        ?Admin $admin = null
    ): Builder {
        $query = ClassExamSubmission::query();

        if ($classExamId) {
            $query->where('class_exam_id', $classExamId);
        }

        if ($classId) {
            $query->whereHas('classExam', function (Builder $q) use ($classId) {
                $q->where('class_id', $classId);
            });
        }

        if ($gradedStatus === 'graded') {
            $query->where('is_graded', true);
        } elseif ($gradedStatus === 'pending') {
            $query->where('is_graded', false);
        } elseif ($gradedStatus === 'manual_needed') {
            $query->where('requires_manual_grading', true)->where('is_graded', false);
        }

        if ($search) {
            $query->whereHas('student', function (Builder $sq) use ($search) {
                $sq->where('full_name', 'like', "%{$search}%")
                   ->orWhere('student_code', 'like', "%{$search}%")
                   ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($teacher) {
            $query->whereHas('classExam.schoolClass', function (Builder $cq) use ($teacher) {
                $cq->whereHas('classSubjects', function (Builder $sq) use ($teacher) {
                    $sq->where('teacher_id', $teacher->id);
                })
                ->orWhereHas('classExams', function (Builder $eq) use ($teacher) {
                    $eq->where('created_by_teacher_id', $teacher->id);
                });
            });
        } elseif ($admin && ! $admin->isSuperAdmin()) {
            $centerIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereHas('classExam.schoolClass', function (Builder $cq) use ($centerIds) {
                $cq->whereIn('center_id', $centerIds);
            });
        }

        return $query;
    }
}
