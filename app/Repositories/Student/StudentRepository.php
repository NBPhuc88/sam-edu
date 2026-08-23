<?php

namespace App\Repositories\Student;

use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StudentRepository implements StudentRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Student
    {
        /** @var Student|null $student */
        $student = Student::where('username', $username)->orWhere('email', $username)->first();

        return $student;
    }

    /**
     * @param  ?int                     $centerId
     * @param  ?int                     $classId
     * @return \Generator<int, Student>
     */
    public function getStudentsCursor(?int $centerId = null, ?int $classId = null): \Generator
    {
        $query = Student::query()->orderBy('id', 'asc');

        if ($centerId !== null) {
            $query->where('center_id', $centerId);
        }

        if ($classId !== null && $classId > 0) {
            $query->whereHas('classStudents', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            });
        }

        foreach ($query->cursor() as $student) {
            /** @var Student $student */
            yield $student;
        }
    }

    public function findByCode(string $studentCode): ?Student
    {
        /** @var Student|null $student */
        $student = Student::where('student_code', $studentCode)->first();

        return $student;
    }

    /**
     * @param string               $studentCode
     * @param array<string, mixed> $data
     */
    public function updateOrCreateByCode(string $studentCode, array $data): Student
    {
        /** @var Student $student */
        $student = Student::updateOrCreate(
            ['student_code' => $studentCode],
            $data
        );

        return $student;
    }

    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  array<int>|null      $allowedClassIds
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?array $allowedClassIds = null
    ): LengthAwarePaginator {
        $query = Student::query()
            ->select(
                'id',
                'student_code',
                'full_name',
                'username',
                'email',
                'phone',
                'gender',
                'date_of_birth',
                'parent_name',
                'parent_phone',
                'parent_relationship',
                'status',
                'center_id'
            )
            ->with([
                'center:id,name,code',
                'classes:id,name,code'
            ]);

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($allowedClassIds !== null) {
            $query->whereHas('classStudents', function ($q) use ($allowedClassIds) {
                $q->whereIn('class_id', $allowedClassIds);
            });
        }

        if ($classId !== null && $classId > 0) {
            $query->whereHas('classStudents', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            });
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                    ->orWhere('student_code', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('username', 'like', "%{$term}%")
                    ->orWhere('parent_name', 'like', "%{$term}%")
                    ->orWhere('parent_phone', 'like', "%{$term}%")
                    ->orWhereHas('center', function ($cq) use ($term) {
                        $cq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    })
                    ->orWhereHas('classes', function ($clq) use ($term) {
                        $clq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->deferredPaginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Student|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Student
    {
        $query = Student::query()
            ->with([
                'center:id,name,code',
                'classes:id,name,code,center_id',
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return Student
     */
    public function create(array $data): Student
    {
        return Student::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Student
     */
    public function update(int $id, array $data): Student
    {
        $student = Student::findOrFail($id);
        $student->update($data);

        return $student;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $student = Student::findOrFail($id);

        return (bool) $student->delete();
    }

    public function count(): int
    {
        return Student::count();
    }

    /**
     * @param array<int, int> $centerIds
     */
    public function countByCenterIds(array $centerIds): int
    {
        return Student::whereIn('center_id', $centerIds)->count();
    }

    public function codeExists(int $centerId, string $code): bool
    {
        return Student::where('center_id', $centerId)->where('student_code', $code)->exists();
    }

    /**
     * @param int             $year
     * @param int             $month
     * @param array<int, int> $centerIds
     */
    public function countInYearMonthAndCenterIds(int $year, int $month, array $centerIds = []): int
    {
        $query = Student::whereYear('created_at', $year)
            ->whereMonth('created_at', $month);

        if (! empty($centerIds)) {
            $query->whereIn('center_id', $centerIds);
        }

        return $query->count();
    }

    public function getActiveStudents(?array $allowedCenterIds = null, array $columns = ['id', 'full_name', 'student_code', 'phone', 'center_id']): \Illuminate\Database\Eloquent\Collection
    {
        $query = Student::select($columns)->where('status', 1);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->orderBy('full_name')->get();
    }

    public function syncClasses(Student $student, array $classIds, array $pivotDefaults = []): void
    {
        $syncData     = [];
        $defaultPivot = array_merge([
            'status'      => 'active',
            'enrolled_at' => now(),
        ], $pivotDefaults);

        foreach ($classIds as $classId) {
            $syncData[$classId] = $defaultPivot;
        }

        $student->classes()->sync($syncData);
    }

    public function attachClasses(Student $student, array $classIds, array $pivotDefaults = []): void
    {
        $defaultPivot = array_merge([
            'status'      => 'active',
            'enrolled_at' => now(),
        ], $pivotDefaults);

        foreach ($classIds as $classId) {
            if (! $student->classes()->where('classes.id', $classId)->exists()) {
                $student->classes()->attach($classId, $defaultPivot);
            }
        }
    }

    public function detachClass(Student $student, int $classId): bool
    {
        return (bool) $student->classes()->detach($classId);
    }

    /**
     * @param  int                                                                     $studentId
     * @param  string                                                                  $startDate
     * @param  string                                                                  $endDate
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSession>
     */
    public function getStudentSessionsBetweenDates(int $studentId, string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection
    {
        $classIds = \App\Models\ClassStudent::where('student_id', $studentId)
            ->pluck('class_id')
            ->toArray();

        if (empty($classIds)) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        return \App\Models\ClassSession::query()
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
            ->whereHas('classSubject', function ($csq) use ($classIds) {
                $csq->whereIn('class_id', $classIds);
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
     * @param  int                            $studentId
     * @return \Illuminate\Support\Collection
     */
    public function getStudentWeeklySchedules(int $studentId): \Illuminate\Support\Collection
    {
        $classIds = \App\Models\ClassStudent::where('student_id', $studentId)
            ->pluck('class_id')
            ->toArray();

        if (empty($classIds)) {
            return collect();
        }

        $schedules = \App\Models\ClassSchedule::query()
            ->whereHas('classSubject', function ($q) use ($classIds) {
                $q->whereIn('class_id', $classIds);
            })
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.schoolClass' => function ($cq) {
                    $cq->select('id', 'center_id', 'name', 'code')->withCount('students');
                },
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,full_name,teacher_code',
                'room:id,name,code,capacity,location',
            ])
            ->where('status', 'active')
            ->get();

        $result = collect();

        foreach ($schedules as $schedule) {
            $weeks = is_array($schedule->weeks) ? $schedule->weeks : (json_decode($schedule->weeks ?? '[]', true) ?? []);

            foreach ($weeks as $weekday => $slots) {
                if (! is_array($slots)) {
                    continue;
                }

                foreach ($slots as $slot) {
                    if (! is_array($slot) || count($slot) < 2) {
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
                        'class_subject'    => $schedule->classSubject,
                        'room'             => $schedule->room,
                    ]);
                }
            }
        }

        return $result->sortBy(['weekday', 'start_time'])->values();
    }
}
