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
            ->with([
                'classSubject.schoolClass.center',
                'classSubject.subject',
                'teacher',
                'room',
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
        return ClassSession::with([
            'classSubject.schoolClass.center',
            'classSubject.schoolClass.classStudents.student',
            'classSubject.subject',
            'classSubject.teacher',
            'classSchedule',
            'teacher',
            'room',
            'attendances.student',
            'reschedules.oldRoom',
            'reschedules.newRoom',
            'reschedules.changedByAdmin',
            'reschedules.changedByTeacher',
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
        return ClassSession::where('class_subject_id', $classSubjectId)
            ->with(['teacher', 'room'])
            ->orderBy('session_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();
    }
}
