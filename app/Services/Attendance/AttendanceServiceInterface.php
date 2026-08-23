<?php

namespace App\Services\Attendance;

use App\Models\Admin;
use App\Models\Teacher;

interface AttendanceServiceInterface
{
    /**
     * @param  int                  $sessionId
     * @param  Admin|Teacher|null   $user
     * @return array<string, mixed>
     */
    public function getSessionAttendanceData(int $sessionId, Admin|Teacher|null $user = null): array;

    /**
     * @param  int                                                                $sessionId
     * @param  array<int, array{student_id: int, status: string, note?: ?string}> $attendances
     * @param  Admin|Teacher|null                                                 $user
     * @return bool
     */
    public function saveAttendance(int $sessionId, array $attendances, Admin|Teacher|null $user = null): bool;

    /**
     * @param  int                $sessionId
     * @param  Admin|Teacher|null $user
     * @return bool
     */
    public function resetAttendance(int $sessionId, Admin|Teacher|null $user = null): bool;

    /**
     * @param  int                       $teacherId
     * @return ?\App\Models\ClassSession
     */
    public function getTodayTeacherSession(int $teacherId): ?\App\Models\ClassSession;
}
