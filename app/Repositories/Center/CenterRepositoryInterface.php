<?php

namespace App\Repositories\Center;

use App\Models\Center;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CenterRepositoryInterface
{
    /**
     * Get paginated centers list with optional search query.
     * @param int     $perPage
     * @param ?string $search
     */
    public function paginate(int $perPage = 15, ?string $search = null): LengthAwarePaginator;

    /**
     * Find a center by ID.
     * @param int $id
     */
    public function find(int $id): Center;

    /**
     * Create a new center.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Center;

    /**
     * Update an existing center by ID with provided data array.
     *
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function update(int $id, array $data): Center;

    /**
     * Soft delete a center by ID.
     * @param int $id
     */
    public function delete(int $id): bool;

    public function count(): int;

    /**
     * @param  ?array<int, int>                                      $centerIds
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getActiveCenters(?array $centerIds = null): \Illuminate\Database\Eloquent\Collection;

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getCenterListForDropdown(): \Illuminate\Database\Eloquent\Collection;

    public function codeExists(string $code): bool;

    /**
     * @param  int                                                   $limit
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getLatest(int $limit = 5): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  array<int, int>                                       $ids
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getWithCounts(array $ids): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  array<int, int>                                       $ids
     * @param  array<int, string>                                    $columns
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getByIds(array $ids, array $columns = ['id', 'code', 'name']): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  \Carbon\CarbonInterface                               $start
     * @param  \Carbon\CarbonInterface                               $end
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getCreatedBetween(\Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  \Carbon\CarbonInterface                               $start
     * @param  \Carbon\CarbonInterface                               $end
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getExpiringBetween(\Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  array<int, int>                                       $ids
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getByIdsCollection(array $ids): \Illuminate\Database\Eloquent\Collection;

    public function countInYearMonth(int $year, int $month): int;
}
