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
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
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
     * @return array<string, mixed>
     */
    public function getSummaryStats(?array $allowedCenterIds = null): array;
}
