<?php

namespace App\Repositories\Subject;

use App\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SubjectRepository implements SubjectRepositoryInterface
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
    ): LengthAwarePaginator {
        $query = Subject::query()->with('center');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhereHas('center', function ($cq) use ($term) {
                        $cq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Subject|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Subject
    {
        $query = Subject::query()->with('center');

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function create(array $data): Subject
    {
        return Subject::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function update(int $id, array $data): Subject
    {
        $subject = Subject::findOrFail($id);
        $subject->update($data);

        return $subject;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $subject = Subject::findOrFail($id);

        return (bool) $subject->delete();
    }

    public function codeExists(int $centerId, string $code): bool
    {
        return Subject::where('center_id', $centerId)->where('code', $code)->exists();
    }

    /**
     * @param  array<int, int>                                        $centerIds
     * @return \Illuminate\Database\Eloquent\Collection<int, Subject>
     */
    public function getByCenterIds(array $centerIds): \Illuminate\Database\Eloquent\Collection
    {
        return Subject::whereIn('center_id', $centerIds)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
    }
}
