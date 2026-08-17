<?php

namespace App\Repositories\Subject;

use App\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SubjectRepositoryInterface
{
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
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator;

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Subject|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Subject;

    /**
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function create(array $data): Subject;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function update(int $id, array $data): Subject;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;
}
