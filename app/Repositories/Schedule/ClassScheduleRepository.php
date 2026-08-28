<?php

namespace App\Repositories\Schedule;

use App\Enums\Constant;
use App\Models\ClassSchedule;
use App\Models\ClassSubject;
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
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): LengthAwarePaginator {
        $query = ClassSchedule::query()
            ->select(
                'id',
                'class_subject_id',
                'weeks',
                'off_days',
                'extra_days',
                'room_id',
                'status',
                'created_at'
            )
            ->with([
                'classSubject' => function ($q) {
                    $q->select('id', 'class_id', 'subject_id', 'teacher_id', 'start_date', 'end_date', 'status')
                      ->withCount('classSessions');
                },
                'classSubject.schoolClass:id,center_id,name,code,start_date,end_date',
                'classSubject.schoolClass.center:id,name,code',
                'classSubject.subject:id,name,code,total_sessions,duration_minutes',
                'classSubject.teacher:id,full_name,teacher_code',
                'room:id,name,code',
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

        return $query->latest('id')->deferredPaginate($perPage, ['*'], 'page', $page)->withQueryString();
    }

    /**
     * @param  int                $id
     * @param  array<int>|null    $allowedCenterIds
     * @return ClassSchedule|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?ClassSchedule
    {
        $query = ClassSchedule::query()
            ->select(
                'id',
                'class_subject_id',
                'weeks',
                'off_days',
                'extra_days',
                'holidays',
                'auto_holidays',
                'excluded_holiday_ids',
                'room_id',
                'status',
                'created_at'
            )
            ->with([
                'classSubject' => function ($q) {
                    $q->select('id', 'class_id', 'subject_id', 'teacher_id', 'start_date', 'end_date', 'status')
                      ->withCount('classSessions');
                },
                'classSubject.schoolClass:id,center_id,name,code,start_date,end_date',
                'classSubject.schoolClass.center:id,name,code',
                'classSubject.subject:id,name,code,total_sessions,duration_minutes',
                'classSubject.teacher:id,full_name,teacher_code',
                'room:id,name,code',
                'classSessions' => function ($sq) {
                    $sq->select(
                        'id',
                        'class_schedule_id',
                        'class_subject_id',
                        'teacher_id',
                        'room_id',
                        'session_date',
                        'start_time',
                        'end_time',
                        'topic',
                        'status',
                        'note'
                    )
                    ->orderBy('session_date', 'asc')
                    ->orderBy('start_time', 'asc');
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

    /**
     * @param  int                $classSubjectId
     * @return ClassSchedule|null
     */
    public function findByClassSubjectId(int $classSubjectId): ?ClassSchedule
    {
        return ClassSchedule::where('class_subject_id', $classSubjectId)->first();
    }

    /**
     * @param  int                            $teacherId
     * @return Collection<int, ClassSchedule>
     */
    public function getTeacherSchedules(int $teacherId): Collection
    {
        return ClassSchedule::query()
            ->select(
                'id',
                'class_subject_id',
                'weeks',
                'off_days',
                'extra_days',
                'room_id',
                'status'
            )
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id,start_date,end_date',
                'classSubject.schoolClass:id,name,code,start_date,end_date',
                'classSubject.subject:id,name,code,total_sessions,duration_minutes',
                'room:id,name,code',
            ])
            ->whereHas('classSubject', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->get();
    }

    /**
     * @param  array<int, int>                $classIds
     * @return Collection<int, ClassSchedule>
     */
    public function getStudentSchedules(array $classIds): Collection
    {
        return ClassSchedule::query()
            ->select(
                'id',
                'class_subject_id',
                'weeks',
                'off_days',
                'extra_days',
                'room_id',
                'status'
            )
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id,start_date,end_date',
                'classSubject.schoolClass:id,name,code,start_date,end_date',
                'classSubject.subject:id,name,code,total_sessions,duration_minutes',
                'room:id,name,code',
            ])
            ->whereHas('classSubject', function ($q) use ($classIds) {
                $q->whereIn('class_id', $classIds);
            })
            ->get();
    }

    public function findOrCreateClassSubject(int $classId, int $subjectId, array $attributes): ClassSubject
    {
        return ClassSubject::firstOrCreate(
            ['class_id' => $classId, 'subject_id' => $subjectId],
            $attributes
        );
    }

    public function updateClassSubject(int $classSubjectId, array $attributes): bool
    {
        if (isset($attributes['status']) && is_string($attributes['status'])) {
            $attributes['status'] = match ($attributes['status']) {
                'inactive', 'paused' => \App\Enums\Constant::CLASS_SUBJECT_STATUS_INACTIVE,
                'completed'          => \App\Enums\Constant::CLASS_SUBJECT_STATUS_COMPLETED,
                default              => \App\Enums\Constant::CLASS_SUBJECT_STATUS_ACTIVE,
            };
        }

        return (bool) ClassSubject::where('id', $classSubjectId)->update($attributes);
    }

    public function deleteByClassSubjectId(int $classSubjectId): int
    {
        return ClassSchedule::where('class_subject_id', $classSubjectId)->delete();
    }
}
