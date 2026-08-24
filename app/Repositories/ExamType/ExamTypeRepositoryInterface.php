<?php

namespace App\Repositories\ExamType;

use App\Enums\Constant;
use App\Models\ExamType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ExamTypeRepositoryInterface
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
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): LengthAwarePaginator;

    /**
     * @param  array<int>|int|null       $centerIds
     * @return Collection<int, ExamType>
     */
    public function getAllActive(array|int|null $centerIds = null): Collection;

    /**
     * @param  int                       $centerId
     * @return Collection<int, ExamType>
     */
    public function getByCenterOnly(int $centerId): Collection;

    /**
     * @param  int       $id
     * @return ?ExamType
     */
    public function findById(int $id): ?ExamType;

    /**
     * @param  array<string, mixed> $data
     * @return ExamType
     */
    public function create(array $data): ExamType;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return ExamType
     */
    public function update(int $id, array $data): ExamType;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  ?int   $centerId
     * @param  string $code
     * @param  ?int   $ignoreId
     * @return bool
     */
    public function codeExists(?int $centerId, string $code, ?int $ignoreId = null): bool;

    /**
     * @param  ?int   $centerId
     * @return string
     */
    public function generateUniqueCode(?int $centerId = null): string;
}
