<?php

namespace App\Repositories\ClassExam;

use App\Models\Admin;
use App\Models\ClassExam;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClassExamRepository implements ClassExamRepositoryInterface
{
    public function getPaginatedClassExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $examId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator {
        $query = ClassExam::query()
            ->with(['schoolClass.center', 'exam.subject', 'createdByTeacher', 'createdByAdmin']);

        // Scope by admin center
        if ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereHas('schoolClass', function ($q) use ($managedCenterIds) {
                $q->whereIn('center_id', $managedCenterIds);
            });
        } elseif ($centerId) {
            $query->whereHas('schoolClass', function ($q) use ($centerId) {
                $q->where('center_id', $centerId);
            });
        }

        if ($classId) {
            $query->where('class_id', $classId);
        }

        if ($examId) {
            $query->where('exam_id', $examId);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('schoolClass', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('exam', function ($eq) use ($search) {
                        $eq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        return $query->orderBy('exam_date', 'desc')
            ->orderBy('start_time', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function findById(int $id, ?Admin $admin = null): ?ClassExam
    {
        $query = ClassExam::query()
            ->with([
                'schoolClass.center',
                'exam.subject',
                'exam.sections.questions',
                'createdByTeacher',
                'createdByAdmin',
            ]);

        if ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereHas('schoolClass', function ($q) use ($managedCenterIds) {
                $q->whereIn('center_id', $managedCenterIds);
            });
        }

        return $query->find($id);
    }

    public function create(array $data): ClassExam
    {
        return ClassExam::create($data);
    }

    public function update(ClassExam $classExam, array $data): ClassExam
    {
        $classExam->update($data);

        return $classExam->fresh(['schoolClass.center', 'exam.subject']);
    }

    public function delete(ClassExam $classExam): bool
    {
        return (bool) $classExam->delete();
    }

    public function getStats(?Admin $admin = null): array
    {
        $query = ClassExam::query();

        if ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereHas('schoolClass', function ($q) use ($managedCenterIds) {
                $q->whereIn('center_id', $managedCenterIds);
            });
        }

        $total     = (clone $query)->count();
        $scheduled = (clone $query)->where('status', 'scheduled')->count();
        $ongoing   = (clone $query)->where('status', 'ongoing')->count();
        $completed = (clone $query)->where('status', 'completed')->count();

        return [
            'total'     => $total,
            'scheduled' => $scheduled,
            'ongoing'   => $ongoing,
            'completed' => $completed,
        ];
    }
}
