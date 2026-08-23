<?php

namespace App\Repositories\Center;

use App\Models\Center;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CenterRepository implements CenterRepositoryInterface
{
    /**
     * Get paginated centers list with optional search query.
     * @param int     $perPage
     * @param ?string $search
     */
    public function paginate(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = Center::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Optimized pagination with Deferred Join Subquery Pattern
        $page   = request()->integer('page', 1);
        $offset = max(0, ($page - 1) * $perPage);

        $idQuery = (clone $query)->select('id')->latest('id');

        if ($offset > 0) {
            $idQuery->offset($offset)->limit($perPage);
            $targetIds = $idQuery->pluck('id')->toArray();

            if (! empty($targetIds)) {
                return Center::query()
                    ->select(
                        'id',
                        'code',
                        'name',
                        'email',
                        'phone',
                        'address',
                        'status',
                        'subscription_plan',
                        'expires_at',
                        'created_at'
                    )
                    ->whereIn('id', $targetIds)
                    ->withCount(['students', 'classes', 'teachers'])
                    ->latest('id')
                    ->deferredPaginate($perPage);
            }
        }

        return $query->select(
            'id',
            'code',
            'name',
            'email',
            'phone',
            'address',
            'status',
            'subscription_plan',
            'expires_at',
            'created_at'
        )
            ->withCount(['students', 'classes', 'teachers'])
            ->latest('id')
            ->deferredPaginate($perPage);
    }

    /**
     * Find a center by ID.
     * @param int $id
     */
    public function find(int $id): Center
    {
        return Center::findOrFail($id);
    }

    /**
     * Create a new center.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Center
    {
        return Center::create($data);
    }

    /**
     * Update an existing center by ID with provided data array.
     *
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function update(int $id, array $data): Center
    {
        $center = $this->find($id);
        $center->update($data);

        return $center->fresh();
    }

    /**
     * Soft delete a center by ID.
     * @param int $id
     */
    public function delete(int $id): bool
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            $center = $this->find($id);

            // 1. Soft delete tất cả lớp học thuộc trung tâm
            $classIds = \App\Models\SchoolClass::where('center_id', $id)->pluck('id')->toArray();

            foreach ($classIds as $classId) {
                app(\App\Repositories\Class\SchoolClassRepositoryInterface::class)->delete($classId);
            }

            // 2. Soft delete giáo viên, học sinh, môn học, phòng học, đề thi, học phí
            \App\Models\Teacher::where('center_id', $id)->delete();
            \App\Models\Student::where('center_id', $id)->delete();
            \App\Models\Subject::where('center_id', $id)->delete();
            \App\Models\Room::where('center_id', $id)->delete();
            \App\Models\Exam::where('center_id', $id)->delete();
            \App\Models\StudentTuition::where('center_id', $id)->delete();

            return (bool) $center->delete();
        });
    }

    public function count(): int
    {
        return Center::count();
    }

    /**
     * @param  ?array<int, int>                                      $centerIds
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getActiveCenters(?array $centerIds = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Center::select(
            'id',
            'code',
            'name',
            'email',
            'phone',
            'status'
        )
        ->where('status', 'active');

        if ($centerIds !== null) {
            $query->whereIn('id', $centerIds);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getCenterListForDropdown(): \Illuminate\Database\Eloquent\Collection
    {
        return Center::select('id', 'name', 'code')->orderBy('name')->get();
    }

    public function codeExists(string $code): bool
    {
        return Center::where('code', $code)->exists();
    }

    /**
     * @param  int                                                   $limit
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getLatest(int $limit = 5): \Illuminate\Database\Eloquent\Collection
    {
        return Center::select(
            'id',
            'code',
            'name',
            'email',
            'phone',
            'status',
            'created_at'
        )
        ->latest()
        ->take($limit)
        ->get();
    }

    /**
     * @param  array<int, int>                                       $ids
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getWithCounts(array $ids): \Illuminate\Database\Eloquent\Collection
    {
        return Center::select(
            'id',
            'code',
            'name',
            'email',
            'phone',
            'status'
        )
        ->whereIn('id', $ids)
        ->withCount(['students', 'classes', 'teachers'])
        ->get();
    }

    /**
     * @param  array<int, int>                                       $ids
     * @param  array<int, string>                                    $columns
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getByIds(array $ids, array $columns = ['id', 'code', 'name']): \Illuminate\Database\Eloquent\Collection
    {
        return Center::whereIn('id', $ids)->get($columns);
    }

    /**
     * @param  \Carbon\CarbonInterface                               $start
     * @param  \Carbon\CarbonInterface                               $end
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getCreatedBetween(\Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): \Illuminate\Database\Eloquent\Collection
    {
        return Center::select(
            'id',
            'code',
            'name',
            'email',
            'phone',
            'status',
            'subscription_plan',
            'plan_type',
            'created_at'
        )
        ->whereBetween('created_at', [$start, $end])
        ->get();
    }

    /**
     * @param  \Carbon\CarbonInterface                               $start
     * @param  \Carbon\CarbonInterface                               $end
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getExpiringBetween(\Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): \Illuminate\Database\Eloquent\Collection
    {
        return Center::select(
            'id',
            'code',
            'name',
            'email',
            'phone',
            'status',
            'subscription_plan',
            'plan_type',
            'expires_at'
        )
        ->whereBetween('expires_at', [$start, $end])
        ->get();
    }

    /**
     * @param  array<int, int>                                       $ids
     * @return \Illuminate\Database\Eloquent\Collection<int, Center>
     */
    public function getByIdsCollection(array $ids): \Illuminate\Database\Eloquent\Collection
    {
        return Center::select(
            'id',
            'code',
            'name',
            'email',
            'phone',
            'status',
            'subscription_plan',
            'plan_type'
        )
        ->whereIn('id', $ids)
        ->get();
    }

    public function countInYearMonth(int $year, int $month): int
    {
        return Center::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count();
    }
}
