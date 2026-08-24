<?php

namespace App\Repositories\Tuition;

use App\Models\StudentTuition;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentTuitionRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $studentId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?string              $month
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?string $month = null
    ): LengthAwarePaginator;

    /**
     * @param  int                 $id
     * @param  array<int>|null     $allowedCenterIds
     * @return StudentTuition|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?StudentTuition;

    /**
     * @param  array<string, mixed> $data
     * @return StudentTuition
     */
    public function create(array $data): StudentTuition;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return StudentTuition
     */
    public function update(int $id, array $data): StudentTuition;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  array<int>|null      $allowedCenterIds
     * @param  ?int                 $selectedCenterId
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getSummaryStats(
        ?array $allowedCenterIds = null,
        ?int $selectedCenterId = null,
        ?int $classId = null,
        ?string $month = null
    ): array;

    /**
     * @param  int                  $studentId
     * @return array<string, mixed>
     */
    public function getStudentTuitionSummary(int $studentId): array;

    /**
     * @param  ?string                                  $search
     * @param  array<int>|int|null                      $centerIds
     * @param  ?int                                     $classId
     * @param  ?string                                  $status
     * @param  ?string                                  $month
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTuitionsForExport(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $status = null,
        ?string $month = null
    ): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getDetailedChartStats(
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $month = null
    ): array;
}
