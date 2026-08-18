<?php

namespace App\Repositories\Room;

use App\Models\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class RoomRepository implements RoomRepositoryInterface
{
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = Room::with('center')
            ->orderBy('id', 'desc');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if (! empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    public function find(int $id, ?array $allowedCenterIds = null): ?Room
    {
        $query = Room::with('center');

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    public function create(array $data): Room
    {
        return Room::create($data);
    }

    public function update(int $id, array $data): Room
    {
        $room = Room::findOrFail($id);
        $room->update($data);

        return $room->fresh(['center']);
    }

    public function delete(int $id): bool
    {
        $room = Room::findOrFail($id);

        return (bool) $room->delete();
    }

    public function codeExists(int $centerId, string $code, ?int $ignoreId = null): bool
    {
        $query = Room::where('center_id', $centerId)
            ->where('code', $code);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    public function getByCenterIds(array $centerIds): Collection
    {
        return Room::whereIn('center_id', $centerIds)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
    }

    public function getStats(?array $allowedCenterIds = null): array
    {
        $query = Room::query();

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        $total         = (clone $query)->count();
        $active        = (clone $query)->where('status', 'active')->count();
        $inactive      = (clone $query)->where('status', 'inactive')->count();
        $totalCapacity = (int) ((clone $query)->where('status', 'active')->sum('capacity') ?? 0);

        return [
            'total'          => $total,
            'active'         => $active,
            'inactive'       => $inactive,
            'total_capacity' => $totalCapacity,
        ];
    }
}
