<?php

namespace App\Services\Holiday;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Holiday;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface HolidayServiceInterface
{
    /**
     * @param  ?int                 $year
     * @param  ?string              $search
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedHolidays(?int $year = null, ?string $search = null, int $perPage = Constant::DEFAULT_PER_PAGE, int $page = Constant::DEFAULT_PAGE, ?Admin $admin = null): LengthAwarePaginator;

    /**
     * @param  int                      $year
     * @return Collection<int, Holiday>
     */
    public function getHolidaysByYear(int $year): Collection;

    /**
     * @param  string                   $startDate
     * @param  string                   $endDate
     * @return Collection<int, Holiday>
     */
    public function getHolidaysInRange(string $startDate, string $endDate): Collection;

    /**
     * @param  int      $id
     * @param  ?Admin   $admin
     * @return ?Holiday
     */
    public function findHoliday(int $id, ?Admin $admin = null): ?Holiday;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Holiday
     */
    public function createHoliday(array $data, ?Admin $admin = null): Holiday;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Holiday
     */
    public function updateHoliday(int $id, array $data, ?Admin $admin = null): Holiday;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteHoliday(int $id, ?Admin $admin = null): bool;

    /**
     * Nạp danh sách ngày lễ mặc định theo năm nếu chưa có.
     *
     * @param  int    $year
     * @param  ?Admin $admin
     * @return int    Số ngày lễ được tạo mới
     */
    public function seedDefaultHolidaysForYear(int $year, ?Admin $admin = null): int;

    /**
     * @return list<int>
     */
    public function getAvailableYears(): array;

    /**
     * @return Collection<int, Holiday>
     */
    public function getAll(): Collection;
}
