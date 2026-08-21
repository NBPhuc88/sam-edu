<?php

namespace App\Repositories\Holiday;

use App\Models\Holiday;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface HolidayRepositoryInterface
{
    /**
     * @param  ?int                 $year
     * @param  ?string              $search
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(?int $year = null, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator;

    /**
     * @param  int                      $year
     * @return Collection<int, Holiday>
     */
    public function getByYear(int $year): Collection;

    /**
     * @param  string                   $startDate
     * @param  string                   $endDate
     * @return Collection<int, Holiday>
     */
    public function getInRange(string $startDate, string $endDate): Collection;

    /**
     * @param  int      $id
     * @return ?Holiday
     */
    public function find(int $id): ?Holiday;

    /**
     * @param  string   $date
     * @return ?Holiday
     */
    public function findByDate(string $date): ?Holiday;

    /**
     * @param  array<string, mixed> $data
     * @return Holiday
     */
    public function create(array $data): Holiday;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Holiday
     */
    public function update(int $id, array $data): Holiday;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  list<array<string, mixed>> $records
     * @return int
     */
    public function insertOrIgnore(array $records): int;

    /**
     * @return list<int>
     */
    public function getDistinctYears(): array;

    /**
     * @return Collection<int, Holiday>
     */
    public function getAll(): Collection;
}
