<?php

namespace App\Repositories\Session;

use App\Models\ClassSession;
use App\Models\SessionReschedule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ClassSessionRepository implements ClassSessionRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?int                 $teacherId
     * @param  ?int                 $roomId
     * @param  ?string              $sessionDate
     * @param  ?string              $dateFrom
     * @param  ?string              $dateTo
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
        ?int $roomId = null,
        ?string $sessionDate = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $status = null,
        int $perPage = 20,
        int $page = 1
    ): LengthAwarePaginator {
        $query = ClassSession::query()
            ->select(
                'id',
                'class_subject_id',
                'class_schedule_id',
                'teacher_id',
                'room_id',
                'session_date',
                'start_time',
                'end_time',
                'topic',
                'status',
                'note'
            )
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.schoolClass:id,center_id,name,code',
                'classSubject.schoolClass.center:id,name,code',
                'classSubject.subject:id,name,code',
                'teacher:id,full_name,teacher_code',
                'room:id,name,code',
            ])
            ->withCount([
                'attendances',
                'attendances as present_attendances_count' => function ($q) {
                    $q->where('status', 'present');
                },
            ]);

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
            $query->where('teacher_id', $teacherId);
        }

        if ($roomId !== null) {
            $query->where('room_id', $roomId);
        }

        if ($sessionDate !== null && $sessionDate !== '') {
            $query->whereDate('session_date', $sessionDate);
        }

        if ($dateFrom !== null && $dateFrom !== '') {
            $query->whereDate('session_date', '>=', $dateFrom);
        }

        if ($dateTo !== null && $dateTo !== '') {
            $query->whereDate('session_date', '<=', $dateTo);
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $term = '%' . trim($search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('topic', 'like', $term)
                    ->orWhere('note', 'like', $term)
                    ->orWhereHas('classSubject.schoolClass', function ($sq) use ($term) {
                        $sq->where('name', 'like', $term)
                            ->orWhere('code', 'like', $term);
                    })
                    ->orWhereHas('classSubject.subject', function ($sq) use ($term) {
                        $sq->where('name', 'like', $term)
                            ->orWhere('code', 'like', $term);
                    })
                    ->orWhereHas('teacher', function ($sq) use ($term) {
                        $sq->where('full_name', 'like', $term)
                            ->orWhere('teacher_code', 'like', $term);
                    })
                    ->orWhereHas('room', function ($sq) use ($term) {
                        $sq->where('name', 'like', $term);
                    });
            });
        }

        return $query->orderBy('session_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int           $id
     * @return ?ClassSession
     */
    public function findById(int $id): ?ClassSession
    {
        return ClassSession::find($id);
    }

    /**
     * @param  int           $id
     * @return ?ClassSession
     */
    public function findWithDetails(int $id): ?ClassSession
    {
        return ClassSession::query()
            ->select(
                'id',
                'class_subject_id',
                'class_schedule_id',
                'teacher_id',
                'room_id',
                'session_date',
                'start_time',
                'end_time',
                'topic',
                'status',
                'note'
            )
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.schoolClass:id,center_id,name,code',
                'classSubject.schoolClass.classStudents:id,class_id,student_id,status',
                'classSubject.schoolClass.classStudents.student:id,student_code,full_name,email,phone',
                'classSubject.schoolClass.center:id,name,code',
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,full_name,teacher_code',
                'classSchedule:id,weeks,room_id',
                'teacher:id,full_name,teacher_code',
                'room:id,name,code',
                'attendances:id,session_id,student_id,status,note,marked_at',
                'attendances.student:id,student_code,full_name,email,phone',
                'reschedules.oldRoom:id,name',
                'reschedules.newRoom:id,name',
                'reschedules.changedByAdmin:id,full_name,username',
                'reschedules.changedByTeacher:id,full_name,teacher_code',
            ])->find($id);
    }

    /**
     * @param  int          $id
     * @param  array        $data
     * @return ClassSession
     */
    public function update(int $id, array $data): ClassSession
    {
        $session = ClassSession::findOrFail($id);
        $session->update($data);

        return $session->fresh([
            'classSubject.schoolClass.center',
            'classSubject.subject',
            'teacher',
            'room',
        ]);
    }

    /**
     * @param  array             $data
     * @return SessionReschedule
     */
    public function createRescheduleLog(array $data): SessionReschedule
    {
        return SessionReschedule::create($data);
    }

    /**
     * @param  int                           $classSubjectId
     * @return Collection<int, ClassSession>
     */
    public function getByClassSubjectId(int $classSubjectId): Collection
    {
        return ClassSession::query()
            ->select(
                'id',
                'class_subject_id',
                'class_schedule_id',
                'teacher_id',
                'room_id',
                'session_date',
                'start_time',
                'end_time',
                'topic',
                'status',
                'note'
            )
            ->where('class_subject_id', $classSubjectId)
            ->with([
                'teacher:id,full_name,teacher_code',
                'room:id,name,code'
            ])
            ->orderBy('session_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();
    }

    /**
     * Lấy cursor các ca học trong quá khứ / đã điểm danh / trạng thái hoàn thành để stream tiết kiệm RAM.
     *
     * @param  int                                                               $classSubjectId
     * @param  string                                                            $fromDate
     * @return \Illuminate\Support\LazyCollection<int, \App\Models\ClassSession>
     */
    public function getPastSessionsCursor(int $classSubjectId, string $fromDate): \Illuminate\Support\LazyCollection
    {
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->where(function ($q) use ($fromDate) {
                $q->where('session_date', '<', $fromDate)
                    ->orWhere('status', '!=', 'scheduled')
                    ->orWhereHas('attendances');
            })
            ->select(['id', 'session_date', 'start_time', 'end_time', 'status'])
            ->orderBy('session_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->cursor();
    }

    /**
     * Lấy cursor các ca học tương lai có thể điều chỉnh (chưa diễn ra, chưa điểm danh) để stream tiết kiệm RAM.
     *
     * @param  int                                                               $classSubjectId
     * @param  string                                                            $fromDate
     * @return \Illuminate\Support\LazyCollection<int, \App\Models\ClassSession>
     */
    public function getFutureUnattendedSessionsCursor(int $classSubjectId, string $fromDate): \Illuminate\Support\LazyCollection
    {
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->where('session_date', '>=', $fromDate)
            ->where('status', 'scheduled')
            ->whereDoesntHave('attendances')
            ->select([
                'id',
                'class_subject_id',
                'class_schedule_id',
                'teacher_id',
                'room_id',
                'session_date',
                'start_time',
                'end_time',
                'topic',
                'status',
            ])
            ->orderBy('session_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->cursor();
    }

    /**
     * Đếm số ca học trong quá khứ hoặc đã điểm danh/chốt.
     *
     * @param  int    $classSubjectId
     * @param  string $fromDate
     * @return int
     */
    public function countPastSessions(int $classSubjectId, string $fromDate): int
    {
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->where(function ($q) use ($fromDate) {
                $q->where('session_date', '<', $fromDate)
                    ->orWhere('status', '!=', 'scheduled')
                    ->orWhereHas('attendances');
            })
            ->count();
    }

    public function countSessionsBeforeDate(int $classSubjectId, string $date): int
    {
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->where('session_date', '<', $date)
            ->count();
    }

    public function sessionExists(int $classSubjectId, string $date, string $startTime): bool
    {
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->where('session_date', $date)
            ->where('start_time', $startTime)
            ->exists();
    }

    public function createSession(array $data): ClassSession
    {
        return ClassSession::create($data);
    }

    /**
     * Bulk insert sessions theo danh sách mảng (chạy raw insert).
     *
     * @param  array<int, array<string, mixed>> $sessions
     * @return int
     */
    public function bulkInsertSessions(array $sessions): int
    {
        if (empty($sessions)) {
            return 0;
        }

        $now = now()->toDateTimeString();

        $formatted = array_map(function ($session) use ($now) {
            if (! isset($session['created_at'])) {
                $session['created_at'] = $now;
            }

            if (! isset($session['updated_at'])) {
                $session['updated_at'] = $now;
            }

            return $session;
        }, $sessions);

        ClassSession::insert($formatted);

        return count($formatted);
    }

    /**
     * Xóa hàng loạt ca học theo danh sách ID (chạy raw whereIn delete).
     *
     * @param  array<int> $ids
     * @return int
     */
    public function deleteSessionsByIds(array $ids): int
    {
        if (empty($ids)) {
            return 0;
        }

        return ClassSession::whereIn('id', $ids)->delete();
    }

    /**
     * Lấy buổi học có ngày muộn nhất của môn học.
     *
     * @param  int           $classSubjectId
     * @return ?ClassSession
     */
    public function getLatestSession(int $classSubjectId): ?ClassSession
    {
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->orderBy('session_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->first();
    }

    public function deleteFutureUnattendedSessions(int $classSubjectId, string $fromDate): int
    {
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->where('session_date', '>=', $fromDate)
            ->where('status', 'scheduled')
            ->whereDoesntHave('attendances')
            ->delete();
    }

    public function deleteFutureSessionsByScheduleId(int $classScheduleId, string $fromDate): int
    {
        return ClassSession::where('class_schedule_id', $classScheduleId)
            ->where('session_date', '>=', $fromDate)
            ->where('status', 'scheduled')
            ->whereDoesntHave('attendances')
            ->delete();
    }
}
