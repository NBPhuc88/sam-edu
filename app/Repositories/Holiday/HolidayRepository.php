<?php

namespace App\Repositories\Holiday;

use App\Models\Holiday;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class HolidayRepository implements HolidayRepositoryInterface
{
    /**
     * @param  ?int                 $year
     * @param  ?string              $search
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(?int $year = null, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $query = Holiday::query();

        if ($year) {
            $query->where('year', $year);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('date', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('date', 'asc')->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int                      $year
     * @return Collection<int, Holiday>
     */
    public function getByYear(int $year): Collection
    {
        return Holiday::where('year', $year)->orderBy('date', 'asc')->get();
    }

    /**
     * @param  string                   $startDate
     * @param  string                   $endDate
     * @return Collection<int, Holiday>
     */
    public function getInRange(string $startDate, string $endDate): Collection
    {
        return Holiday::whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'asc')
            ->get();
    }

    /**
     * @param  int      $id
     * @return ?Holiday
     */
    public function find(int $id): ?Holiday
    {
        return Holiday::find($id);
    }

    /**
     * @param  string   $date
     * @return ?Holiday
     */
    public function findByDate(string $date): ?Holiday
    {
        return Holiday::where('date', $date)->first();
    }

    /**
     * @param  array<string, mixed> $data
     * @return Holiday
     */
    public function create(array $data): Holiday
    {
        return Holiday::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Holiday
     */
    public function update(int $id, array $data): Holiday
    {
        $holiday = Holiday::findOrFail($id);
        $holiday->update($data);

        return $holiday->refresh();
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $holiday = Holiday::find($id);

        if (! $holiday) {
            return false;
        }

        return (bool) $holiday->delete();
    }

    /**
     * @param  list<array<string, mixed>> $records
     * @return int
     */
    public function insertOrIgnore(array $records): int
    {
        if (empty($records)) {
            return 0;
        }

        return Holiday::insertOrIgnore($records);
    }

    /**
     * @return list<int>
     */
    public function getDistinctYears(): array
    {
        return Holiday::query()
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->map(fn ($y) => (int) $y)
            ->values()
            ->toArray();
    }

    /**
     * @return Collection<int, Holiday>
     */
    public function getAll(): Collection
    {
        return Holiday::whereBetween('date', [
            now()->toDateString(),
            now()->addYear()->endOfYear()->toDateString()
        ])->orderBy('date', 'asc')->get();
    }
}
