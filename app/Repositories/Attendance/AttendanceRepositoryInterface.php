<?php

namespace App\Repositories\Attendance;

use App\Models\ClassSession;

interface AttendanceRepositoryInterface
{
    public function findSession(int $sessionId): ?ClassSession;

    /**
     * @param  int                                                                $sessionId
     * @param  array<int, array{student_id: int, status: string, note?: ?string}> $attendances
     * @param  ?int                                                               $markedByTeacherId
     * @param  ?int                                                               $markedByAdminId
     * @return bool
     */
    public function saveSessionAttendances(int $sessionId, array $attendances, ?int $markedByTeacherId = null, ?int $markedByAdminId = null): bool;
}
