<?php

namespace App\Repositories\Session;

use App\Models\ClassSession;
use App\Models\SessionReschedule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ClassSessionRepositoryInterface
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
    ): LengthAwarePaginator;

    /**
     * @param  int           $id
     * @return ?ClassSession
     */
    public function findById(int $id): ?ClassSession;

    /**
     * @param  int           $id
     * @return ?ClassSession
     */
    public function findWithDetails(int $id): ?ClassSession;

    /**
     * @param  int          $id
     * @param  array        $data
     * @return ClassSession
     */
    public function update(int $id, array $data): ClassSession;

    /**
     * @param  array             $data
     * @return SessionReschedule
     */
    public function createRescheduleLog(array $data): SessionReschedule;

    /**
     * @param  int                           $classSubjectId
     * @return Collection<int, ClassSession>
     */
    public function getByClassSubjectId(int $classSubjectId): Collection;

    public function countPastSessions(int $classSubjectId, string $date, ?string $startTime): int;

    public function countSessionsBeforeDate(int $classSubjectId, string $date): int;

    public function sessionExists(int $classSubjectId, string $date, string $startTime): bool;

    /**
     * @param array<string, mixed> $data
     */
    public function createSession(array $data): ClassSession;

    public function deleteFutureUnattendedSessions(int $classSubjectId, string $fromDate): int;

    public function deleteFutureSessionsByScheduleId(int $classScheduleId, string $fromDate): int;
}
