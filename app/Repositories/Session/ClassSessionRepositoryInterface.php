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

    /**
     * Lấy cursor các ca học trong quá khứ / đã điểm danh / trạng thái hoàn thành để stream tiết kiệm RAM.
     *
     * @param  int                                                   $classSubjectId
     * @param  string                                                $fromDate
     * @return \Illuminate\Support\LazyCollection<int, ClassSession>
     */
    public function getPastSessionsCursor(int $classSubjectId, string $fromDate): \Illuminate\Support\LazyCollection;

    /**
     * Lấy cursor các ca học tương lai có thể điều chỉnh (chưa diễn ra, chưa điểm danh) để stream tiết kiệm RAM.
     *
     * @param  int                                                   $classSubjectId
     * @param  string                                                $fromDate
     * @return \Illuminate\Support\LazyCollection<int, ClassSession>
     */
    public function getFutureUnattendedSessionsCursor(int $classSubjectId, string $fromDate): \Illuminate\Support\LazyCollection;

    /**
     * Đếm số ca học trong quá khứ hoặc đã điểm danh/chốt.
     *
     * @param  int    $classSubjectId
     * @param  string $fromDate
     * @return int
     */
    public function countPastSessions(int $classSubjectId, string $fromDate): int;

    public function countSessionsBeforeDate(int $classSubjectId, string $date): int;

    public function sessionExists(int $classSubjectId, string $date, string $startTime): bool;

    /**
     * @param array<string, mixed> $data
     */
    public function createSession(array $data): ClassSession;

    /**
     * Bulk insert sessions theo danh sách mảng (chạy raw insert).
     *
     * @param  array<int, array<string, mixed>> $sessions
     * @return int
     */
    public function bulkInsertSessions(array $sessions): int;

    /**
     * Xóa hàng loạt ca học theo danh sách ID (chạy raw whereIn delete).
     *
     * @param  array<int> $ids
     * @return int
     */
    public function deleteSessionsByIds(array $ids): int;

    /**
     * Lấy buổi học có ngày muộn nhất của môn học.
     *
     * @param  int           $classSubjectId
     * @return ?ClassSession
     */
    public function getLatestSession(int $classSubjectId): ?ClassSession;

    public function deleteFutureUnattendedSessions(int $classSubjectId, string $fromDate): int;

    public function deleteFutureSessionsByScheduleId(int $classScheduleId, string $fromDate): int;
}
