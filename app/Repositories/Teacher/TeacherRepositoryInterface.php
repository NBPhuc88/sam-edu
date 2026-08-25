<?php

namespace App\Repositories\Teacher;

use App\Enums\Constant;
use App\Models\ClassSession;
use App\Models\Teacher;
use Generator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

interface TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher;

    /**
     * @param  ?int                    $centerId
     * @return Generator<int, Teacher>
     */
    public function getTeachersCursor(?int $centerId = null): Generator;

    public function findByCode(string $teacherCode): ?Teacher;

    /**
     * @param string               $teacherCode
     * @param array<string, mixed> $data
     */
    public function updateOrCreateByCode(string $teacherCode, array $data): Teacher;

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
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): LengthAwarePaginator;

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Teacher|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Teacher;

    /**
     * @param  array<string, mixed> $data
     * @return Teacher
     */
    public function create(array $data): Teacher;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Teacher
     */
    public function update(int $id, array $data): Teacher;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    public function count(): int;

    /**
     * @param array<int, int> $centerIds
     */
    public function countByCenterIds(array $centerIds): int;

    public function codeExists(int $centerId, string $code): bool;

    /**
     * @param int             $year
     * @param int             $month
     * @param array<int, int> $centerIds
     */
    public function countInYearMonthAndCenterIds(int $year, int $month, array $centerIds = []): int;

    /**
     * @param  int                           $teacherId
     * @param  string                        $startDate (Y-m-d)
     * @param  string                        $endDate   (Y-m-d)
     * @return Collection<int, ClassSession>
     */
    public function getTeacherSessionsBetweenDates(int $teacherId, string $startDate, string $endDate): Collection;

    /**
     * @param  int               $teacherId
     * @return SupportCollection
     */
    public function getTeacherWeeklySchedules(int $teacherId): SupportCollection;

    /**
     * @param  ?array<int>              $allowedCenterIds
     * @param  array<string>            $columns
     * @return Collection<int, Teacher>
     */
    public function getActiveTeachers(?array $allowedCenterIds = null, array $columns = ['id', 'full_name', 'teacher_code', 'center_id']): Collection;

    /**
     * @param  int                                                                                            $teacherId
     * @param  ?string                                                                                        $startDate
     * @param  ?string                                                                                        $endDate
     * @param  ?int                                                                                           $perPage
     * @param  int                                                                                            $page
     * @return array{sessions: Collection<int, ClassSession>|LengthAwarePaginator, stats: array<string, int>}
     */
    public function getTeacherSessionStats(
        int $teacherId,
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $perPage = null,
        int $page = 1
    ): array;
}
