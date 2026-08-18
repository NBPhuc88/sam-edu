<?php

namespace App\Repositories\Teacher;

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
        $query = Teacher::query()->with('center');

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

        return $query->latest('id')->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Teacher|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Teacher
    {
        $query = Teacher::query()->with('center');

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
        $teacher = Teacher::findOrFail($id);

        return (bool) $teacher->delete();
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
        return \App\Models\ClassSession::query()
            ->where(function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId)
                    ->orWhereHas('classSubject', function ($csq) use ($teacherId) {
                        $csq->where('teacher_id', $teacherId);
                    });
            })
            ->with([
                'classSubject.schoolClass' => function ($cq) {
                    $cq->withCount('students');
                },
                'classSubject.subject:id,name,code,total_sessions,duration_minutes',
                'teacher:id,full_name,teacher_code,phone',
                'room.equipments',
            ])
            ->whereBetween('session_date', [$startDate, $endDate])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * @param  int                                                                      $teacherId
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSchedule>
     */
    public function getTeacherWeeklySchedules(int $teacherId): \Illuminate\Database\Eloquent\Collection
    {
        return \App\Models\ClassSchedule::query()
            ->whereHas('classSubject', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->with([
                'classSubject.schoolClass' => function ($cq) {
                    $cq->withCount('students');
                },
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,full_name,teacher_code',
                'room.equipments',
            ])
            ->where('status', 'active')
            ->orderBy('weekday')
            ->orderBy('start_time')
            ->get();
    }
}
