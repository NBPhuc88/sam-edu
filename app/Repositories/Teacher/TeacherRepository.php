<?php

namespace App\Repositories\Teacher;

use App\Enums\Constant;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\Teacher;
use Generator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;

class TeacherRepository implements TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher
    {
        $isMysql = DB::connection()->getDriverName() === 'mysql';

        /** @var Teacher|null $teacher */
        $teacher = Teacher::where(function ($query) use ($username, $isMysql) {
            if ($isMysql) {
                $query->whereRaw('BINARY username = ?', [$username]);
            } else {
                $query->where('username', $username);
            }
            $query->orWhere('email', $username);
        })->first();

        return $teacher;
    }

    /**
     * @param  ?int                    $centerId
     * @return Generator<int, Teacher>
     */
    public function getTeachersCursor(?int $centerId = null): Generator
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
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
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
     * @param  int                           $teacherId
     * @param  string                        $startDate (Y-m-d)
     * @param  string                        $endDate   (Y-m-d)
     * @return Collection<int, ClassSession>
     */
    public function getTeacherSessionsBetweenDates(int $teacherId, string $startDate, string $endDate): Collection
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
                    })
                    ->orWhereHas('reschedules', function ($rq) use ($teacherId) {
                        $rq->where('old_teacher_id', $teacherId)
                            ->orWhere('new_teacher_id', $teacherId);
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
                'reschedules.oldTeacher:id,full_name,teacher_code,phone',
                'reschedules.newTeacher:id,full_name,teacher_code,phone',
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
     * @param  int               $teacherId
     * @return SupportCollection
     */
    public function getTeacherWeeklySchedules(int $teacherId): SupportCollection
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

    public function getActiveTeachers(?array $allowedCenterIds = null, array $columns = ['id', 'full_name', 'teacher_code', 'center_id']): Collection
    {
        $query = Teacher::select($columns)
            ->where('status', 'active')
            ->with([
                'classSubjects' => function ($q) {
                    $q->where('status', 'active')
                        ->with([
                            'schoolClass:id,name,code',
                            'subject:id,name,code',
                            'classSchedules' => function ($sq) {
                                $sq->where('status', 'active')->select('id', 'class_subject_id', 'weeks', 'extra_days', 'room_id', 'status');
                            },
                        ]);
                },
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->orderBy('full_name')->get();
    }

    /**
     * @param  int                                                                                            $teacherId
     * @param  ?string                                                                                        $startDate
     * @param  ?string                                                                                        $endDate
     * @param  ?int                                                                                           $perPage
     * @param  int                                                                                            $page
     * @return array{sessions: Collection<int, ClassSession>|LengthAwarePaginator, stats: array<string, int>}
     */
    public function getTeacherSessionStats(
        int $teacherId,
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $perPage = null,
        int $page = 1
    ): array {
        $query = ClassSession::query()
            ->where('teacher_id', $teacherId);

        if ($startDate !== null && $endDate !== null) {
            $query->whereBetween('session_date', [$startDate, $endDate]);
        }

        $statusCounts = (clone $query)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $stats = [
            'total'       => (int) $statusCounts->sum(),
            'completed'   => (int) ($statusCounts->get('completed') ?? 0),
            'scheduled'   => (int) ($statusCounts->get('scheduled') ?? 0),
            'cancelled'   => (int) ($statusCounts->get('cancelled') ?? 0),
            'rescheduled' => (int) ($statusCounts->get('rescheduled') ?? 0),
        ];

        $sessionsQuery = $query
            ->with([
                'classSubject.schoolClass:id,name,code,center_id',
                'classSubject.subject:id,name,code',
                'room:id,name',
            ])
            ->orderBy('session_date', 'desc')
            ->orderBy('start_time', 'desc');

        if ($perPage !== null) {
            $sessions = $sessionsQuery->deferredPaginate($perPage, ['*'], 'page', $page)->withQueryString();
        } else {
            $sessions = $sessionsQuery->get();
        }

        return [
            'sessions' => $sessions,
            'stats'    => $stats,
        ];
    }
}
