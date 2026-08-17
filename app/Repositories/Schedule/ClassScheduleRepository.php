<?php

namespace App\Repositories\Schedule;

use App\Models\ClassSchedule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ClassScheduleRepository implements ClassScheduleRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?int                 $teacherId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = ClassSchedule::query()
            ->with([
                'classSubject.schoolClass.center',
                'classSubject.subject',
                'classSubject.teacher',
                'room',
            ])
            ->withCount('classSessions');

        if ($centerIds !== null) {
            $query->whereHas('classSubject.schoolClass', function ($q) use ($centerIds) {
                if (is_array($centerIds)) {
                    $q->whereIn('center_id', $centerIds);
                } else {
                    $q->where('center_id', $centerIds);
                }
            });
        }

        if ($classId !== null) {
            $query->whereHas('classSubject', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            });
        }

        if ($subjectId !== null) {
            $query->whereHas('classSubject', function ($q) use ($subjectId) {
                $q->where('subject_id', $subjectId);
            });
        }

        if ($teacherId !== null) {
            $query->whereHas('classSubject', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            });
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->whereHas('classSubject.schoolClass', function ($cq) use ($term) {
                    $cq->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%");
                })
                ->orWhereHas('classSubject.subject', function ($sq) use ($term) {
                    $sq->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%");
                })
                ->orWhereHas('classSubject.teacher', function ($tq) use ($term) {
                    $tq->where('full_name', 'like', "%{$term}%")
                        ->orWhere('teacher_code', 'like', "%{$term}%");
                })
                ->orWhereHas('room', function ($rq) use ($term) {
                    $rq->where('name', 'like', "%{$term}%");
                });
            });
        }

        return $query->latest('id')->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int                $id
     * @param  array<int>|null    $allowedCenterIds
     * @return ClassSchedule|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?ClassSchedule
    {
        $query = ClassSchedule::query()
            ->with([
                'classSubject.schoolClass.center',
                'classSubject.subject',
                'classSubject.teacher',
                'room',
                'classSessions' => function ($sq) {
                    $sq->orderBy('session_date', 'asc')->orderBy('start_time', 'asc');
                },
            ])
            ->withCount('classSessions');

        if ($allowedCenterIds !== null) {
            $query->whereHas('classSubject.schoolClass', function ($q) use ($allowedCenterIds) {
                $q->whereIn('center_id', $allowedCenterIds);
            });
        }

        return $query->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return ClassSchedule
     */
    public function create(array $data): ClassSchedule
    {
        return ClassSchedule::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return ClassSchedule
     */
    public function update(int $id, array $data): ClassSchedule
    {
        $schedule = ClassSchedule::findOrFail($id);
        $schedule->update($data);

        return $schedule;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $schedule = ClassSchedule::findOrFail($id);

        return (bool) $schedule->delete();
    }

    /**
     * @param  int                            $classSubjectId
     * @return Collection<int, ClassSchedule>
     */
    public function getByClassSubjectId(int $classSubjectId): Collection
    {
        return ClassSchedule::where('class_subject_id', $classSubjectId)->get();
    }
}
