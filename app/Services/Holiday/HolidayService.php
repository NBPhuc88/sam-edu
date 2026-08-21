<?php

namespace App\Services\Holiday;

use App\Helpers\VietnamHolidayHelper;
use App\Jobs\SyncAffectedSchedulesAfterHolidayChangeJob;
use App\Models\Admin;
use App\Models\Holiday;
use App\Repositories\Holiday\HolidayRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class HolidayService implements HolidayServiceInterface
{
    public function __construct(
        protected HolidayRepositoryInterface $holidayRepository
    ) {
    }

    /**
     * Chỉ Super Admin mới có quyền quản trị ngày lễ
     * @param ?Admin $admin
     */
    protected function authorizeSuperAdmin(?Admin $admin): void
    {
        if (! $admin || ! $admin->isSuperAdmin()) {
            throw new AccessDeniedHttpException('Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền quản lý Ngày Lễ.');
        }
    }

    /**
     * @param  ?int                 $year
     * @param  ?string              $search
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedHolidays(?int $year = null, ?string $search = null, int $perPage = 15, int $page = 1, ?Admin $admin = null): LengthAwarePaginator
    {
        $this->authorizeSuperAdmin($admin);

        return $this->holidayRepository->paginate($year, $search, $perPage, $page);
    }

    /**
     * @param  int                      $year
     * @return Collection<int, Holiday>
     */
    public function getHolidaysByYear(int $year): Collection
    {
        // Tự động khởi tạo nếu năm chưa có ngày lễ nào trong DB
        $existing = $this->holidayRepository->getByYear($year);

        if ($existing->isEmpty()) {
            $this->seedDefaultHolidaysForYear($year, null, false);
            $existing = $this->holidayRepository->getByYear($year);
        }

        return $existing;
    }

    /**
     * @param  string                   $startDate
     * @param  string                   $endDate
     * @return Collection<int, Holiday>
     */
    public function getHolidaysInRange(string $startDate, string $endDate): Collection
    {
        $startYear = (int) substr($startDate, 0, 4);
        $endYear   = (int) substr($endDate, 0, 4);

        for ($y = $startYear; $y <= $endYear; $y++) {
            $this->getHolidaysByYear($y);
        }

        return $this->holidayRepository->getInRange($startDate, $endDate);
    }

    /**
     * @param  int      $id
     * @param  ?Admin   $admin
     * @return ?Holiday
     */
    public function findHoliday(int $id, ?Admin $admin = null): ?Holiday
    {
        $this->authorizeSuperAdmin($admin);

        return $this->holidayRepository->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Holiday
     */
    public function createHoliday(array $data, ?Admin $admin = null): Holiday
    {
        $this->authorizeSuperAdmin($admin);

        $dateCarbon   = Carbon::parse($data['date']);
        $data['year'] = (int) $dateCarbon->year;

        $holiday = $this->holidayRepository->create($data);

        $targetDate = $dateCarbon->format('Y-m-d');
        SyncAffectedSchedulesAfterHolidayChangeJob::dispatch('created', $targetDate, null, null, (int) $holiday->id);

        return $holiday;
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Holiday
     */
    public function updateHoliday(int $id, array $data, ?Admin $admin = null): Holiday
    {
        $this->authorizeSuperAdmin($admin);

        $holiday = $this->holidayRepository->find($id);

        if (! $holiday) {
            throw new \InvalidArgumentException("Không tìm thấy ngày lễ ID {$id}");
        }

        $oldDate = $holiday->date instanceof \DateTimeInterface ? $holiday->date->format('Y-m-d') : (string) $holiday->date;

        if (! empty($data['date'])) {
            $dateCarbon   = Carbon::parse($data['date']);
            $data['year'] = (int) $dateCarbon->year;
        }

        $updated = $this->holidayRepository->update($id, $data);
        $newDate = $updated->date instanceof \DateTimeInterface ? $updated->date->format('Y-m-d') : (string) $updated->date;

        SyncAffectedSchedulesAfterHolidayChangeJob::dispatch('updated', $newDate, $oldDate, null, (int) $id);

        return $updated;
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteHoliday(int $id, ?Admin $admin = null): bool
    {
        $this->authorizeSuperAdmin($admin);

        $holiday = $this->holidayRepository->find($id);

        if (! $holiday) {
            return false;
        }

        $targetDate = $holiday->date instanceof \DateTimeInterface ? $holiday->date->format('Y-m-d') : (string) $holiday->date;

        $deleted = $this->holidayRepository->delete($id);

        if ($deleted) {
            SyncAffectedSchedulesAfterHolidayChangeJob::dispatch('deleted', $targetDate, null, null, (int) $id);
        }

        return $deleted;
    }

    /**
     * Nạp danh sách ngày lễ mẫu cho năm nếu chưa có trong DB.
     *
     * @param  int    $year
     * @param  ?Admin $admin
     * @param  bool   $checkAuth
     * @return int
     */
    public function seedDefaultHolidaysForYear(int $year, ?Admin $admin = null, bool $checkAuth = true): int
    {
        if ($checkAuth) {
            $this->authorizeSuperAdmin($admin);
        }

        $defaults = VietnamHolidayHelper::getHolidaysForYear($year);
        $now      = now();
        $records  = [];

        foreach ($defaults as $item) {
            $dateStr     = $item['date'];
            $name        = $item['name'];
            $isLunar     = ! empty($item['is_lunar']);
            $isRecurring = ! empty($item['is_recurring']);

            $records[] = [
                'name'         => $name,
                'date'         => $dateStr,
                'year'         => $year,
                'is_lunar'     => $isLunar,
                'is_recurring' => $isRecurring,
                'description'  => $item['reason'] ?? "Ngày lễ Việt Nam năm {$year}",
                'created_at'   => $now,
                'updated_at'   => $now,
            ];
        }

        $inserted = $this->holidayRepository->insertOrIgnore($records);

        if ($inserted > 0) {
            SyncAffectedSchedulesAfterHolidayChangeJob::dispatch('seeded', null, null, $year);
        }

        return $inserted;
    }

    /**
     * @return list<int>
     */
    public function getAvailableYears(): array
    {
        $years = $this->holidayRepository->getDistinctYears();

        $currentYear = (int) now()->year;
        $allYears    = array_unique(array_merge($years, [$currentYear - 1, $currentYear, $currentYear + 1, $currentYear + 2]));
        rsort($allYears);

        return array_values($allYears);
    }

    /**
     * @return Collection<int, Holiday>
     */
    public function getAll(): Collection {
        return $this->holidayRepository->getAll();
    }
}
