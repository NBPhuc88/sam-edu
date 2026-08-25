<?php

namespace App\Repositories\Attendance;

use App\Models\Attendance;
use App\Models\ClassSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceRepository implements AttendanceRepositoryInterface
{
    public function findSession(int $sessionId): ?ClassSession
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
            ->with([
                'classSubject:id,class_id,subject_id,teacher_id',
                'classSubject.schoolClass:id,center_id,name,code',
                'classSubject.schoolClass.students:id,student_code,full_name,email,phone',
                'classSubject.schoolClass.center:id,name,code',
                'classSubject.subject:id,name,code,total_sessions,duration_minutes',
                'classSubject.teacher:id,full_name,teacher_code',
                'teacher:id,full_name,teacher_code',
                'room:id,name',
                'attendances:id,session_id,student_id,status,note,marked_by_teacher_id,marked_by_admin_id,marked_at',
                'attendances.student:id,student_code,full_name,email,phone',
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

    public function resetSessionAttendance(int $sessionId): bool
    {
        return DB::transaction(function () use ($sessionId) {
            Attendance::where('session_id', $sessionId)->delete();

            $session = ClassSession::find($sessionId);

            if ($session) {
                $sessionDate = $session->getRawOriginal('session_date') ?? (is_string($session->session_date) ? $session->session_date : $session->session_date->toDateString());
                $sessionEnd  = Carbon::parse($sessionDate . ' ' . $session->end_time);
                $isPast      = $sessionEnd->isPast();
                $newStatus   = $isPast ? 'unattended' : 'scheduled';
                $session->update(['status' => $newStatus]);
            }

            return true;
        });
    }
}
