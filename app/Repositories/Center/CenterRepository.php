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
                    ->whereIn('id', $targetIds)
                    ->withCount(['students', 'classes', 'teachers'])
                    ->latest('id')
                    ->paginate($perPage);
            }
        }

        return $query->withCount(['students', 'classes', 'teachers'])
            ->latest('id')
            ->paginate($perPage);
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
        $center = $this->find($id);

        return (bool) $center->delete();
    }
}
