<?php

namespace App\Repositories\Class;

use App\Models\ClassSchedule;
use App\Models\ClassStudent;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SchoolClassRepository implements SchoolClassRepositoryInterface
{
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
                'status'
            )
            ->with([
                'center:id,name,code',
                'classSubjects:id,class_id,subject_id,teacher_id,status',
                'classSubjects.subject:id,name,code',
                'classSubjects.teacher:id,full_name,teacher_code',
            ])
            ->withCount('students');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            if (is_numeric($status)) {
                $query->where('status', (int) $status);
            } else {
                $statusMap = [
                    'inactive'  => 0,
                    'active'    => 1,
                    'completed' => 2,
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

        return $query->latest('id')->paginate($perPage, ['*'], 'page', $page);
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
                'status'
            )
            ->with([
                'center:id,name,code',
                'classSubjects:id,class_id,subject_id,teacher_id,status',
                'classSubjects.subject:id,name,code',
                'classSubjects.teacher:id,full_name,teacher_code',
            ])
            ->withCount('students');

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
     * @param  SchoolClass                                         $schoolClass
     * @param  array<int, array{subject_id: int, teacher_id: int}> $subjectsWithTeachers
     * @return void
     */
    public function syncClassSubjects(SchoolClass $schoolClass, array $subjectsWithTeachers): void
    {
        // Xóa các liên kết class_subjects cũ của lớp
        ClassSubject::where('class_id', $schoolClass->id)->delete();

        // Tạo các liên kết môn học & giáo viên mới
        foreach ($subjectsWithTeachers as $item) {
            if (! empty($item['subject_id']) && ! empty($item['teacher_id'])) {
                ClassSubject::create([
                    'class_id'   => $schoolClass->id,
                    'subject_id' => (int) $item['subject_id'],
                    'teacher_id' => (int) $item['teacher_id'],
                    'status'     => 'active',
                ]);
            }
        }
    }

    /**
     * @param  int                      $classId
     * @return \Generator<int, Student>
     */
    public function getClassStudentsCursor(int $classId): \Generator
    {
        $classStudents = ClassStudent::with('student')
            ->where('class_id', $classId)
            ->where('status', 'active')
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
                'status'      => 'active',
                'enrolled_at' => now(),
                'note'        => $note,
            ]
        );

        return true;
    }

    public function getPaginatedClassStudents(SchoolClass $schoolClass, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $offset = max(0, ($page - 1) * $perPage);
        $query  = $schoolClass->students();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('student_code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($offset > 0) {
            $idQuery = (clone $query)->select('students.id')
            ->latest('students.id')
            ->offset($offset)
            ->limit($perPage);
            $targetIds = $idQuery->pluck('students.id')->toArray();

            if (! empty($targetIds)) {
                return $schoolClass->students()
                    ->withPivot('enrolled_at', 'status', 'note')
                    ->whereIn('students.id', $targetIds)
                    ->latest('students.id')
                    ->paginate($perPage)
                    ->withQueryString();
            }
        }

        return $query->withPivot('enrolled_at', 'status', 'note')
            ->latest('students.id')
            ->paginate($perPage)
            ->withQueryString();
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

    public function codeExists(int $centerId, string $code): bool
    {
        return SchoolClass::where('center_id', $centerId)->where('code', $code)->exists();
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
            'status'
        )->whereIn('center_id', $centerIds)
        ->with(['center:id,name,code'])
        ->withCount('students');

        if ($classIds !== null) {
            $query->whereIn('id', $classIds);
        }

        return $query->get();
    }

    /**
     * @param  array<int>|int|null                                        $centerIds
     * @param  array<string>                                              $columns
     * @return \Illuminate\Database\Eloquent\Collection<int, SchoolClass>
     */
    public function getClassesByCenterIds(array|int|null $centerIds = null, array $columns = ['id', 'name', 'code', 'center_id']): \Illuminate\Database\Eloquent\Collection
    {
        $query = SchoolClass::query()->where('status', 'active');

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
     * @param  int                                                                     $classId
     * @param  string                                                                  $startDate (Y-m-d)
     * @param  string                                                                  $endDate   (Y-m-d)
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSession>
     */
    public function getClassSessionsBetweenDates(int $classId, string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection
    {
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
            ->whereHas('classSubject', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            })
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.subject:id,name,code',
                'teacher:id,full_name,teacher_code',
                'room:id,name',
            ])
            ->whereBetween('session_date', [$startDate, $endDate])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * @param  int                                                                      $classId
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSchedule>
     */
    public function getClassWeeklySchedules(int $classId): \Illuminate\Database\Eloquent\Collection
    {
        return ClassSchedule::query()
            ->select(
                'id',
                'class_subject_id',
                'weekday',
                'start_time',
                'end_time',
                'room_id',
                'status'
            )
            ->whereHas('classSubject', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            })
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,full_name,teacher_code',
                'room:id,name',
            ])
            ->where('status', 'active')
            ->orderBy('weekday')
            ->orderBy('start_time')
            ->get();
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
        ->findOrFail($classId);
    }

    public function getClassesForScheduleForm(?array $allowedCenterIds = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = SchoolClass::query()
            ->select('id', 'center_id', 'name', 'code')
            ->where('status', 'active')
            ->with([
                'classSubjects:id,class_id,subject_id,teacher_id,status',
                'classSubjects.subject:id,name,code,total_sessions,duration_minutes',
                'classSubjects.teacher:id,full_name,teacher_code',
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->orderBy('name')->get();
    }
}
