<?php

namespace App\Repositories\Teacher;

use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TeacherRepository implements TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher
    {
        /** @var Teacher|null $teacher */
        $teacher = Teacher::where('username', $username)->orWhere('email', $username)->first();

        return $teacher;
    }

    /**
     * @param  ?int                     $centerId
     * @return \Generator<int, Teacher>
     */
    public function getTeachersCursor(?int $centerId = null): \Generator
    {
        $query = Teacher::query()->orderBy('id', 'asc');

        if ($centerId !== null) {
            $query->where('center_id', $centerId);
        }

        foreach ($query->cursor() as $teacher) {
            /** @var Teacher $teacher */
            yield $teacher;
        }
    }

    public function findByCode(string $teacherCode): ?Teacher
    {
        /** @var Teacher|null $teacher */
        $teacher = Teacher::where('teacher_code', $teacherCode)->first();

        return $teacher;
    }

    /**
     * @param string               $teacherCode
     * @param array<string, mixed> $data
     */
    public function updateOrCreateByCode(string $teacherCode, array $data): Teacher
    {
        /** @var Teacher $teacher */
        $teacher = Teacher::updateOrCreate(
            ['teacher_code' => $teacherCode],
            $data
        );

        return $teacher;
    }

    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = Teacher::query()
            ->select(
                'id',
                'teacher_code',
                'full_name',
                'email',
                'phone',
                'specialization',
                'gender',
                'date_of_birth',
                'hire_date',
                'status',
                'center_id'
            )
            ->with('center:id,name,code');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                    ->orWhere('teacher_code', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('username', 'like', "%{$term}%")
                    ->orWhere('specialization', 'like', "%{$term}%")
                    ->orWhereHas('center', function ($cq) use ($term) {
                        $cq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->deferredPaginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Teacher|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Teacher
    {
        $query = Teacher::query()
            ->select(
                'id',
                'teacher_code',
                'full_name',
                'username',
                'email',
                'phone',
                'specialization',
                'gender',
                'date_of_birth',
                'hire_date',
                'status',
                'center_id'
            )
            ->with('center:id,name,code');

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return Teacher
     */
    public function create(array $data): Teacher
    {
        return Teacher::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Teacher
     */
    public function update(int $id, array $data): Teacher
    {
        $teacher = Teacher::findOrFail($id);
        $teacher->update($data);

        return $teacher;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            $teacher = Teacher::findOrFail($id);

            // Gỡ phân công giảng dạy
            \App\Models\ClassSubject::where('teacher_id', $id)->delete();
            \App\Models\ClassSession::where('teacher_id', $id)->update(['teacher_id' => null]);
            \App\Models\Exam::where('created_by_teacher_id', $id)->update(['created_by_teacher_id' => null]);

            return (bool) $teacher->delete();
        });
    }

    public function count(): int
    {
        return Teacher::count();
    }

    /**
     * @param array<int, int> $centerIds
     */
    public function countByCenterIds(array $centerIds): int
    {
        return Teacher::whereIn('center_id', $centerIds)->count();
    }

    public function codeExists(int $centerId, string $code): bool
    {
        return Teacher::where('center_id', $centerId)->where('teacher_code', $code)->exists();
    }

    /**
     * @param int             $year
     * @param int             $month
     * @param array<int, int> $centerIds
     */
    public function countInYearMonthAndCenterIds(int $year, int $month, array $centerIds = []): int
    {
        $query = Teacher::whereYear('created_at', $year)
            ->whereMonth('created_at', $month);

        if (! empty($centerIds)) {
            $query->whereIn('center_id', $centerIds);
        }

        return $query->count();
    }

    /**
     * @param  int                                                                     $teacherId
     * @param  string                                                                  $startDate (Y-m-d)
     * @param  string                                                                  $endDate   (Y-m-d)
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSession>
     */
    public function getTeacherSessionsBetweenDates(int $teacherId, string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection
    {
        return ClassSession::query()
            ->select(
                'id',
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
            ->where(function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId)
                    ->orWhereHas('classSubject', function ($csq) use ($teacherId) {
                        $csq->where('teacher_id', $teacherId);
                    });
            })
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.schoolClass' => function ($cq) {
                    $cq->select(
                        'id',
                        'center_id',
                        'name',
                        'code'
                    )->withCount('students');
                },
                'classSubject.subject:id,name,code,total_sessions,duration_minutes',
                'teacher:id,full_name,teacher_code,phone',
                'room:id,name',
                'reschedules' => function ($q) {
                    $q->orderBy('changed_at', 'desc');
                },
                'reschedules.oldRoom:id,name',
                'reschedules.newRoom:id,name',
            ])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('session_date', [$startDate, $endDate])
                    ->orWhereHas('reschedules', function ($rq) use ($startDate, $endDate) {
                        $rq->whereBetween('old_date', [$startDate, $endDate]);
                    });
            })
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * @param  int                            $teacherId
     * @return \Illuminate\Support\Collection
     */
    public function getTeacherWeeklySchedules(int $teacherId): \Illuminate\Support\Collection
    {
        $schedules = ClassSchedule::query()
            ->whereHas('classSubject', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.schoolClass' => function ($cq) {
                    $cq->select(
                        'id',
                        'center_id',
                        'name',
                        'code'
                    )->withCount('students');
                },
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,full_name,teacher_code',
                'room:id,name',
            ])
            ->where('status', 'active')
            ->get();

        $result = collect();

        foreach ($schedules as $schedule) {
            $weeks = is_array($schedule->weeks) ? $schedule->weeks : (json_decode($schedule->weeks ?? '[]', true) ?? []);

            foreach ($weeks as $weekday => $slots) {
                if (!is_array($slots)) {
                    continue;
                }

                foreach ($slots as $slot) {
                    if (!is_array($slot) || count($slot) < 2) {
                        continue;
                    }

                    $result->push((object) [
                        'id'               => $schedule->id,
                        'class_subject_id' => $schedule->class_subject_id,
                        'weekday'          => (int) $weekday,
                        'start_time'       => $slot[0],
                        'end_time'         => $slot[1],
                        'room_id'          => $schedule->room_id,
                        'status'           => $schedule->status,
                        'classSubject'     => $schedule->classSubject,
                        'room'             => $schedule->room,
                    ]);
                }
            }
        }

        return $result->sortBy(['weekday', 'start_time'])->values();
    }

    public function getActiveTeachers(?array $allowedCenterIds = null, array $columns = ['id', 'full_name', 'teacher_code', 'center_id']): \Illuminate\Database\Eloquent\Collection
    {
        $query = Teacher::select($columns)->where('status', 'active');

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->orderBy('full_name')->get();
    }
}
