<?php

namespace App\Services\Session;

use App\Models\Admin;
use App\Models\ClassSession;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClassSessionServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
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
     * @param  Admin|Teacher|null   $user
     * @param  ?string              $dateScope
     * @return LengthAwarePaginator
     */
    public function getPaginatedSessions(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null,
        ?int $roomId = null,
        ?string $sessionDate = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $status = null,
        int $perPage = 20,
        int $page = 1,
        Admin|Teacher|null $user = null,
        ?string $dateScope = null
    ): LengthAwarePaginator;

    /**
     * @param  int                $id
     * @param  Admin|Teacher|null $user
     * @return ClassSession
     */
    public function findSessionDetails(int $id, Admin|Teacher|null $user = null): ClassSession;

    /**
     * @param  int                $id
     * @param  array              $data
     * @param  Admin|Teacher|null $user
     * @return ClassSession
     */
    public function updateOrRescheduleSession(int $id, array $data, Admin|Teacher|null $user = null): ClassSession;

    /**
     * @param  Admin|Teacher|null $user
     * @return array
     */
    public function getFilterFormData(Admin|Teacher|null $user = null): array;

    /**
     * Tự động quét và cập nhật trạng thái các ca học theo thời gian thực.
     *
     * @return array{in_progress: int, completed: int, unattended: int}
     */
    public function autoUpdateSessionStatuses(): array;
}
