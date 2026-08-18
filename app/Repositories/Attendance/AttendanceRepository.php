<?php

namespace App\Repositories\Attendance;

use App\Models\Attendance;
use App\Models\ClassSession;
use Illuminate\Support\Facades\DB;

class AttendanceRepository implements AttendanceRepositoryInterface
{
    public function findSession(int $sessionId): ?ClassSession
    {
        return ClassSession::query()
            ->with([
                'classSubject.schoolClass.students',
                'classSubject.schoolClass.center',
                'classSubject.subject',
                'classSubject.teacher',
                'teacher',
                'room',
                'attendances.student',
            ])
            ->find($sessionId);
    }

    /**
     * @param  int                                                                $sessionId
     * @param  array<int, array{student_id: int, status: string, note?: ?string}> $attendances
     * @param  ?int                                                               $markedByTeacherId
     * @param  ?int                                                               $markedByAdminId
     * @return bool
     */
    public function saveSessionAttendances(int $sessionId, array $attendances, ?int $markedByTeacherId = null, ?int $markedByAdminId = null): bool
    {
        return DB::transaction(function () use ($sessionId, $attendances, $markedByTeacherId, $markedByAdminId) {
            foreach ($attendances as $item) {
                Attendance::updateOrCreate(
                    [
                        'session_id' => $sessionId,
                        'student_id' => (int) $item['student_id'],
                    ],
                    [
                        'status'               => $item['status'] ?? 'present',
                        'note'                 => $item['note'] ?? null,
                        'marked_by_teacher_id' => $markedByTeacherId,
                        'marked_by_admin_id'   => $markedByAdminId,
                        'marked_at'            => now(),
                    ]
                );
            }

            return true;
        });
    }
}
