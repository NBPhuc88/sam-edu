<?php

namespace App\Repositories\Class;

use App\Enums\Constant;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassStudent;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SchoolClassRepository implements SchoolClassRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?int                 $teacherId
     * @param  ?int                 $studentId
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?int $teacherId = null,
        ?int $studentId = null
    ): LengthAwarePaginator {
        $query = SchoolClass::query()
            ->select(
                'id',
                'center_id',
                'name',
                'code',
                'description',
                'max_students',
                'start_date',
                'end_date',
                'status',
                'total_tuition_fee'
            )
            ->with([
                'center:id,name,code',
                'classSubjects:id,class_id,subject_id,teacher_id,status,tuition_fee',
                'classSubjects.subject:id,name,code,tuition_fee',
                'classSubjects.teacher:id,full_name,teacher_code',
            ])
            ->withCount([
                'students' => function ($q) {
                    $q->where('class_students.status', Constant::CLASS_STUDENT_STATUS_ACTIVE)
                        ->whereNull('class_students.left_at');
                },
            ]);

        if ($studentId !== null) {
            $query->whereHas('students', function ($q) use ($studentId) {
                $q->where('students.id', $studentId);
            });
        }

        if ($teacherId !== null) {
            $query->whereHas('classSubjects', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            });
        }

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($status !== null && $status !== '' && $status !== '') {
            if (is_numeric($status)) {
                $query->where('status', (int) $status);
            } else {
                $statusMap = [
                    'inactive'  => Constant::CLASS_STATUS_INACTIVE,
                    'active'    => Constant::CLASS_STATUS_ACTIVE,
                    'completed' => Constant::CLASS_STATUS_COMPLETED,
                    'closed'    => Constant::CLASS_STATUS_CLOSED,
                ];

                if (isset($statusMap[$status])) {
                    $query->where('status', $statusMap[$status]);
                }
            }
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhereHas('classSubjects.subject', function ($sq) use ($term) {
                        $sq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    })
                    ->orWhereHas('classSubjects.teacher', function ($tq) use ($term) {
                        $tq->where('full_name', 'like', "%{$term}%")
                            ->orWhere('teacher_code', 'like', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->paginate($perPage, ['*'], 'page', $page)->withQueryString();
    }

    /**
     * @param  int              $id
     * @param  array<int>|null  $allowedCenterIds
     * @return SchoolClass|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?SchoolClass
    {
        $query = SchoolClass::query()
            ->select(
                'id',
                'center_id',
                'name',
                'code',
                'description',
                'max_students',
                'start_date',
                'end_date',
                'status',
                'total_tuition_fee'
            )
            ->with([
                'center:id,name,code',
                'classSubjects:id,class_id,subject_id,teacher_id,status,tuition_fee',
                'classSubjects.subject:id,name,code,tuition_fee',
                'classSubjects.teacher:id,full_name,teacher_code',
            ])
            ->withCount([
                'students' => function ($q) {
                    $q->where('class_students.status', Constant::CLASS_STUDENT_STATUS_ACTIVE)
                        ->whereNull('class_students.left_at');
                },
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    public function findById(int $classId): ?SchoolClass
    {
        /** @var SchoolClass|null $class */
        $class = SchoolClass::find($classId);

        return $class;
    }

    public function findByCode(string $code): ?SchoolClass
    {
        /** @var SchoolClass|null $class */
        $class = SchoolClass::where('code', $code)->first();

        return $class;
    }

    /**
     * @param  array<string, mixed> $data
     * @return SchoolClass
     */
    public function create(array $data): SchoolClass
    {
        return SchoolClass::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return SchoolClass
     */
    public function update(int $id, array $data): SchoolClass
    {
        $schoolClass = SchoolClass::findOrFail($id);
        $schoolClass->update($data);

        return $schoolClass;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $schoolClass = SchoolClass::findOrFail($id);

        return (bool) $schoolClass->delete();
    }

    /**
     * @param  SchoolClass                                                                              $schoolClass
     * @param  array<int, array{subject_id: int, teacher_id: int, tuition_fee?: float|int|string|null}> $subjectsWithTeachers
     * @return void
     */
    public function syncClassSubjects(SchoolClass $schoolClass, array $subjectsWithTeachers): void
    {
        // 1. Lọc và loại bỏ trùng lặp theo subject_id
        $uniqueSubjects = [];

        foreach ($subjectsWithTeachers as $item) {
            if (! empty($item['subject_id']) && ! empty($item['teacher_id'])) {
                $subjectId                  = (int) $item['subject_id'];
                $teacherId                  = (int) $item['teacher_id'];
                $tuitionFee                 = isset($item['tuition_fee']) && $item['tuition_fee'] !== '' ? (float) $item['tuition_fee'] : null;
                $uniqueSubjects[$subjectId] = [
                    'teacher_id'  => $teacherId,
                    'tuition_fee' => $tuitionFee,
                ];
            }
        }

        $activeSubjectIds = array_keys($uniqueSubjects);

        // 2. Xóa các môn học không còn được phân công cho lớp này
        if (! empty($activeSubjectIds)) {
            ClassSubject::where('class_id', $schoolClass->id)
                ->whereNotIn('subject_id', $activeSubjectIds)
                ->delete();
        } else {
            ClassSubject::where('class_id', $schoolClass->id)->delete();
        }

        // 3. Cập nhật hoặc tạo mới (updateOrCreate) để bảo toàn ID và không gây Duplicate Entry
        foreach ($uniqueSubjects as $subjectId => $data) {
            ClassSubject::updateOrCreate(
                [
                    'class_id'   => $schoolClass->id,
                    'subject_id' => $subjectId,
                ],
                [
                    'teacher_id'  => $data['teacher_id'],
                    'tuition_fee' => $data['tuition_fee'],
                    'status'      => Constant::CLASS_SUBJECT_STATUS_ACTIVE,
                ]
            );
        }

        // 4. Tự động tính và cập nhật cột total_tuition_fee của lớp
        $totalTuitionFee = (float) ClassSubject::where('class_id', $schoolClass->id)->sum('tuition_fee');
        $schoolClass->update(['total_tuition_fee' => $totalTuitionFee]);
    }

    /**
     * @param  int                      $classId
     * @return \Generator<int, Student>
     */
    public function getClassStudentsCursor(int $classId): \Generator
    {
        $classStudents = ClassStudent::with('student')
            ->where('class_id', $classId)
            ->where('status', Constant::CLASS_STUDENT_STATUS_ACTIVE)
            ->orderBy('id', 'asc');

        foreach ($classStudents->cursor() as $classStudent) {
            /** @var ClassStudent $classStudent */
            if ($classStudent->student) {
                yield $classStudent->student;
            }
        }
    }

    public function attachStudent(int $classId, int $studentId, ?string $note = null): bool
    {
        ClassStudent::updateOrCreate(
            [
                'class_id'   => $classId,
                'student_id' => $studentId,
            ],
            [
                'status'      => Constant::CLASS_STUDENT_STATUS_ACTIVE,
                'enrolled_at' => now(),
                'note'        => $note,
            ]
        );

        return true;
    }

    public function getPaginatedClassStudents(SchoolClass $schoolClass, ?string $search = null, int $perPage = Constant::DEFAULT_PER_PAGE, int $page = Constant::DEFAULT_PAGE): LengthAwarePaginator
    {
        $query = $schoolClass->students()
            ->withPivot('enrolled_at', 'status', 'note')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('students.full_name', 'like', "%{$search}%")
                        ->orWhere('students.student_code', 'like', "%{$search}%")
                        ->orWhere('students.phone', 'like', "%{$search}%")
                        ->orWhere('students.email', 'like', "%{$search}%");
                });
            })
            ->latest('students.id');

        return $query->paginate($perPage, ['*'], 'page', $page)->withQueryString();
    }

    public function count(): int
    {
        return SchoolClass::count();
    }

    /**
     * @param array<int, int> $centerIds
     */
    public function countByCenterIds(array $centerIds): int
    {
        return SchoolClass::whereIn('center_id', $centerIds)->count();
    }

    /**
     * @param array<int, int> $centerIds
     */
    public function countActiveByCenterIds(array $centerIds): int
    {
        return SchoolClass::whereIn('center_id', $centerIds)
            ->where('status', Constant::CLASS_STATUS_ACTIVE)
            ->count();
    }

    public function codeExists(string $code): bool
    {
        return SchoolClass::withTrashed()->where('code', $code)->exists();
    }

    public function nextId(): int
    {
        return (int) (SchoolClass::withTrashed()->max('id') ?? 0) + 1;
    }

    /**
     * @param int             $year
     * @param int             $month
     * @param array<int, int> $centerIds
     */
    public function countInYearMonthAndCenterIds(int $year, int $month, array $centerIds = []): int
    {
        $query = SchoolClass::whereYear('created_at', $year)
            ->whereMonth('created_at', $month);

        if (! empty($centerIds)) {
            $query->whereIn('center_id', $centerIds);
        }

        return $query->count();
    }

    /**
     * @param  array<int, int>                                            $centerIds
     * @param  array<int, int>|null                                       $classIds
     * @return \Illuminate\Database\Eloquent\Collection<int, SchoolClass>
     */
    public function getClassesWithStudentCount(array $centerIds, ?array $classIds = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = SchoolClass::select(
            'id',
            'center_id',
            'name',
            'code',
            'max_students',
            'status'
        )->whereIn('center_id', $centerIds)
        ->with(['center:id,name,code'])
        ->withCount([
            'students' => function ($q) {
                $q->where('class_students.status', Constant::CLASS_STUDENT_STATUS_ACTIVE)
                    ->whereNull('class_students.left_at');
            },
        ]);

        if ($classIds !== null) {
            $query->whereIn('id', $classIds);
        }

        return $query->get();
    }

    /**
     * @param  array<int, int>      $centerIds
     * @param  array<int, int>|null $classIds
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginateClassesWithStudentCount(
        array $centerIds,
        ?array $classIds = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): LengthAwarePaginator {
        $query = SchoolClass::select(
            'id',
            'center_id',
            'name',
            'code',
            'max_students',
            'status'
        )->whereIn('center_id', $centerIds)
        ->with(['center:id,name,code'])
        ->withCount([
            'students' => function ($q) {
                $q->where('class_students.status', Constant::CLASS_STUDENT_STATUS_ACTIVE)
                    ->whereNull('class_students.left_at');
            },
        ]);

        if ($classIds !== null) {
            $query->whereIn('id', $classIds);
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  array<int>|int|null                                        $centerIds
     * @param  array<string>                                              $columns
     * @return \Illuminate\Database\Eloquent\Collection<int, SchoolClass>
     */
    public function getClassesByCenterIds(array|int|null $centerIds = null, array $columns = ['id', 'name', 'code', 'center_id']): \Illuminate\Database\Eloquent\Collection
    {
        $query = SchoolClass::query()->where('status', Constant::CLASS_STATUS_ACTIVE);

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        return $query->orderBy('name')->get($columns);
    }

    /**
     * @param  int                           $classId
     * @param  string                        $startDate (Y-m-d)
     * @param  string                        $endDate   (Y-m-d)
     * @return Collection<int, ClassSession>
     */
    public function getClassSessionsBetweenDates(int $classId, string $startDate, string $endDate): Collection
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
            ->whereHas('classSubject', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            })
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,full_name,teacher_code',
                'teacher:id,full_name,teacher_code',
                'room:id,name',
                'reschedules' => function ($q) {
                    $q->orderBy('changed_at', 'desc');
                },
                'reschedules.oldRoom:id,name',
                'reschedules.newRoom:id,name',
                'reschedules.oldTeacher:id,full_name,teacher_code',
                'reschedules.newTeacher:id,full_name,teacher_code',
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
     * @param  int                            $classId
     * @return \Illuminate\Support\Collection
     */
    public function getClassWeeklySchedules(int $classId): \Illuminate\Support\Collection
    {
        $schedules = ClassSchedule::query()
            ->whereHas('classSubject', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            })
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,full_name,teacher_code',
                'room:id,name',
            ])
            ->where('status', Constant::SCHEDULE_STATUS_ACTIVE)
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
                        'class_subject'    => $schedule->classSubject,
                        'classSubject'     => $schedule->classSubject,
                        'room'             => $schedule->room,
                    ]);
                }
            }
        }

        return $result->sortBy(['weekday', 'start_time'])->values();
    }

    /**
     * @param  int         $classId
     * @return SchoolClass
     */
    public function findWithCenter(int $classId): SchoolClass
    {
        return SchoolClass::select(
            'id',
            'center_id',
            'name',
            'code',
            'description',
            'max_students',
            'start_date',
            'end_date',
            'status'
        )
        ->with('center:id,name,code')
        ->withCount([
            'students' => function ($q) {
                $q->where('class_students.status', Constant::CLASS_STUDENT_STATUS_ACTIVE)
                    ->whereNull('class_students.left_at');
            },
        ])
        ->findOrFail($classId);
    }

    public function getClassesForScheduleForm(?array $allowedCenterIds = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = SchoolClass::query()
            ->select('id', 'center_id', 'name', 'code', 'start_date', 'end_date')
            ->where('status', Constant::CLASS_STATUS_ACTIVE)
            ->with([
                'classSubjects:id,class_id,subject_id,teacher_id,start_date,end_date,status',
                'classSubjects.subject:id,name,code,total_sessions,duration_minutes',
                'classSubjects.teacher:id,full_name,teacher_code',
                'classSubjects.classSchedules:id,class_subject_id,weeks,room_id,status,off_days,extra_days',
                'classSubjects.classSchedules.room:id,name',
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->orderBy('name')->get();
    }

    public function detachStudent(int $classId, int $studentId): bool
    {
        return (bool) ClassStudent::where('class_id', $classId)
            ->where('student_id', $studentId)
            ->delete();
    }

    public function updateClassStudentStatus(int $classId, int $studentId, int|string $status, ?string $note = null): bool
    {
        $numericStatus = is_numeric($status) ? (int) $status : match ((string) $status) {
            'completed'   => Constant::CLASS_STUDENT_STATUS_COMPLETED,
            'transferred' => Constant::CLASS_STUDENT_STATUS_TRANSFERRED,
            'left'        => Constant::CLASS_STUDENT_STATUS_LEFT,
            default       => Constant::CLASS_STUDENT_STATUS_ACTIVE,
        };

        $updateData = [
            'status' => $numericStatus,
        ];

        if (in_array($numericStatus, [Constant::CLASS_STUDENT_STATUS_LEFT, Constant::CLASS_STUDENT_STATUS_TRANSFERRED, Constant::CLASS_STUDENT_STATUS_COMPLETED], true)) {
            $updateData['left_at'] = now();
        } else {
            $updateData['left_at'] = null;
        }

        if ($note !== null) {
            $updateData['note'] = $note;
        }

        return (bool) ClassStudent::where('class_id', $classId)
            ->where('student_id', $studentId)
            ->update($updateData);
    }

    public function attachStudents(int $classId, array $studentIds): int
    {
        $added = 0;

        foreach ($studentIds as $studentId) {
            ClassStudent::updateOrCreate(
                [
                    'class_id'   => $classId,
                    'student_id' => $studentId,
                ],
                [
                    'status'      => Constant::CLASS_STUDENT_STATUS_ACTIVE,
                    'enrolled_at' => now(),
                ]
            );
            $added++;
        }

        return $added;
    }

    public function getAvailableStudentsForClass(int $classId, int $centerId, ?string $search = null): \Illuminate\Database\Eloquent\Collection
    {
        $enrolledStudentIds = ClassStudent::where('class_id', $classId)->pluck('student_id')->toArray();

        $query = Student::query()
            ->select('id', 'full_name', 'student_code', 'phone', 'email', 'status', 'center_id')
            ->where('center_id', $centerId)
            ->where('status', Constant::STUDENT_STATUS_ACTIVE)
            ->withExists([
                'tuitions as has_tuition' => function ($q) use ($classId) {
                    $q->where('class_id', $classId);
                },
            ]);

        if (! empty($enrolledStudentIds)) {
            $query->whereNotIn('id', $enrolledStudentIds);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                    ->orWhere('student_code', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%");
            });
        }

        return $query->orderBy('full_name')->take(50)->get();
    }

    /**
     * @param  int  $teacherId
     * @param  int  $classId
     * @return bool
     */
    public function isTeacherAssignedToClass(int $teacherId, int $classId): bool
    {
        return SchoolClass::where('id', $classId)
            ->whereHas('classSubjects', fn ($q) => $q->where('teacher_id', $teacherId))
            ->exists();
    }

    /**
     * @param  array<int>                                                 $ids
     * @param  array<string>                                              $columns
     * @return \Illuminate\Database\Eloquent\Collection<int, SchoolClass>
     */
    public function getByIds(array $ids, array $columns = ['*']): \Illuminate\Database\Eloquent\Collection
    {
        return SchoolClass::whereIn('id', $ids)->get($columns);
    }
}
